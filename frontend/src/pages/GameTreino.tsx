import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Vision from "@mediapipe/tasks-vision";

const GameTreino = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  
  const [placar, setPlacar] = useState({ voce: 0, robo: 0 });
  const [dificuldade, setDificuldade] = useState('medio'); // Estado da dificuldade
  const game = useRef({ ball: { x: 400, y: 225, dx: 6, dy: 6 }, playerY: 175, robotY: 175 });

  // Configuração da IA baseada na dificuldade
  const configIA = {
    facil: { speed: 0.04, error: 20 },
    medio: { speed: 0.08, error: 10 },
    dificil: { speed: 0.12, error: 5 },
    expert: { speed: 0.18, error: 0 }
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
                  game.current.playerY = results.landmarks[0][0].y * 450 - 50;
                  isHandOnLeft = true;
                }
              }

              game.current.ball.x += game.current.ball.dx; 
              game.current.ball.y += game.current.ball.dy;
              
              if (game.current.ball.y <= 0 || game.current.ball.y >= 440) game.current.ball.dy *= -1;
              if (game.current.ball.x <= 35 && game.current.ball.y > game.current.playerY && game.current.ball.y < game.current.playerY + 100) game.current.ball.dx *= -1;
              if (game.current.ball.x >= 765 && game.current.ball.y > game.current.robotY && game.current.ball.y < game.current.robotY + 100) game.current.ball.dx *= -1;
              
              if (game.current.ball.x < 0) { setPlacar(p => ({...p, robo: p.robo + 1})); game.current.ball.x = 400; }
              else if (game.current.ball.x > 800) { setPlacar(p => ({...p, voce: p.voce + 1})); game.current.ball.x = 400; }
              
              // Lógica de IA aplicada
              const level = configIA[dificuldade as keyof typeof configIA];
              const targetY = game.current.ball.y - 50 + (Math.random() - 0.5) * level.error;
              game.current.robotY += (targetY - game.current.robotY) * level.speed;

              // DESENHO
              ctx.clearRect(0, 0, 800, 450);
              ctx.fillStyle = "#4eac4e"; ctx.fillRect(400, 0, 400, 450);
              ctx.strokeStyle = "white"; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 450); ctx.stroke();
              ctx.beginPath(); ctx.arc(400, 225, 60, 0, Math.PI * 2); ctx.stroke();
              ctx.fillStyle = "#00d4ff"; ctx.fillRect(20, game.current.playerY, 15, 100);
              ctx.fillStyle = "#ff0055"; ctx.fillRect(765, game.current.robotY, 15, 100);
              ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(game.current.ball.x, game.current.ball.y, 8, 0, Math.PI * 2); ctx.fill();

              if (isHandOnLeft && results.landmarks) {
                for (const landmarks of results.landmarks) {
                  drawingUtils.drawConnectors(landmarks, Vision.HandLandmarker.HAND_CONNECTIONS, { color: '#ff0055', lineWidth: 4 });
                  drawingUtils.drawLandmarks(landmarks, { color: '#ffffff', lineWidth: 1, radius: 6 });
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
  }, [dificuldade]); // Re-executa se a dificuldade mudar

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ width: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span>ROBÔ: {placar.robo}</span>
        <select onChange={(e) => setDificuldade(e.target.value)} value={dificuldade} style={{ padding: '5px' }}>
          <option value="facil">Fácil</option>
          <option value="medio">Médio</option>
          <option value="dificil">Difícil</option>
          <option value="expert">Expert</option>
        </select>
        <span>VOCÊ: {placar.voce}</span>
      </div>
      
      <div style={{ position: 'relative', width: '800px', height: '450px', border: '4px solid #333', borderRadius: '15px', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline style={{ position: 'absolute', width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }} />
        <canvas ref={canvasRef} width={800} height={450} style={{ position: 'absolute', top: 0, left: 0, transform: 'scaleX(-1)' }} />
      </div>
      
      <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>VOLTAR</button>
    </div>
  );
};

export default GameTreino;