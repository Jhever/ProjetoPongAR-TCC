import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Vision from "@mediapipe/tasks-vision";
import { useConfig } from '../context/ConfigContext';

const TestarCamera = () => {
  const navigate = useNavigate();
  const { isDark } = useConfig();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [landmarker, setLandmarker] = useState<Vision.HandLandmarker | null>(null);
  const [status, setStatus] = useState("CARREGANDO MODELO...");
  const [pontos, setPontos] = useState(0);

  // Estilo solicitado
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
    transition: 'transform 0.2s'
  };

  useEffect(() => {
    const initVision = async () => {
      const vision = await Vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const l = await Vision.HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      setLandmarker(l);
      setStatus("PRONTO PARA INICIAR");
    };

    initVision();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (landmarker) landmarker.close();
    };
  }, []);

  const iniciarTeste = async () => {
    if (!landmarker || !canvasRef.current || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext('2d')!;
      const drawingUtils = new Vision.DrawingUtils(ctx);

      const predict = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const results = landmarker.detectForVideo(videoRef.current, performance.now());
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks.length > 0) {
            setStatus("MÃO DETECTADA!");
            setPontos(21);
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ff0055";
            
            for (const landmarks of results.landmarks) {
              drawingUtils.drawConnectors(landmarks, Vision.HandLandmarker.HAND_CONNECTIONS, { 
                color: '#ff0055', lineWidth: 4 
              });
              drawingUtils.drawLandmarks(landmarks, { 
                color: '#ffffff', lineWidth: 1, radius: 6 
              });
            }
            ctx.shadowBlur = 0;
          } else {
            setStatus("PROCESSANDO...");
            setPontos(0);
          }
        }
        animationFrameRef.current = requestAnimationFrame(predict);
      };
      predict();
    } catch (err) {
      alert("Erro ao acessar câmera: " + err);
    }
  };

  return (
    <div style={{ background: isDark ? '#0a0a0a' : '#f0f0f0', color: isDark ? '#fff' : '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '10px' }}>TESTE DE CÂMERA</h2>
      <p style={{ color: '#059669', fontWeight: 'bold' }}>{status} - Pontos: {pontos} / 21</p>
      
      <div style={{ position: 'relative', width: 640, height: 480, border: '4px solid #333', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }} autoPlay playsInline muted />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <button 
          onClick={iniciarTeste} 
          disabled={!landmarker} 
          style={landmarker ? btnGreen : { ...btnGreen, opacity: 0.5, cursor: 'not-allowed' }}
        >
          HABILITAR CÂMERA
        </button>

        <button 
          onClick={() => navigate('/home')} 
          style={{ background: 'transparent', color: isDark ? '#fff' : '#333', border: '2px solid #555', padding: '10px 30px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          VOLTAR PARA O INICIO
        </button>
      </div>
    </div>
  );
};

export default TestarCamera;