import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Vision from "@mediapipe/tasks-vision";
import { socket } from '../services/socket';

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

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    salaId: string;
    lado: 'esquerda' | 'direita';
    adversario: string;
    adversarioId: number | string;
  } | null;

  const salaId = state?.salaId || 'OFFLINE';
  const lado = state?.lado || 'esquerda';
  const adversarioNome = state?.adversario || 'Remote Player';
  const isHost = lado === 'esquerda';

  const hiddenFingerCountersRef = useRef<Record<FingerName, number>>({ ...INITIAL_HIDDEN_COUNTERS });
  const [placar, setPlacar] = useState({ p1: 0, p2: 0 });
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [anonMode, setAnonMode] = useState(false);
  const [latency, setLatency] = useState(15);
  const [fps, setFps] = useState(60);
  const [gameLogs, setGameLogs] = useState<string[]>([
    '[Socket] Connected to server',
    `[Room] Joined ${salaId}`,
    `[Match] Player 1 (${isHost ? 'Local' : adversarioNome}) vs Player 2 (${!isHost ? 'Local' : adversarioNome})`
  ]);

  const game = useRef({
    ball: { x: 400, y: 225, dx: 5, dy: 5 },
    p1Y: 175,
    p2Y: 175
  });

  const addLog = (msg: string) => {
    setGameLogs(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on('adversarioMoveu', (dados: { y: number }) => {
      if (isHost) {
        game.current.p2Y = dados.y;
      } else {
        game.current.p1Y = dados.y;
      }
    });

    if (!isHost) {
      socket.on('bolaAtualizada', (novaBola: { x: number; y: number; dx: number; dy: number }) => {
        game.current.ball = novaBola;
      });
    }

    socket.on('placarAtualizado', (novoPlacar: { esquerda: number; direita: number }) => {
      setPlacar({ p1: novoPlacar.esquerda, p2: novoPlacar.direita });
      addLog(`[Score] P1: ${novoPlacar.esquerda} | P2: ${novoPlacar.direita}`);
    });

    socket.on('adversarioDesconectou', () => {
      addLog('[Socket] Opponent disconnected');
      alert('Oponente desconectou.');
      navigate('/home');
    });

    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('pingCheck', () => {
        setLatency(Date.now() - start);
      });
    }, 2000);

    return () => {
      clearInterval(pingInterval);
      socket.off('adversarioMoveu');
      socket.off('bolaAtualizada');
      socket.off('placarAtualizado');
      socket.off('adversarioDesconectou');
    };
  }, [isHost, navigate, salaId]);

  useEffect(() => {
    let landmarker: Vision.HandLandmarker;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

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
        numHands: 2
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

            if (videoRef.current && videoRef.current.readyState >= 2) {
              const results = landmarker.detectForVideo(videoRef.current, now);

              let handDetected = false;
              if (results.landmarks.length > 0) {
                const handX = results.landmarks[0][0].x;
                // Valida o lado da quadra: P1 esquerda (<0.5), P2 direita (>=0.5)
                const isValidSide = isHost ? handX < 0.5 : handX >= 0.5;

                if (isValidSide) {
                  const rawY = results.landmarks[0][0].y;
                  const sensibilidade = 1.6;
                  let adjustedY = (rawY - 0.5) * sensibilidade + 0.5;
                  adjustedY = Math.max(0, Math.min(1, adjustedY));

                  const paddleY = adjustedY * 450 - 50;
                  if (isHost) {
                    game.current.p1Y = paddleY;
                  } else {
                    game.current.p2Y = paddleY;
                  }
                  handDetected = true;
                  socket.emit('moverRaquete', { salaId, y: paddleY });
                }
              }

              // Física da Bola (Autoritativo no Host)
              if (isHost) {
                game.current.ball.x += game.current.ball.dx;
                game.current.ball.y += game.current.ball.dy;

                if (game.current.ball.y <= 10 || game.current.ball.y >= 440) {
                  game.current.ball.dy *= -1;
                }

                const hitP1 = game.current.ball.x <= 75 && game.current.ball.y > game.current.p1Y && game.current.ball.y < game.current.p1Y + 100;
                const hitP2 = game.current.ball.x >= 725 && game.current.ball.y > game.current.p2Y && game.current.ball.y < game.current.p2Y + 100;

                if (hitP1 || hitP2) {
                  game.current.ball.dx *= -1.1;
                  if (Math.abs(game.current.ball.dx) > 18) game.current.ball.dx = 18 * Math.sign(game.current.ball.dx);
                }

                if (game.current.ball.x < 10) {
                  const novoPlacar = { esquerda: placar.p1, direita: placar.p2 + 1 };
                  setPlacar({ p1: novoPlacar.esquerda, p2: novoPlacar.direita });
                  socket.emit('pontoMarcado', { salaId, placar: novoPlacar });
                  game.current.ball = { x: 400, y: 225, dx: 5, dy: 5 };
                } else if (game.current.ball.x > 790) {
                  const novoPlacar = { esquerda: placar.p1 + 1, direita: placar.p2 };
                  setPlacar({ p1: novoPlacar.esquerda, p2: novoPlacar.direita });
                  socket.emit('pontoMarcado', { salaId, placar: novoPlacar });
                  game.current.ball = { x: 400, y: 225, dx: -5, dy: 5 };
                }

                socket.emit('atualizarBola', { salaId, bola: game.current.ball });
              }

              // ==========================================
              // RENDERIZAÇÃO ESTILO HUD CIENTÍFICA (FOTO)
              // ==========================================
              ctx.clearRect(0, 0, 800, 450);

              // Linha divisória de campo
              ctx.strokeStyle = "rgba(70, 130, 180, 0.4)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(400, 0);
              ctx.lineTo(400, 450);
              ctx.stroke();

              // Linha de gol / demarcação inferior
              ctx.beginPath();
              ctx.moveTo(50, 380);
              ctx.lineTo(750, 380);
              ctx.stroke();

              // Placar HUD Central Superior
              ctx.fillStyle = "rgba(0, 180, 255, 0.9)";
              ctx.font = "bold 16px 'Courier New', monospace";
              ctx.fillText(`PLAYER 1: ${placar.p1}`, 300, 40);
              ctx.fillStyle = "#fff";
              ctx.fillText("|", 395, 40);
              ctx.fillStyle = "rgba(46, 204, 113, 0.9)";
              ctx.fillText(`PLAYER 2: ${placar.p2}`, 415, 40);

              // Indicadores dos Gols
              ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
              ctx.font = "11px 'Courier New', monospace";
              ctx.fillText("GOAL (P1)", 50, 405);
              ctx.fillText("GOAL (P2)", 690, 405);
              ctx.fillText("FIELD", 430, 370);

              // Raquete P1 (Azul Estilo Caixa 3D)
              ctx.strokeStyle = "#00d4ff";
              ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
              ctx.lineWidth = 3;
              ctx.strokeRect(55, game.current.p1Y, 20, 100);
              ctx.fillRect(55, game.current.p1Y, 20, 100);

              // Raquete P2 (Branca/Verde Caixa 3D)
              ctx.strokeStyle = "#ffffff";
              ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
              ctx.strokeRect(725, game.current.p2Y, 20, 100);
              ctx.fillRect(725, game.current.p2Y, 20, 100);

              // Bola AR com rastro de brilho
              ctx.shadowColor = "#ffffff";
              ctx.shadowBlur = 15;
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(game.current.ball.x, game.current.ball.y, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0; // reset

              // Hand Tracking Landmarks estilo imagem
              if (showLandmarks && handDetected && results.landmarks) {
                for (const landmarksOriginal of results.landmarks) {
                  const landmarks = landmarksOriginal as Landmark[];
                  const hiddenMask = buildHiddenMask(landmarks, hiddenFingerCountersRef.current);

                  const conexoesValidas = Vision.HandLandmarker.HAND_CONNECTIONS.filter((connection) => {
                    const { start, end } = connection as { start: number; end: number };
                    return !hiddenMask[start] && !hiddenMask[end];
                  });

                  drawingUtils.drawConnectors(landmarksOriginal as any, conexoesValidas as any, {
                    color: isHost ? '#2ecc71' : '#00d4ff',
                    lineWidth: 2
                  });
                  drawingUtils.drawLandmarks(landmarks as any, {
                    color: '#ffffff',
                    lineWidth: 1,
                    radius: 3
                  });
                }
              }
            }
            animationFrameId = requestAnimationFrame(renderLoop);
          };
          renderLoop();
        };
      }
    };

    initVision();

    return () => {
      cancelAnimationFrame(animationFrameId);
      landmarker?.close();
    };
  }, [isHost, salaId, placar, showLandmarks]);

  return (
    <div style={{
      background: '#0a0d14',
      minHeight: '100vh',
      color: '#e2e8f0',
      fontFamily: "'Courier New', monospace, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      boxSizing: 'border-box'
    }}>
      {/* TÍTULO SUPERIOR */}
      <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#94a3b8', marginBottom: '8px' }}>
        {isHost ? 'PLAYER 1 (LOCAL)' : 'PLAYER 2 (LOCAL)'}
      </div>

      {/* ÁREA DE VISÃO AR (FEED + CANVAS COM OVERLAY) */}
      <div style={{
        position: 'relative',
        width: '900px',
        height: '450px',
        border: '2px solid #3b82f6',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#000',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
      }}>
        {/* Rótulos dos Jogadores sobre o vídeo */}
        <div style={{ position: 'absolute', top: 12, left: 15, zIndex: 10, border: '1px solid #3b82f6', padding: '3px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)' }}>
          {isHost ? 'PLAYER 1 (LOCAL)' : 'PLAYER 1 (REMOTE)'}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 15, zIndex: 10, border: '1px solid #3b82f6', padding: '3px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)' }}>
          {!isHost ? 'PLAYER 2 (LOCAL)' : 'PLAYER 2 (REMOTE)'}
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
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}
        />
      </div>

      {/* DASHBOARD & DATA (TELEMETRIA E CONTROLES) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '15px',
        width: '900px',
        marginTop: '15px'
      }}>
        {/* PAINEL SOCKET.IO & STATE */}
        <div style={{ border: '1px solid #334155', borderRadius: '4px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            SOCKET.IO & STATE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>CONNECTION: <span style={{ color: '#4ade80' }}>[CONNECTED]</span> (Sala #{salaId})</div>
            <div>SYNC STATUS: <span style={{ color: '#4ade80' }}>[OK]</span> ({fps} FPS, {latency}ms)</div>
            <div>PLAYER 1: {isHost ? '(LOCAL)' : '(REMOTE)'} <span style={{ color: '#4ade80' }}>[READY]</span></div>
            <div>PLAYER 2: {!isHost ? '(LOCAL)' : '(REMOTE)'} <span style={{ color: '#4ade80' }}>[READY]</span></div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>GAME EVENT LOG</div>
            {gameLogs.map((log, index) => (
              <div key={index} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log}</div>
            ))}
          </div>
        </div>

        {/* PAINEL AR CONTROLS & PRIVACY */}
        <div style={{ border: '1px solid #334155', borderRadius: '4px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            AR CONTROLS & PRIVACY
          </div>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showLandmarks} onChange={(e) => setShowLandmarks(e.target.checked)} />
              <span>SHOW LANDMARKS (HAND TRACKING)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={anonMode} onChange={(e) => setAnonMode(e.target.checked)} />
              <span>ENABLE ANON MODE FOR RANKING</span>
            </label>
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#94a3b8' }}>
              <div>PADDLE CALIBRATION:</div>
              <div>- Sensitivity Factor: 1.6x</div>
              <div>- Sub-division: Symmetrical Field</div>
            </div>
            <button
              onClick={() => navigate('/home')}
              style={{
                marginTop: '6px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 'bold'
              }}
            >
              QUIT MATCH
            </button>
          </div>
        </div>
      </div>

      {/* RODAPÉ DO PROJETO DE TCC */}
      <div style={{ marginTop: '15px', fontSize: '11px', color: '#64748b', letterSpacing: '1px' }}>
        TCC – PONG AR PROJECT | JS, TS, REACT, MEDIAPIPE, SOCKET.IO | DESENVOLVEDOR: JHEVERSON
      </div>
    </div>
  );
};

export default Game;