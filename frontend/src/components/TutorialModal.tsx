import React, { useEffect, useRef, useState } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    id: 0,
    titulo: 'Como funciona',
    subtitulo: 'Rebata a bola e marque 10 gols antes do adversário.',
  },
  {
    id: 1,
    titulo: 'Controle com a mão',
    subtitulo: 'Mostre apenas a mão aberta e mova para cima e para baixo.',
  },
  {
    id: 2,
    titulo: 'Ambiente e conduta',
    subtitulo: 'Jogue em local bem iluminado e não faça gestos obscenos.',
  },
  {
    id: 3,
    titulo: 'Sistema de pontos',
    subtitulo: 'Vitória: +30 pts | Derrota: +15 pts | Sair da partida: -50 pts.',
  },
];

// Pontos normalizados (0..1) de uma mão aberta (estilo MediaPipe)
const HAND_POINTS: [number, number][] = [
  [0.50, 0.88],
  [0.36, 0.78], [0.26, 0.66], [0.20, 0.54], [0.15, 0.44],
  [0.40, 0.52], [0.36, 0.34], [0.34, 0.21], [0.33, 0.10],
  [0.50, 0.48], [0.50, 0.28], [0.50, 0.15], [0.50, 0.04],
  [0.60, 0.51], [0.63, 0.33], [0.65, 0.20], [0.66, 0.10],
  [0.70, 0.58], [0.75, 0.44], [0.78, 0.34], [0.80, 0.25],
];

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [naoMostrarNovamente, setNaoMostrarNovamente] = useState(false);

  const handleFechar = () => {
    if (naoMostrarNovamente) {
      localStorage.setItem('pong_tutorial_visto', 'true');
    }
    onClose();
  };

  // Avança automaticamente a cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const W = 540;
    const H = 310;

    // Estado da bolinha para a cena 0 (Como funciona)
    const ball = { x: 110, y: 155, dx: 4.2, dy: 2.2 };
    const trail: { x: number; y: number }[] = [];
    let p1Y = 115;
    let p2Y = 115;

    const drawRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.closePath();
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, W, H);

      if (step === 0) {
        // ======================================================
        // CENA 1: COMO FUNCIONA (Trajetória pontilhada + Raquetes)
        // ======================================================
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.y <= 22 || ball.y >= H - 22) {
          ball.dy *= -1;
        }

        // Raquetes acompanham suavemente
        p1Y += (Math.max(24, Math.min(H - 104, ball.y - 40)) - p1Y) * 0.1;
        p2Y += (Math.max(24, Math.min(H - 104, ball.y - 40)) - p2Y) * 0.085;

        if (ball.x <= 72 && ball.dx < 0) {
          ball.x = 72;
          ball.dx = Math.abs(ball.dx);
        }
        if (ball.x >= W - 72 && ball.dx > 0) {
          ball.x = W - 72;
          ball.dx = -Math.abs(ball.dx);
        }

        // Guarda rastro pontilhado
        if (Math.floor(time / 22) % 2 === 0) {
          trail.push({ x: ball.x, y: ball.y });
          if (trail.length > 26) trail.shift();
        }

        // Linha central discreta
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 24);
        ctx.lineTo(W / 2, H - 24);
        ctx.stroke();
        ctx.setLineDash([]);

        // Desenha trajetória pontilhada (azul indo para direita, laranja voltando)
        trail.forEach((pt, idx) => {
          const alpha = (idx + 1) / trail.length;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.8, 0, Math.PI * 2);
          ctx.fillStyle =
            ball.dx > 0
              ? `rgba(125, 162, 255, ${alpha * 0.85})`
              : `rgba(251, 146, 60, ${alpha * 0.85})`;
          ctx.fill();
        });

        // Raquete esquerda (jogador)
        ctx.fillStyle = 'rgba(51, 65, 85, 0.9)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(46, p1Y, 14, 80, 7);
        ctx.fill();
        ctx.stroke();

        // Raquete direita (adversário)
        drawRoundedRect(W - 60, p2Y, 14, 80, 7);
        ctx.fill();
        ctx.stroke();

        // Bolinha branca com halo suave
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Placar minimalista no topo
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = "600 12px 'Segoe UI', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('META: 10 GOLS PARA VENCER', W / 2, 24);
      } else if (step === 1) {
        // ======================================================
        // CENA 2: CONTROLE SOMENTE COM A MÃO
        // ======================================================
        const wave = Math.sin(time * 0.0028); // -1 a 1
        const centerY = H / 2 + wave * 68;
        const paddleY = centerY - 40;

        // Trilha pontilhada vertical da mão
        for (let y = 55; y <= H - 55; y += 14) {
          ctx.beginPath();
          ctx.arc(285, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
          ctx.fill();
        }

        // Linha pontilhada ligando mão -> raquete
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(225, centerY);
        ctx.lineTo(108, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Raquete acompanhando a mão
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        drawRoundedRect(86, paddleY, 16, 80, 8);
        ctx.fill();
        ctx.stroke();

        // Esqueleto da mão (somente a mão, sem pessoa)
        const handSize = 118;
        const handLeft = 285 - handSize * 0.5;
        const handTop = centerY - handSize * 0.48;

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.4;
        for (const [a, b] of HAND_CONNECTIONS) {
          const pA = HAND_POINTS[a];
          const pB = HAND_POINTS[b];
          ctx.beginPath();
          ctx.moveTo(handLeft + pA[0] * handSize, handTop + pA[1] * handSize);
          ctx.lineTo(handLeft + pB[0] * handSize, handTop + pB[1] * handSize);
          ctx.stroke();
        }

        for (const [px, py] of HAND_POINTS) {
          ctx.beginPath();
          ctx.arc(handLeft + px * handSize, handTop + py * handSize, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        // Indicador circular laranja no pulso/palma (estilo Unity da referência)
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(285, centerY, 16 + Math.sin(time * 0.006) * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = "600 12px 'Segoe UI', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('MOVA A MÃO ABERTA PARA CIMA E PARA BAIXO', W / 2, H - 18);
      } else if (step === 2) {
        // ======================================================
        // CENA 3: LOCAL ILUMINADO + SEM GESTOS OBSCENOS
        // ======================================================
        const pulse = 0.7 + Math.sin(time * 0.004) * 0.3;

        // Card Esquerdo: Local Iluminado
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(36, 52, 218, 206, 14);
        ctx.fill();
        ctx.stroke();

        // Sol / Luz minimalista
        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18 * pulse;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(145, 126, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Raios de luz
        ctx.strokeStyle = `rgba(253, 224, 71, ${pulse})`;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4 + time * 0.0005;
          ctx.beginPath();
          ctx.moveTo(145 + Math.cos(ang) * 28, 126 + Math.sin(ang) * 28);
          ctx.lineTo(145 + Math.cos(ang) * 38, 126 + Math.sin(ang) * 38);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = "700 14px 'Segoe UI', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('LOCAL ILUMINADO', 145, 198);
        ctx.fillStyle = '#94a3b8';
        ctx.font = "400 12px 'Segoe UI', sans-serif";
        ctx.fillText('Facilita o rastreamento', 145, 220);
        ctx.fillText('preciso da sua mão.', 145, 236);

        // Card Direito: Sem Gestos Obscenos
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(286, 52, 218, 206, 14);
        ctx.fill();
        ctx.stroke();

        // Ícone de bloqueio / conduta
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(395, 126, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(377, 108);
        ctx.lineTo(413, 144);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = "700 14px 'Segoe UI', sans-serif";
        ctx.fillText('SEM GESTOS OBSCENOS', 395, 198);
        ctx.fillStyle = '#94a3b8';
        ctx.font = "400 12px 'Segoe UI', sans-serif";
        ctx.fillText('A IA monitora a câmera e', 395, 220);
        ctx.fillText('registra infrações.', 395, 236);
      } else {
        // ======================================================
        // CENA 4: PONTUAÇÃO (+30, +15, -50)
        // ======================================================
        const cards = [
          {
            label: 'VITÓRIA',
            pts: '+30 PTS',
            desc: 'Venceu a partida',
            color: '#4ade80',
            border: 'rgba(74, 222, 128, 0.5)',
            x: 24,
          },
          {
            label: 'DERROTA',
            pts: '+15 PTS',
            desc: 'Jogou até o fim',
            color: '#60a5fa',
            border: 'rgba(96, 165, 250, 0.5)',
            x: 192,
          },
          {
            label: 'SAIR / W.O.',
            pts: '-50 PTS',
            desc: 'Abandonou o jogo',
            color: '#f87171',
            border: 'rgba(248, 113, 113, 0.55)',
            x: 360,
          },
        ];

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = "600 12px 'Segoe UI', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('PONTUAÇÃO NO RANKING ONLINE', W / 2, 36);

        cards.forEach((c, idx) => {
          const floatY = Math.sin(time * 0.003 + idx * 1.1) * 4;
          const y = 76 + floatY;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.strokeStyle = c.border;
          ctx.lineWidth = 1.5;
          drawRoundedRect(c.x, y, 156, 170, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#cbd5e1';
          ctx.font = "700 12px 'Segoe UI', sans-serif";
          ctx.fillText(c.label, c.x + 78, y + 38);

          ctx.fillStyle = c.color;
          ctx.font = "800 26px 'Segoe UI', sans-serif";
          ctx.fillText(c.pts, c.x + 78, y + 96);

          ctx.fillStyle = '#94a3b8';
          ctx.font = "400 11px 'Segoe UI', sans-serif";
          ctx.fillText(c.desc, c.x + 78, y + 136);
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [step]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(4, 6, 12, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Container principal com degradê laranja/azul estilo referência */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '820px',
          borderRadius: '20px',
          padding: '26px',
          color: '#f8fafc',
          background:
            'radial-gradient(circle at 12% 18%, rgba(234, 88, 12, 0.55) 0%, rgba(15, 23, 42, 0.92) 48%, rgba(29, 78, 216, 0.55) 100%), #090d16',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Botão X para fechar */}
        <button
          onClick={handleFechar}
          aria-label="Fechar tutorial"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(15, 23, 42, 0.75)',
            color: '#e2e8f0',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '18px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#fb923c',
              textTransform: 'uppercase',
            }}
          >
            Guia Rápido • Pong AR
          </span>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '1.45rem', fontWeight: 700 }}>
            {STEPS[step].titulo}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
            {STEPS[step].subtitulo}
          </p>
        </div>

        {/* Área Central: Quadro Glassmorphism + Card Flutuante na Direita */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Canvas principal com borda fina de vidro */}
          <div
            style={{
              flex: '1 1 480px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              background: 'rgba(15, 23, 42, 0.32)',
              backdropFilter: 'blur(6px)',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={310}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Card escuro flutuante das etapas (estilo do print) */}
          <div
            style={{
              flex: '0 0 215px',
              background: 'rgba(11, 15, 25, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            {STEPS.map((item) => {
              const ativo = item.id === step;
              return (
                <button
                  key={item.id}
                  onClick={() => setStep(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: ativo ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: ativo ? '#ffffff' : '#94a3b8',
                    fontSize: '0.84rem',
                    fontWeight: ativo ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: ativo ? '#f97316' : 'transparent',
                      border: ativo ? '2px solid #f97316' : '1.5px solid #64748b',
                      boxShadow: ativo ? '0 0 8px #f97316' : 'none',
                    }}
                  />
                  <span>{item.titulo}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={naoMostrarNovamente}
              onChange={(e) => setNaoMostrarNovamente(e.target.checked)}
            />
            Não mostrar novamente
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((prev) => prev + 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={handleFechar}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 22px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 18px rgba(249, 115, 22, 0.45)',
                }}
              >
                Começar a Jogar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;