import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Vision from "@mediapipe/tasks-vision";

// ==========================================
// TIPAGENS E CONSTANTES PARA O FILTRO DA MÃO
// ==========================================
type Landmark = { x: number; y: number; z?: number; visibility?: number; presence?: number; };
type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
type FingerInfo = { name: FingerName; mcp: number; pip: number; dip: number; tip: number; hide: number[]; isThumb?: boolean; };

const FINGERS: FingerInfo[] = [
  { name: 'thumb', mcp: 1, pip: 2, dip: 3, tip: 4, hide: [2, 3, 4], isThumb: true },
  { name: 'index', mcp: 5, pip: 6, dip: 7, tip: 8, hide: [6, 7, 8] },
  { name: 'middle', mcp: 9, pip: 10, dip: 11, tip: 12, hide: [10, 11, 12] },
  { name: 'ring', mcp: 13, pip: 14, dip: 15, tip: 16, hide: [14, 15, 16] },
  { name: 'pinky', mcp: 17, pip: 18, dip: 19, tip: 20, hide: [18, 19, 20] },
];

const INITIAL_HIDDEN_COUNTERS: Record<FingerName, number> = {
  thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0,
};

// ==========================================
// FUNÇÕES MATEMÁTICAS (DEDOS OCULTOS)
// ==========================================
function dist2D(a: Landmark, b: Landmark): number { return Math.hypot(a.x - b.x, a.y - b.y); }

function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const abLen = Math.hypot(abx, aby), cbLen = Math.hypot(cbx, cby);
  if (abLen === 0 || cbLen === 0) return 180;
  const cos = dot / (abLen * cbLen);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function pointInPolygon(point: Landmark, polygon: Landmark[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function detectHiddenFingers(landmarks: Landmark[]): Record<FingerName, boolean> {
  const result: Record<FingerName, boolean> = { thumb: false, index: false, middle: false, ring: false, pinky: false };
  const palmPolygon = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  const palmSize = Math.max(dist2D(landmarks[0], landmarks[9]), dist2D(landmarks[5], landmarks[17]), 0.0001);

  for (const finger of FINGERS) {
    const mcp = landmarks[finger.mcp], pip = landmarks[finger.pip], dip = landmarks[finger.dip], tip = landmarks[finger.tip];
    const fingerLength = dist2D(mcp, pip) + dist2D(pip, dip) + dist2D(dip, tip);
    const curlRatio = dist2D(mcp, tip) / Math.max(fingerLength, 0.0001);
    const pipAngle = angleDeg(mcp, pip, dip), dipAngle = angleDeg(pip, dip, tip);
    const isBent = pipAngle < 145 || dipAngle < 145;
    const tipInsidePalm = pointInPolygon(tip, palmPolygon);
    const dipInsidePalm = pointInPolygon(dip, palmPolygon);
    const closeToPalmCenter = dist2D(tip, landmarks[9]) < palmSize * 0.9;

    if (finger.isThumb) {
      result[finger.name] = tipInsidePalm || dipInsidePalm || (curlRatio < 0.55 && closeToPalmCenter);
    } else {
      result[finger.name] = (tipInsidePalm && curlRatio < 0.85) || (dipInsidePalm && curlRatio < 0.85) || curlRatio < 0.52 || (isBent && closeToPalmCenter);
    }
  }
  return result;
}

function buildHiddenMask(landmarks: Landmark[], counters: Record<FingerName, number>): boolean[] {
  const rawHidden = detectHiddenFingers(landmarks);
  const hiddenMask = new Array<boolean>(21).fill(false);

  for (const finger of FINGERS) {
    if (rawHidden[finger.name]) counters[finger.name] = Math.min(counters[finger.name] + 1, 4);
    else counters[finger.name] = Math.max(counters[finger.name] - 1, 0);

    if (counters[finger.name] >= 2) {
      for (const index of finger.hide) hiddenMask[index] = true;
    }
  }
  return hiddenMask;
}

// ==========================================
// COMPONENTE DO JOGO
// ==========================================
const GameTreino = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // REFERÊNCIA NOVA PARA A TELA CHEIA
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const hiddenFingerCountersRef = useRef<Record<FingerName, number>>({ ...INITIAL_HIDDEN_COUNTERS });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [placar, setPlacar] = useState({ voce: 0, robo: 0 });
  const [dificuldade, setDificuldade] = useState('medio');
  const game = useRef({ ball: { x: 400, y: 225, dx: 6, dy: 6 }, playerY: 175, robotY: 175 });

  const resetGame = () => {
    setPlacar({ voce: 0, robo: 0 });
    game.current.ball = { x: 400, y: 225, dx: 6, dy: 6 };
    game.current.playerY = 175;
    game.current.robotY = 175;
  };

  useEffect(() => {
    resetGame();
  }, [dificuldade]);

  // Listener para identificar se o usuário apertou "ESC" para sair da tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Erro ao entrar em tela cheia:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const configIA = {
    facil: { speed: 0.01, error:45  },
    medio: { speed: 0.08, error: 35 },
    dificil: { speed: 0.12, error: 20 },
    impossivel: { speed: 0.17, error: 15 }
  };

  useEffect(() => {
    let landmarker: Vision.HandLandmarker;
    let animationFrameId: number;

    const initVision = async () => {
      const vision = await Vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      landmarker = await Vision.HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play();
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const drawingUtils = new Vision.DrawingUtils(ctx);

          const predict = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              const results = landmarker.detectForVideo(videoRef.current, performance.now());
              
              let isHandOnLeft = false;
              if (results.landmarks.length > 0) {
                const handX = results.landmarks[0][0].x;
                if (handX < 0.5) {
                  // A MÁGICA DA SENSIBILIDADE APLICADA AQUI:
                  const rawY = results.landmarks[0][0].y;
                  const sensibilidade = 1.6; // Multiplicador de velocidade
                  let adjustedY = (rawY - 0.5) * sensibilidade + 0.5;
                  
                  // Trava para a raquete não sair da tela
                  adjustedY = Math.max(0, Math.min(1, adjustedY));
                  
                  game.current.playerY = adjustedY * 450 - 50;
                  isHandOnLeft = true;
                }
              } else {
                hiddenFingerCountersRef.current = { ...INITIAL_HIDDEN_COUNTERS };
              }

              // Física da Bola
              game.current.ball.x += game.current.ball.dx; 
              game.current.ball.y += game.current.ball.dy;
              
              if (game.current.ball.y <= 0 || game.current.ball.y >= 440) game.current.ball.dy *= -1;
              
              const hitPaddle = (game.current.ball.x <= 35 && game.current.ball.y > game.current.playerY && game.current.ball.y < game.current.playerY + 100) ||
                                (game.current.ball.x >= 765 && game.current.ball.y > game.current.robotY && game.current.ball.y < game.current.robotY + 100);

              if (hitPaddle) {
                game.current.ball.dx *= -1.1; 
                if (Math.abs(game.current.ball.dx) > 20) game.current.ball.dx = 20 * Math.sign(game.current.ball.dx);
              }
              
              if (game.current.ball.x < 0) { 
                setPlacar(p => ({...p, robo: p.robo + 1})); 
                game.current.ball.x = 400; 
                game.current.ball.dx = 6; 
              } else if (game.current.ball.x > 800) { 
                setPlacar(p => ({...p, voce: p.voce + 1}));
                game.current.ball.x = 400; 
                game.current.ball.dx = -6; 
              }
                
              const level = configIA[dificuldade as keyof typeof configIA];
              if (game.current.ball.dx > 0) {
                const targetY = game.current.ball.y - 50 + (Math.random() - 0.5) * level.error;
                game.current.robotY += (targetY - game.current.robotY) * level.speed;
              } else {
                game.current.robotY += (175 - game.current.robotY) * 0.05;
              }

              // Renderização
              ctx.clearRect(0, 0, 800, 450);
              ctx.fillStyle = "#4eac4e"; ctx.fillRect(400, 0, 400, 450);
              ctx.strokeStyle = "white"; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 450); ctx.stroke();
              ctx.beginPath(); ctx.arc(400, 225, 60, 0, Math.PI * 2); ctx.stroke();
              
              ctx.fillStyle = "#00d4ff"; ctx.fillRect(20, game.current.playerY, 15, 100);
              ctx.fillStyle = "#ff0055"; ctx.fillRect(765, game.current.robotY, 15, 100);
              ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(game.current.ball.x, game.current.ball.y, 8, 0, Math.PI * 2); ctx.fill();

              // Filtro matemático de Mão Oculta
              if (isHandOnLeft && results.landmarks) {
                for (const landmarksOriginal of results.landmarks) {
                  const landmarks = landmarksOriginal as Landmark[];
                  const hiddenMask = buildHiddenMask(landmarks, hiddenFingerCountersRef.current);

                  const conexoesValidas = Vision.HandLandmarker.HAND_CONNECTIONS.filter((connection) => {
                    const { start, end } = connection as { start: number; end: number };
                    return !hiddenMask[start] && !hiddenMask[end];
                  });

                  const pontosVisiveis = landmarks.filter((_, index) => !hiddenMask[index]);

                  drawingUtils.drawConnectors(landmarksOriginal as any, conexoesValidas as any, { color: '#ff0055', lineWidth: 4 });
                  drawingUtils.drawLandmarks(pontosVisiveis as any, { color: '#ffffff', lineWidth: 1, radius: 6 });
                }
              }
            }
            animationFrameId = requestAnimationFrame(predict);
          };
          predict();
        };
      }
    };
    initVision();
    return () => { cancelAnimationFrame(animationFrameId); landmarker?.close(); };
  }, [dificuldade]);

  return (
    <div 
      ref={containerRef} // Referência atrelada aqui para colocar toda a tela no F11
      style={{ 
        background: '#000', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#fff', 
        width: '100vw',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER DE INFORMAÇÕES E DIFICULDADE */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
        <span>ROBÔ: {placar.robo}</span>
        <select onChange={(e) => setDificuldade(e.target.value)} value={dificuldade} style={{ padding: '8px 15px', borderRadius: '8px', color: '#000', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          <option value="facil">Fácil</option>
          <option value="medio">Médio</option>
          <option value="dificil">Difícil</option>
          <option value="impossivel">Impossível</option>
        </select>
        <span>VOCÊ: {placar.voce}</span>
      </div>
      
      {/* A MÁGICA DA RESPONSIVIDADE AQUI 
        Ao invés de width 800px fixo, a altura guia o tamanho (70vh ou 85vh se tela cheia)
        e a proporção (aspectRatio) de 16/9 garante que não destorça a imagem da câmera!
      */}
      <div style={{ 
        position: 'relative', 
        height: isFullscreen ? '85vh' : '70vh', 
        aspectRatio: '16/9', 
        border: isFullscreen ? 'none' : '4px solid #333', 
        borderRadius: isFullscreen ? '0px' : '15px', 
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 0 50px rgba(0, 212, 255, 0.15)'
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }} />
        
        {/* Canvas agora com style width: '100%' para acompanhar a div responsiva (resolução 800x450 intacta) */}
        <canvas ref={canvasRef} width={800} height={450} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
      </div>
      
      {/* BOTÕES DE NAVEGAÇÃO E TELA CHEIA */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <button 
          onClick={toggleFullScreen} 
          style={{ padding: '12px 25px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', background: '#059669', color: '#fff', border: 'none', fontSize: '1rem' }}
        >
          {isFullscreen ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA (F11)'}
        </button>
        <button 
          onClick={() => navigate(-1)} 
          style={{ padding: '12px 25px', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', background: '#333', color: '#fff', border: '1px solid #555', fontSize: '1rem' }}
        >
          VOLTAR
        </button>
      </div>
    </div>
  );
};

export default GameTreino;