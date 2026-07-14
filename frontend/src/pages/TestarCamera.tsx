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
  // Thumb: 1 CMC, 2 MCP, 3 IP, 4 TIP
  { name: 'thumb', mcp: 1, pip: 2, dip: 3, tip: 4, hide: [2, 3, 4], isThumb: true },

  // Other fingers: MCP, PIP, DIP, TIP
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

  if (abLen === 0 || cbLen === 0) {
    return 180;
  }

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

    if (intersects) {
      inside = !inside;
    }
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
    landmarks[0],  // wrist
    landmarks[5],  // index MCP
    landmarks[9],  // middle MCP
    landmarks[13], // ring MCP
    landmarks[17], // pinky MCP
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
      dist2D(mcp, pip) +
      dist2D(pip, dip) +
      dist2D(dip, tip);

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
        tipInsidePalm ||
        dipInsidePalm ||
        (curlRatio < 0.55 && closeToPalmCenter);
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

    const shouldHide = counters[finger.name] >= 2;

    if (shouldHide) {
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
  const animationFrameRef = useRef<number>(0);
  const landmarkerRef = useRef<Vision.HandLandmarker | null>(null);
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
    cancelAnimationFrame(animationFrameRef.current);

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (video) {
      video.srcObject = null;
    }
  }, []);

  const btnGreen = {
    background: 'linear-gradient(to right, #059669, #a3e635)',
    border: 'none',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '16px',
    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
    transition: 'transform 0.2s',
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

        if (disposed) {
          return;
        }

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
          facingMode: 'user',
        },
        audio: false,
      });

      const video = videoRef.current;
      const canvas = canvasRef.current;

      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

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

        if (currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const results = activeLandmarker.detectForVideo(
            currentVideo,
            performance.now(),
          );

          ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

          if (results.landmarks.length > 0) {
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
        background: isDark ? '#0a0a0a' : '#f0f0f0',
        color: isDark ? '#fff' : '#000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Centraliza o bloco inteiro verticalmente
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* NOVO CONTAINER FLEX: TRÊS COLUNAS (TEXTO - VÍDEO - BOTÕES) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '40px', 
          width: '100%',
          maxWidth: '1600px', // Limite expandido para caber as 3 colunas
        }}
      >
        
        {/* COLUNA ESQUERDA: TÍTULO E PONTOS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            width: '250px', // Mesma largura da coluna da direita (simetria!)
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '20px', fontSize: '2.2rem', lineHeight: '1.2' }}>
            TESTE DE<br/>CÂMERA
          </h2>
          
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '15px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <p style={{ color: '#059669', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 10px 0' }}>
              {status}
            </p>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
              Pontos: <span style={{ color: '#a3e635' }}>{pontos}</span> / 21
            </p>
          </div>
        </div>

        {/* COLUNA CENTRAL: VÍDEO EXPANDIDO */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1000px', 
            aspectRatio: '4/3', 
            border: '4px solid #333',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
            flexShrink: 1, 
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
        </div>

        {/* COLUNA DIREITA: BOTÕES */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column', 
            gap: '20px', 
            width: '250px', // Mesma largura da coluna da esquerda
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
              background: 'transparent',
              color: isDark ? '#fff' : '#333',
              border: '2px solid #555',
              padding: '12px 25px',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%', 
            }}
          >
            VOLTAR PARA O INICIO
          </button>
        </div>

      </div>
    </div>
  );
};

export default TestarCamera;