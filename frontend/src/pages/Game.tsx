import React, { useRef, useEffect } from 'react';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useRef({
    ball: { x: 400, y: 300, dx: 5, dy: 5 },
    playerY: 300, // Coordenada Y da sua mão
    opponentY: 300, // Coordenada Y da IA ou segunda mão
  });

  // Loop principal do jogo
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // 1. Limpa o Canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 600);

      // 2. Lógica da Bola (Movimentação)
      const { ball } = gameState.current;
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Colisão paredes (top/bottom)
      if (ball.y <= 0 || ball.y >= 600) ball.dy *= -1;

      // 3. Desenhar elementos
      ctx.fillStyle = '#fff';
      ctx.fillRect(ball.x, ball.y, 15, 15); // Bola
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(20, gameState.current.playerY, 20, 100); // Raquete Jogador
      ctx.fillStyle = '#ff4d4d';
      ctx.fillRect(760, gameState.current.opponentY, 20, 100); // Raquete Oponente

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '2px solid #fff' }} />
    </div>
  );
};

export default Game;