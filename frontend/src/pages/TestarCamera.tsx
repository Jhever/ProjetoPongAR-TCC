import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const TestarCamera = () => {
  const navigate = useNavigate();
  const { isDark } = useConfig();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const [testando, setTestando] = useState(false);
  const [status, setStatus] = useState("CARREGANDO MODELO...");
  const [pontos, setPontos] = useState(0);

  useEffect(() => {
    // 1. Carregamento sequencial seguro
    const loadScript = (src: string) => new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      document.body.appendChild(s);
    });

    const setup = async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");

      // @ts-ignore
      const { Hands, HAND_CONNECTIONS } = window;
      // @ts-ignore
      const { drawConnectors, drawLandmarks } = window;

      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

hands.onResults((results: any) => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Verifica se detectou alguma mão
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    
    // Atualiza status e pontos (agora exibimos 21 fixos para manter a estabilidade)
    setStatus("MÃO DETECTADA!");
    setPontos(21); 

    // @ts-ignore
    const { HAND_CONNECTIONS } = window;
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 5; // Linhas mais grossas facilitam a visualização

    // 2. Desenho das conexões
    for (const [start, end] of HAND_CONNECTIONS) {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    }

    // 3. Desenho dos pontos
    ctx.fillStyle = "#FF0000";
    landmarks.forEach((lm: any) => {
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
  } else {
    // Caso a mão saia da câmera
    setStatus("PROCESSANDO...");
    setPontos(0);
  }
});

      handsRef.current = hands;
      setStatus("PRONTO PARA INICIAR");
    };

    setup();
  }, []);

  const iniciarTeste = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setTestando(true);

      const loop = async () => {
        // Verifica se o vídeo está pronto (HAVE_ENOUGH_DATA) antes de enviar
        if (videoRef.current && handsRef.current && videoRef.current.readyState === 4) {
          await handsRef.current.send({ image: videoRef.current });
        }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      alert("Erro ao acessar câmera: " + err);
    }
  };

  return (
    <div style={{ background: isDark ? '#000' : '#fff', color: isDark ? '#fff' : '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div style={{ position: 'relative', width: 400, height: 400, border: '2px solid #555' }}>
        <video ref={videoRef} style={{ width: 400, height: 400, transform: 'scaleX(-1)' }} autoPlay playsInline muted />
        <canvas ref={canvasRef} width="400" height="400" style={{ position: 'absolute', top: 0, left: 0, transform: 'scaleX(-1)' }} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>Status: {status}</p>
        <p>Pontos Detectados: {pontos} / 21</p>
      </div>

      <button 
        onClick={iniciarTeste} 
        disabled={testando || status === "CARREGANDO MODELO..."}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        {testando ? "TESTE EM ANDAMENTO" : "HABILITAR CÂMERA"}
      </button>
      <button onClick={() => navigate('/home')} style={{ marginTop: '10px' }}>VOLTAR</button>
    </div>
  );
};

export default TestarCamera;