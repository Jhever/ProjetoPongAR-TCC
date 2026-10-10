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

  // Função para alternar o modo de tela cheia do container da câmera
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

  const theme = {
    bg: isDark ? '#07080b' : '#f8fafc',
    cardBg: isDark ? '#111318' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: '#94a3b8',
    border: isDark ? '#1f242d' : '#e2e8f0',
    accent: '#38bdf8',
  };

  const btnGreen = {
    background: 'linear-gradient(135deg, #059669, #22c55e)',
    border: 'none',
    color: 'white',
    padding: '14px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '0.9rem',
    letterSpacing: '1px',
    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
    transition: 'all 0.2s',
    width: '100%',
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 },
          facingMode: 'user',
        },
        audio: false,
      });

      activeStreamRef.current = stream;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      video.srcObject = stream;
      await video.play();

      canvas.width = 1280;
      canvas.height = 720;

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
            updateStatus('MÃO DETECTADA!');

            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0055';

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

              drawingUtils.drawConnectors(
                landmarksOriginal as any,
                conexoesValidas as any,
                {
                  color: '#ff0055',
                  lineWidth: 4,
                },
              );

              drawingUtils.drawLandmarks(pontosVisiveis as any, {
                color: '#ffffff',
                lineWidth: 1,
                radius: 6,
              });
            }

            updatePontos(totalPontosVisiveis);
            ctx.shadowBlur = 0;
          } else {
            updateStatus('PROCESSANDO...');
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
      alert(`Erro ao acessar câmera: ${err}`);
    }
  };

  const voltarParaInicio = () => {
    stopCamera();
    navigate('/home');
  };

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px',
        fontFamily: '"Courier New", Courier, monospace',
        boxSizing: 'border-box',
      }}
    >
      {/* HEADER DA PÁGINA */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          padding: '0 10px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: theme.accent, letterSpacing: '2px', fontWeight: 'bold' }}>
            DIAGNÓSTICO & CALIBRAÇÃO AR
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '1px' }}>
            TESTE DE CÂMERA
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              padding: '10px 20px',
              borderRadius: '8px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: theme.muted, display: 'block', letterSpacing: '1px' }}>STATUS</span>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>{status}</span>
            </div>
            <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
              <span style={{ fontSize: '0.7rem', color: theme.muted, display: 'block', letterSpacing: '1px' }}>RASTREAMENTO</span>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                Pontos: <span style={{ color: '#a3e635' }}>{pontos}</span> / 21
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER PRINCIPAL (VÍDEO + BOTÕES LATERAIS) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '25px',
          width: '100%',
          maxWidth: '1280px',
          alignItems: 'stretch',
        }}
      >
        {/* VÍDEO / CANVAS EM DESTAQUE (COM SUPORTE A TELA CHEIA) */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            flex: 1,
            aspectRatio: '16/9',
            background: '#000',
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
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

          {/* Botão flutuante de Tela Cheia no canto do vídeo */}
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'absolute',
              bottom: '15px',
              right: '15px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
          >
            ⛶ TELA CHEIA
          </button>
        </div>

        {/* PAINEL LATERAL DE CONTROLE */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '260px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={iniciarTeste}
            disabled={!landmarker}
            style={
              landmarker
                ? btnGreen
                : {
                    ...btnGreen,
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  }
            }
          >
            HABILITAR CÂMERA
          </button>

          <button
            onClick={voltarParaInicio}
            style={{
              background: theme.cardBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: '14px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              letterSpacing: '1px',
              width: '100%',
              transition: 'all 0.2s',
              boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestarCamera;