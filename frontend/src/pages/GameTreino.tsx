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
// COMPONENTE DO JOGO TREINO
// ==========================================
const GameTreino = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const [placar, setPlacar] = useState({ voce: 0, robo: 0 });
  const [dificuldade, setDificuldade] = useState('medio');
  const [fps, setFps] = useState(60);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [tempoRestante, setTempoRestante] = useState(300);
  const [vencedor, setVencedor] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const placarRef = useRef({ voce: 0, robo: 0 });
  const showLandmarksRef = useRef(showLandmarks);
  const dificuldadeRef = useRef(dificuldade);
  const gameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const tempoRestanteRef = useRef(300);
  const partidaRegistradaRef = useRef(false);
  const hiddenFingerCountersRef = useRef<Record<FingerName, number>>({ ...INITIAL_HIDDEN_COUNTERS });

  const aiStateRef = useRef({
    adaptFactor: 1.0,
    consecutiveHits: 0,
    estimatedTargetY: 225
  });

  useEffect(() => { showLandmarksRef.current = showLandmarks; }, [showLandmarks]);
  useEffect(() => { dificuldadeRef.current = dificuldade; }, [dificuldade]);

  const configIA = {
    facil: { baseSpeed: 0.08, maxSpeed: 6, errorRange: 35, predictFactor: 0.2 },
    medio: { baseSpeed: 0.14, maxSpeed: 10, errorRange: 20, predictFactor: 0.5 },
    dificil: { baseSpeed: 0.22, maxSpeed: 16, errorRange: 8, predictFactor: 0.8 },
    impossivel: { baseSpeed: 0.35, maxSpeed: 24, errorRange: 0, predictFactor: 1.0 }
  };

  const game = useRef({
    ball: { x: 400, y: 225, dx: 7, dy: (Math.random() > 0.5 ? 4 : -4) },
    playerY: 175,
    targetPlayerY: 175,
    robotY: 175
  });

  const finalizarPartidaTreino = (resultadoTexto: string) => {
    if (partidaRegistradaRef.current) return;
    partidaRegistradaRef.current = true;
    gameOverRef.current = true;
    setVencedor(resultadoTexto);

    const usuarioSalvo = JSON.parse(localStorage.getItem('usuario') || '{}');
    const vScore = placarRef.current.voce;
    const rScore = placarRef.current.robo;

    const historicoAtual = JSON.parse(localStorage.getItem('pong_historico') || '[]');
    const novaEntrada = {
      data: new Date().toLocaleDateString('pt-BR'),
      resultado: vScore > rScore ? 'VITÓRIA' : rScore > vScore ? 'DERROTA' : 'EMPATE',
      placar: `${vScore} x ${rScore} (Treino - ${dificuldadeRef.current.toUpperCase()})`
    };
    localStorage.setItem('pong_historico', JSON.stringify([novaEntrada, ...historicoAtual].slice(0, 15)));

    if (usuarioSalvo?.id) {
      fetch('http://localhost:3001/api/ranking/registrar-partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogador_id: usuarioSalvo.id,
          adversario_nome: `IA (${dificuldadeRef.current.toUpperCase()})`,
          pontuacao_jogador: vScore,
          pontuacao_adversario: rScore,
          resultado: vScore > rScore ? 'VITORIA' : rScore > vScore ? 'DERROTA' : 'EMPATE',
          tipo_partida: 'TREINO'
        })
      }).catch(err => console.error("Erro ao registrar treino:", err));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameOverRef.current || isPausedRef.current) return;

      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const v = placarRef.current.voce;
          const r = placarRef.current.robo;
          const msg = v > r ? "VOCÊ VENCEU (TEMPO ESGOTADO)!" : r > v ? "A IA VENCEU (TEMPO ESGOTADO)!" : "EMPATE!";
          finalizarPartidaTreino(msg);
          return 0;
        }
        tempoRestanteRef.current = prev - 1;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const lancarBola = (direcaoX: number) => {
    const angulo = (Math.random() * 0.8 - 0.4) * Math.PI;
    const velInicial = 8;
    game.current.ball = {
      x: 400,
      y: 225,
      dx: direcaoX * velInicial * Math.cos(angulo),
      dy: velInicial * Math.sin(angulo)
    };
  };

  const reiniciarPartida = () => {
    placarRef.current = { voce: 0, robo: 0 };
    setPlacar({ voce: 0, robo: 0 });
    setTempoRestante(300);
    tempoRestanteRef.current = 300;
    gameOverRef.current = false;
    isPausedRef.current = false;
    partidaRegistradaRef.current = false;
    setIsPaused(false);
    setVencedor(null);
    game.current.playerY = 175;
    game.current.targetPlayerY = 175;
    game.current.robotY = 175;
    aiStateRef.current.adaptFactor = 1.0;
    aiStateRef.current.consecutiveHits = 0;
    lancarBola(Math.random() > 0.5 ? 1 : -1);
  };

  const alternarPausa = () => {
    if (gameOverRef.current) return;
    const novoStatus = !isPausedRef.current;
    isPausedRef.current = novoStatus;
    setIsPaused(novoStatus);
  };

  useEffect(() => {
    reiniciarPartida();
  }, [dificuldade]);

  useEffect(() => {
    let landmarker: Vision.HandLandmarker | null = null;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastVideoTime = -1;

    const initVision = async () => {
      try {
        const vision = await Vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        landmarker = await Vision.HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU" // <--- ACELERAÇÃO GPU
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        // 640x480 para resposta imediata
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 60 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            const drawingUtils = new Vision.DrawingUtils(ctx);

            const renderLoop = () => {
              const now = performance.now();
              frameCount++;

              if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
              }

              // SÓ CHAMA O MEDIAPIPE SE HOUVER NOVO QUADRO
              if (
                videoRef.current &&
                videoRef.current.readyState >= 2 &&
                landmarker &&
                videoRef.current.currentTime !== lastVideoTime
              ) {
                lastVideoTime = videoRef.current.currentTime;
                const results = landmarker.detectForVideo(videoRef.current, now);

                let handDetected = false;

                if (results.landmarks && results.landmarks.length > 0) {
                  const hand = results.landmarks[0];
                  const mirroredX = 1 - hand[0].x;

                  if (mirroredX < 0.5) {
                    const palmY = hand[9] ? hand[9].y : hand[0].y;
                    const sensibilidade = 1.4;
                    let adjustedY = (palmY - 0.45) * sensibilidade + 0.5;
                    adjustedY = Math.max(0.1, Math.min(0.9, adjustedY));
                    game.current.targetPlayerY = adjustedY * 450 - 50;
                    handDetected = true;
                  }
                }

                if (!handDetected) {
                  hiddenFingerCountersRef.current = { ...INITIAL_HIDDEN_COUNTERS };
                }

                // ==========================================
                // FÍSICA E IA ADAPTATIVA
                // ==========================================
                if (!gameOverRef.current && !isPausedRef.current) {
                  // Interpolação suave para a raquete do jogador
                  game.current.playerY += (game.current.targetPlayerY - game.current.playerY) * 0.4;

                  game.current.ball.x += game.current.ball.dx;
                  game.current.ball.y += game.current.ball.dy;

                  // Quique Teto/Chão
                  if (game.current.ball.y <= 10) {
                    game.current.ball.y = 10;
                    game.current.ball.dy = Math.abs(game.current.ball.dy) * 1.02;
                    game.current.ball.dx += (Math.random() - 0.5) * 0.3;
                  } else if (game.current.ball.y >= 440) {
                    game.current.ball.y = 440;
                    game.current.ball.dy = -Math.abs(game.current.ball.dy) * 1.02;
                    game.current.ball.dx += (Math.random() - 0.5) * 0.3;
                  }

                  const profile = configIA[dificuldadeRef.current as keyof typeof configIA];

                  const saldoGols = placarRef.current.voce - placarRef.current.robo;
                  aiStateRef.current.adaptFactor = Math.max(0.85, 1.0 + (saldoGols * 0.08) + (aiStateRef.current.consecutiveHits * 0.02));

                  if (game.current.ball.dx > 0) {
                    const distRestanteX = 725 - game.current.ball.x;
                    const tempoAteImpacto = distRestanteX / game.current.ball.dx;
                    const predicaoY = game.current.ball.y + (game.current.ball.dy * tempoAteImpacto * profile.predictFactor);
                    
                    const erroAleatorio = (Math.random() - 0.5) * (profile.errorRange / aiStateRef.current.adaptFactor);
                    aiStateRef.current.estimatedTargetY = predicaoY - 50 + erroAleatorio;
                  } else {
                    aiStateRef.current.estimatedTargetY = 175;
                  }

                  const diferencaY = aiStateRef.current.estimatedTargetY - game.current.robotY;
                  const step = diferencaY * (profile.baseSpeed * aiStateRef.current.adaptFactor);
                  const clampedStep = Math.sign(step) * Math.min(Math.abs(step), profile.maxSpeed);
                  
                  game.current.robotY += clampedStep;
                  game.current.robotY = Math.max(0, Math.min(350, game.current.robotY));

                  // Colisão Player
                  const hitPlayer = game.current.ball.x <= 75 &&
                                    game.current.ball.x >= 45 &&
                                    game.current.ball.y >= game.current.playerY &&
                                    game.current.ball.y <= game.current.playerY + 100;

                  // Colisão IA
                  const hitRobot = game.current.ball.x >= 725 &&
                                   game.current.ball.x <= 755 &&
                                   game.current.ball.y >= game.current.robotY &&
                                   game.current.ball.y <= game.current.robotY + 100;

                  if (hitPlayer) {
                    aiStateRef.current.consecutiveHits++;
                    const impactOffset = (game.current.ball.y - (game.current.playerY + 50)) / 50;
                    const randomVariance = (Math.random() - 0.5) * 0.25;
                    const bounceAngle = (impactOffset * (Math.PI / 3)) + randomVariance;

                    const currentSpeed = Math.hypot(game.current.ball.dx, game.current.ball.dy);
                    const newSpeed = Math.min(currentSpeed * 1.12, 26);

                    game.current.ball.dx = Math.abs(Math.cos(bounceAngle) * newSpeed);
                    game.current.ball.dy = Math.sin(bounceAngle) * newSpeed;
                    game.current.ball.x = 76;
                  } else if (hitRobot) {
                    aiStateRef.current.consecutiveHits++;
                    const impactOffset = (game.current.ball.y - (game.current.robotY + 50)) / 50;
                    const randomVariance = (Math.random() - 0.5) * 0.2;
                    const bounceAngle = (impactOffset * (Math.PI / 3)) + randomVariance;

                    const currentSpeed = Math.hypot(game.current.ball.dx, game.current.ball.dy);
                    const newSpeed = Math.min(currentSpeed * 1.12, 26);

                    game.current.ball.dx = -Math.abs(Math.cos(bounceAngle) * newSpeed);
                    game.current.ball.dy = Math.sin(bounceAngle) * newSpeed;
                    game.current.ball.x = 724;
                  }

                  if (game.current.ball.x < 0) {
                    aiStateRef.current.consecutiveHits = 0;
                    placarRef.current.robo += 1;
                    setPlacar({ ...placarRef.current });

                    if (placarRef.current.robo >= 10) {
                      finalizarPartidaTreino("IA ADAPTATIVA (ALCANÇOU 10 PONTOS)");
                    } else {
                      lancarBola(1);
                    }
                  } else if (game.current.ball.x > 800) {
                    aiStateRef.current.consecutiveHits = 0;
                    placarRef.current.voce += 1;
                    setPlacar({ ...placarRef.current });

                    if (placarRef.current.voce >= 10) {
                      finalizarPartidaTreino("VOCÊ (ALCANÇOU 10 PONTOS)!");
                    } else {
                      lancarBola(-1);
                    }
                  }
                }

                // Renderização no Canvas
                ctx.clearRect(0, 0, 800, 450);

                ctx.strokeStyle = "rgba(70, 130, 180, 0.45)";
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(400, 0);
                ctx.lineTo(400, 450);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(400, 225, 55, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "rgba(70, 130, 180, 0.6)";
                ctx.beginPath();
                ctx.arc(400, 225, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.setLineDash([]);
                ctx.strokeRect(0, 125, 45, 200);
                ctx.strokeRect(755, 125, 45, 200);

                ctx.fillStyle = "#00d4ff";
                ctx.font = "bold 18px 'Courier New', monospace";
                ctx.fillText(`VOCÊ: ${placarRef.current.voce}`, 220, 35);

                ctx.fillStyle = "#fbbf24";
                ctx.fillText(`${formatarTempo(tempoRestanteRef.current)}`, 375, 35);

                ctx.fillStyle = "#ff0055";
                ctx.fillText(`IA: ${placarRef.current.robo}`, 480, 35);

                ctx.strokeStyle = "#00d4ff";
                ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
                ctx.lineWidth = 3;
                ctx.strokeRect(55, game.current.playerY, 20, 100);
                ctx.fillRect(55, game.current.playerY, 20, 100);

                ctx.strokeStyle = "#ff0055";
                ctx.fillStyle = "rgba(255, 0, 85, 0.25)";
                ctx.strokeRect(725, game.current.robotY, 20, 100);
                ctx.fillRect(725, game.current.robotY, 20, 100);

                if (!gameOverRef.current) {
                  ctx.shadowColor = "#ffffff";
                  ctx.shadowBlur = 15;
                  ctx.fillStyle = "#ffffff";
                  ctx.beginPath();
                  ctx.arc(game.current.ball.x, game.current.ball.y, 9, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                }

                // Renderização condicional dos landmarks
                if (showLandmarksRef.current && results.landmarks && results.landmarks.length > 0) {
                  const landmarksOriginal = results.landmarks[0];
                  const landmarks = landmarksOriginal as Landmark[];
                  const hiddenMask = buildHiddenMask(landmarks, hiddenFingerCountersRef.current);

                  const mirroredLandmarks = landmarksOriginal.map(pt => ({
                    ...pt,
                    x: 1 - pt.x
                  }));

                  const conexoesValidas = Vision.HandLandmarker.HAND_CONNECTIONS.filter((connection) => {
                    const { start, end } = connection as { start: number; end: number };
                    return !hiddenMask[start] && !hiddenMask[end];
                  });

                  const pontosVisiveis = mirroredLandmarks.filter((_, index) => !hiddenMask[index]);

                  drawingUtils.drawConnectors(mirroredLandmarks as any, conexoesValidas as any, {
                    color: '#00d4ff',
                    lineWidth: 4
                  });
                  drawingUtils.drawLandmarks(pontosVisiveis as any, {
                    color: '#ffffff',
                    lineWidth: 1,
                    radius: 6
                  });
                }
              }
              animationFrameId = requestAnimationFrame(renderLoop);
            };

            renderLoop();
          };
        }
      } catch (error) {
        console.error("Erro na inicialização AR Treino:", error);
      }
    };

    initVision();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (landmarker) landmarker.close();
    };
  }, []);

  return (
    <div style={{
      background: '#0a0d14',
      minHeight: '100vh',
      color: '#e2e8f0',
      fontFamily: "'Courier New', monospace, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#94a3b8', marginBottom: '10px' }}>
        MODO TREINO (IA ADAPTATIVA) | META: 10 PONTOS OU 5 MINUTOS
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '960px',
        aspectRatio: '16/9',
        border: '2px solid #00d4ff',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#000',
        boxShadow: '0 0 25px rgba(0, 212, 255, 0.2)'
      }}>
        <div style={{ position: 'absolute', top: 12, left: 15, zIndex: 10, border: '1px solid #00d4ff', padding: '4px 10px', fontSize: '11px', background: 'rgba(0,0,0,0.65)', color: '#00d4ff', fontWeight: 'bold' }}>
          VOCÊ (PLAYER)
        </div>
        <div style={{ position: 'absolute', top: 12, right: 15, zIndex: 10, border: '1px solid #ff0055', padding: '4px 10px', fontSize: '11px', background: 'rgba(0,0,0,0.65)', color: '#ff0055', fontWeight: 'bold' }}>
          IA ADAPTATIVA ({dificuldade.toUpperCase()})
        </div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }}
        />

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {isPaused && !vencedor && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25
          }}>
            <h2 style={{ fontSize: '2.2rem', color: '#facc15', marginBottom: '15px', letterSpacing: '2px' }}>PARTIDA PAUSADA</h2>
            <button
              onClick={alternarPausa}
              style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              CONTINUAR TREINO
            </button>
          </div>
        )}

        {vencedor && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30
          }}>
            <h2 style={{ fontSize: '2rem', color: '#38bdf8', marginBottom: '10px' }}>FIM DE TREINO!</h2>
            <p style={{ fontSize: '1.4rem', color: '#4ade80', fontWeight: 'bold', marginBottom: '30px' }}>
              {vencedor}
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={reiniciarPartida}
                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                JOGAR NOVAMENTE
              </button>
              <button
                onClick={() => navigate('/modo-jogo')}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                VOLTAR AO MENU
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '960px', marginTop: '15px' }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>DESEMPENHO: <b style={{ color: '#4ade80' }}>{fps} FPS</b></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>NÍVEL DA IA:</span>
            <select
              value={dificuldade}
              onChange={(e) => setDificuldade(e.target.value)}
              style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #475569', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <option value="facil">FÁCIL</option>
              <option value="medio">MÉDIO</option>
              <option value="dificil">DIFÍCIL</option>
              <option value="impossivel">IMPOSSÍVEL</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={alternarPausa}
            style={{
              background: isPaused ? '#16a34a' : '#d97706',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              fontSize: '17px'
            }}
          >
            {isPaused ? 'CONTINUAR' : 'PAUSAR'}
          </button>

          <button
            onClick={reiniciarPartida}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              fontSize: '17px'
            }}
          >
            RESETAR
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', marginLeft: '5px' }}>
            <input type="checkbox" checked={showLandmarks} onChange={(e) => setShowLandmarks(e.target.checked)} />
            <span>EXIBIR LANDMARKS</span>
          </label>

        </div>
      </div>

          <button
            onClick={() => navigate('/home')}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '20px' }}
          >
           Sair da Partida
          </button>
      {/* <div style={{ marginTop: '15px', fontSize: '11px', color: '#475569', letterSpacing: '1px' }}>
        TCC – PONG AR PROJECT | MODO TREINO (IA ADAPTATIVA HEURÍSTICA) | DESENVOLVEDOR: JHEVERSON
      </div> */}
    </div>
  );
};

export default GameTreino;