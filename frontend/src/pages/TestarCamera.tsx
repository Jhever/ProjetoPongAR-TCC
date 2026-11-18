import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Vision from '@mediapipe/tasks-vision';
import { useConfig } from '../context/ConfigContext';

type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

type FingerInfo = {
  name: FingerName;
  mcp: number;
  pip: number;
  dip: number;
  tip: number;
  hide: number[];
  isThumb?: boolean;
};

const FINGERS: FingerInfo[] = [
  { name: 'thumb', mcp: 1, pip: 2, dip: 3, tip: 4, hide: [2, 3, 4], isThumb: true },
  { name: 'index', mcp: 5, pip: 6, dip: 7, tip: 8, hide: [6, 7, 8] },
  { name: 'middle', mcp: 9, pip: 10, dip: 11, tip: 12, hide: [10, 11, 12] },
  { name: 'ring', mcp: 13, pip: 14, dip: 15, tip: 16, hide: [14, 15, 16] },
  { name: 'pinky', mcp: 17, pip: 18, dip: 19, tip: 20, hide: [18, 19, 20] },
];

const INITIAL_HIDDEN_COUNTERS: Record<FingerName, number> = {
  thumb: 0,
  index: 0,
  middle: 0,
  ring: 0,
  pinky: 0,
};

function dist2D(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const abLen = Math.hypot(abx, aby);
  const cbLen = Math.hypot(cbx, cby);

  if (abLen === 0 || cbLen === 0) return 180;

  const cos = dot / (abLen * cbLen);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function pointInPolygon(point: Landmark, polygon: Landmark[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.000001) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

function detectHiddenFingers(landmarks: Landmark[]): Record<FingerName, boolean> {
  const result: Record<FingerName, boolean> = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  };

  const palmPolygon = [
    landmarks[0],
    landmarks[5],
    landmarks[9],
    landmarks[13],
    landmarks[17],
  ];

  const palmSize = Math.max(
    dist2D(landmarks[0], landmarks[9]),
    dist2D(landmarks[5], landmarks[17]),
    0.0001,
  );

  for (const finger of FINGERS) {
    const mcp = landmarks[finger.mcp];
    const pip = landmarks[finger.pip];
    const dip = landmarks[finger.dip];
    const tip = landmarks[finger.tip];

    const fingerLength =
      dist2D(mcp, pip) + dist2D(pip, dip) + dist2D(dip, tip);

    const span = dist2D(mcp, tip);
    const curlRatio = span / Math.max(fingerLength, 0.0001);

    const pipAngle = angleDeg(mcp, pip, dip);
    const dipAngle = angleDeg(pip, dip, tip);

    const isBent = pipAngle < 145 || dipAngle < 145;
    const tipInsidePalm = pointInPolygon(tip, palmPolygon);
    const dipInsidePalm = pointInPolygon(dip, palmPolygon);
    const closeToPalmCenter = dist2D(tip, landmarks[9]) < palmSize * 0.9;

    if (finger.isThumb) {
      result[finger.name] =
        tipInsidePalm || dipInsidePalm || (curlRatio < 0.55 && closeToPalmCenter);
    } else {
      result[finger.name] =
        (tipInsidePalm && curlRatio < 0.85) ||
        (dipInsidePalm && curlRatio < 0.85) ||
        curlRatio < 0.52 ||
        (isBent && closeToPalmCenter);
    }
  }

  return result;
}

function buildHiddenMask(
  landmarks: Landmark[],
  counters: Record<FingerName, number>,
): boolean[] {
  const rawHidden = detectHiddenFingers(landmarks);
  const hiddenMask = new Array<boolean>(21).fill(false);

  for (const finger of FINGERS) {
    if (rawHidden[finger.name]) {
      counters[finger.name] = Math.min(counters[finger.name] + 1, 4);
    } else {
      counters[finger.name] = Math.max(counters[finger.name] - 1, 0);
    }

    if (counters[finger.name] >= 2) {
      for (const index of finger.hide) {
        hiddenMask[index] = true;
      }
    }
  }

  return hiddenMask;
}

const TestarCamera = () => {
  const navigate = useNavigate();
  const { isDark } = useConfig();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const landmarkerRef = useRef<Vision.HandLandmarker | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const hiddenFingerCountersRef = useRef<Record<FingerName, number>>({
    ...INITIAL_HIDDEN_COUNTERS,
  });

  const statusRef = useRef('CARREGANDO MODELO...');
  const pontosRef = useRef(0);

  const [landmarker, setLandmarker] = useState<Vision.HandLandmarker | null>(null);
  const [status, setStatus] = useState('CARREGANDO MODELO...');
  const [pontos, setPontos] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const updateStatus = useCallback((value: string) => {
    if (statusRef.current !== value) {
      statusRef.current = value;
      setStatus(value);
    }
  }, []);

  const updatePontos = useCallback((value: number) => {
    if (pontosRef.current !== value) {
      pontosRef.current = value;
      setPontos(value);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    }
    lastVideoTimeRef.current = -1;
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Erro ao tentar entrar em tela cheia:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Erro ao tentar sair de tela cheia:", err);
      });
    }
  };

  useEffect(() => {
    let disposed = false;
    let createdLandmarker: Vision.HandLandmarker | null = null;

    const initVision = async () => {
      try {
        const vision = await Vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        );

        if (disposed) return;

        const created = await Vision.HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        createdLandmarker = created;

        if (disposed) {
          created.close();
          return;
        }

        landmarkerRef.current = created;
        setLandmarker(created);
        updateStatus('PRONTO PARA INICIAR');
      } catch (error) {
        console.error('Erro ao carregar MediaPipe:', error);
        updateStatus('ERRO AO CARREGAR MODELO');
      }
    };

    initVision();

    return () => {
      disposed = true;
      stopCamera();

      if (createdLandmarker) {
        createdLandmarker.close();
      }

      if (landmarkerRef.current && landmarkerRef.current !== createdLandmarker) {
        landmarkerRef.current.close();
      }

      landmarkerRef.current = null;
    };
  }, [stopCamera, updateStatus]);

  const iniciarTeste = async () => {
    const currentLandmarker = landmarkerRef.current;

    if (!currentLandmarker || !canvasRef.current || !videoRef.current) {
      return;
    }

    try {
      stopCamera();

      hiddenFingerCountersRef.current = {
        ...INITIAL_HIDDEN_COUNTERS,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60 },
          facingMode: 'user',
        },
        audio: false,
      });

      activeStreamRef.current = stream;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      video.srcObject = stream;
      
      // ==========================================
      // CORREÇÃO DO ABORT ERROR AO INICIAR A CÂMERA
      // ==========================================
      try {
        await video.play();
      } catch (playError: any) {
        if (playError.name !== 'AbortError') {
          throw playError;
        }
      }

      setIsCameraActive(true);
      canvas.width = 640;
      canvas.height = 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível criar o contexto 2D do canvas.');
      }

      const drawingUtils = new Vision.DrawingUtils(ctx);

      const predict = () => {
        const currentVideo = videoRef.current;
        const currentCanvas = canvasRef.current;
        const activeLandmarker = landmarkerRef.current;

        if (!currentVideo || !currentCanvas || !activeLandmarker) {
          return;
        }

        if (
          currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          currentVideo.currentTime !== lastVideoTimeRef.current
        ) {
          lastVideoTimeRef.current = currentVideo.currentTime;
          const results = activeLandmarker.detectForVideo(
            currentVideo,
            performance.now(),
          );

          ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

          if (results.landmarks && results.landmarks.length > 0) {
            updateStatus('MÃO DETECTADA / RASTREANDO');

            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d4ff';

            let totalPontosVisiveis = 0;

            for (const landmarksOriginal of results.landmarks) {
              const landmarks = landmarksOriginal as Landmark[];

              const hiddenMask = buildHiddenMask(
                landmarks,
                hiddenFingerCountersRef.current,
              );

              const conexoesValidas = Vision.HandLandmarker.HAND_CONNECTIONS.filter(
                (connection) => {
                  const { start, end } = connection as {
                    start: number;
                    end: number;
                  };
                  return !hiddenMask[start] && !hiddenMask[end];
                },
              );

              const pontosVisiveis = landmarks.filter((_, index) => {
                return !hiddenMask[index];
              });

              totalPontosVisiveis += pontosVisiveis.length;

              // Cor neon da linha
              drawingUtils.drawConnectors(
                landmarksOriginal as any,
                conexoesValidas as any,
                {
                  color: '#00d4ff', 
                  lineWidth: 3,
                },
              );

              // Cor neon dos pontos
              drawingUtils.drawLandmarks(pontosVisiveis as any, {
                color: '#ffffff',
                lineWidth: 1,
                radius: 4,
              });
            }

            updatePontos(totalPontosVisiveis);
            ctx.shadowBlur = 0;
          } else {
            updateStatus('PROCURANDO MÃO...');
            updatePontos(0);

            hiddenFingerCountersRef.current = {
              ...INITIAL_HIDDEN_COUNTERS,
            };
          }
        }

        animationFrameRef.current = requestAnimationFrame(predict);
      };

      predict();
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      alert(`Erro ao acessar câmera. Verifique as permissões do navegador.`);
    }
  };

  const voltarParaInicio = () => {
    stopCamera();
    navigate('/home');
  };

  return (
    <div
      style={{
        backgroundColor: '#050505',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Courier New', Courier, monospace",
        color: '#e2e8f0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Luzes difusas no fundo da tela */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Título Principal */}
      <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#00d4ff', margin: 0, fontSize: '2.5rem', fontStyle: 'italic', letterSpacing: '4px', textShadow: '0 0 15px rgba(0, 212, 255, 0.4)' }}>
          AR VISION TEST
        </h1>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#94a3b8', letterSpacing: '6px' }}>DIAGNÓSTICO DE CÂMERA</h2>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '30px',
          width: '100%',
          maxWidth: '1200px',
          zIndex: 1,
        }}
      >
        {/* PAINEL ESQUERDO: TÍTULO E STATUS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '280px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#38bdf8', letterSpacing: '2px', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '10px' }}>
              SYS_STATUS
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#94a3b8' }}>IA SENSOR:</p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: status.includes('ERRO') ? '#ef4444' : (status.includes('DETECTADA') ? '#4ade80' : '#facc15') }}>
                {status}
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#94a3b8' }}>PONTOS RASTREADOS:</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.4)' }}>
                {pontos} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 21</span>
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${(pontos / 21) * 100}%`, 
                backgroundColor: '#4ade80',
                transition: 'width 0.2s ease-out',
                boxShadow: '0 0 10px #4ade80'
              }} />
            </div>
          </div>
        </div>

        {/* CENTRO: VÍDEO E CANVAS COM TELA CHEIA */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '640px',
            aspectRatio: '4/3',
            border: `2px solid ${isCameraActive ? '#00d4ff' : '#333'}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isCameraActive ? '0 0 30px rgba(0, 212, 255, 0.15)' : '0 10px 40px rgba(0,0,0,0.6)',
            backgroundColor: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!isCameraActive && (
             <div style={{ color: '#64748b', fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}>
               [ FEED OFFLINE ]<br/>
               <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Aguardando inicialização da câmera</span>
             </div>
          )}

          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
              objectFit: 'cover',
              opacity: isCameraActive ? 1 : 0
            }}
            autoPlay
            playsInline
            muted
          />

          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Marcadores visuais HUD de câmera */}
          {isCameraActive && (
            <>
              <div style={{ position: 'absolute', top: 15, left: 15, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.5)', borderLeft: '2px solid rgba(255,255,255,0.5)' }} />
              <div style={{ position: 'absolute', top: 15, right: 15, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.5)', borderRight: '2px solid rgba(255,255,255,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 15, left: 15, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.5)', borderLeft: '2px solid rgba(255,255,255,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 15, right: 15, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.5)', borderRight: '2px solid rgba(255,255,255,0.5)' }} />
              
              <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', color: 'red', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                <span style={{ width: 8, height: 8, backgroundColor: 'red', borderRadius: '50%', animation: 'pulseText 2s infinite' }}></span> REC
              </div>
            </>
          )}

          {/* Botão de Tela Cheia Flutuante */}
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'absolute',
              bottom: '15px',
              right: '35px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              zIndex: 10,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
          >
            [  ] TELA CHEIA
          </button>
        </div>

        {/* PAINEL DIREITO: BOTÕES */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '15px',
            width: '280px',
          }}
        >
          <button
            onClick={iniciarTeste}
            disabled={!landmarker}
            style={{
              background: isCameraActive ? 'transparent' : 'rgba(0, 212, 255, 0.1)',
              border: `2px solid ${isCameraActive ? '#333' : '#00d4ff'}`,
              color: isCameraActive ? '#94a3b8' : '#00d4ff',
              padding: '16px 25px',
              borderRadius: '12px',
              cursor: landmarker ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '1rem',
              letterSpacing: '1px',
              boxShadow: (isCameraActive || !landmarker) ? 'none' : '0 0 15px rgba(0, 212, 255, 0.3)',
              transition: 'all 0.2s',
              opacity: landmarker ? 1 : 0.5,
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              if (landmarker && !isCameraActive) {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (landmarker && !isCameraActive) {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
              }
            }}
          >
            {isCameraActive ? 'CÂMERA ATIVA' : 'INICIAR SENSOR'}
          </button>

          <button
            onClick={voltarParaInicio}
            style={{
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '16px 25px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              letterSpacing: '1px',
              transition: 'all 0.2s',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ABORTAR / VOLTAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestarCamera;