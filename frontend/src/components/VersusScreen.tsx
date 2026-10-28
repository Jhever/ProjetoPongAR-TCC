import React, { useEffect, useState } from 'react';

export interface PlayerVersusData {
  nome: string;
  avatar?: string;
  pontos?: number;
  vitorias?: number;
  isAI?: boolean;
  nivelIA?: 'Fácil' | 'Médio' | 'Difícil' | string;
}

interface VersusScreenProps {
  modo: 'online' | 'amistoso' | 'ia' | 'local';
  jogador1: PlayerVersusData;
  jogador2: PlayerVersusData;
  tempoExibicaoMs?: number;
  onFinish: () => void;
}

export const VersusScreen: React.FC<VersusScreenProps> = ({
  modo,
  jogador1,
  jogador2,
  tempoExibicaoMs = 4000,
  onFinish,
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(tempoExibicaoMs / 1000));

  useEffect(() => {
    // Se for partida local no mesmo PC, pula a tela de VS imediatamente
    if (modo === 'local') {
      onFinish();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const finishTimeout = setTimeout(() => {
      onFinish();
    }, tempoExibicaoMs);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [modo, tempoExibicaoMs, onFinish]);

  if (modo === 'local') return null;

  const tituloModo =
    modo === 'online'
      ? '1 vs 1 ONLINE'
      : modo === 'amistoso'
      ? 'AMISTOSO ONLINE'
      : 'DESAFIO CONTRA IA';

  const getAvatarPadrao = (nome: string, isAI?: boolean) => {
    if (isAI) return 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
  };

  return (
    <div style={styles.overlay}>
      {/* Fundo Vermelho (Esquerda) e Azul (Direita) com corte diagonal */}
      <div style={styles.bgRed} />
      <div style={styles.bgBlue} />
      <div style={styles.diagonalBeam} />

      {/* Topo: Título do Modo */}
      <div style={styles.topBadge}>
        <span style={styles.topBadgeText}>{tituloModo}</span>
      </div>

      {/* Container Principal do Confronto */}
      <div style={styles.arenaContainer}>
        {/* CARD JOGADOR 1 (ESQUERDA - VERMELHO) */}
        <div style={{ ...styles.playerCard, ...styles.cardRed }}>
          <span style={styles.playerTag}>JOGADOR 1</span>
          <div style={styles.avatarWrapperRed}>
            <img
              src={jogador1.avatar || getAvatarPadrao(jogador1.nome)}
              alt={jogador1.nome}
              style={styles.avatar}
            />
          </div>
          <h2 style={styles.playerName}>{jogador1.nome}</h2>

          <div style={styles.statsBox}>
            <div style={styles.statRow}>
              <span>🏆 Pontos:</span>
              <strong>{jogador1.pontos ?? 0}</strong>
            </div>
            <div style={styles.statRow}>
              <span>⚔️ Vitórias:</span>
              <strong>{jogador1.vitorias ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* CENTRO: VS + CONTAGEM */}
        <div style={styles.vsCenter}>
          <div style={styles.vsText}>VS</div>
          <div style={styles.scorePreview}>0 - 0</div>
          <div style={styles.countdownBadge}>Iniciando em {countdown}s...</div>
        </div>

        {/* CARD JOGADOR 2 OU IA (DIREITA - AZUL) */}
        <div style={{ ...styles.playerCard, ...styles.cardBlue }}>
          <span style={styles.playerTag}>
            {jogador2.isAI ? 'INTELIGÊNCIA ARTIFICIAL' : 'JOGADOR 2'}
          </span>
          <div style={styles.avatarWrapperBlue}>
            <img
              src={jogador2.avatar || getAvatarPadrao(jogador2.nome, jogador2.isAI)}
              alt={jogador2.nome}
              style={styles.avatar}
            />
          </div>
          <h2 style={styles.playerName}>{jogador2.nome}</h2>

          <div style={styles.statsBox}>
            {jogador2.isAI ? (
              <>
                <div style={styles.statRow}>
                  <span>🤖 Nível:</span>
                  <strong style={{ color: '#38bdf8' }}>
                    {jogador2.nivelIA || 'Médio'}
                  </strong>
                </div>
                <div style={styles.statRow}>
                  <span>⚡ Precisão:</span>
                  <strong>
                    {jogador2.nivelIA === 'Difícil'
                      ? '98%'
                      : jogador2.nivelIA === 'Médio'
                      ? '75%'
                      : '50%'}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div style={styles.statRow}>
                  <span>🏆 Pontos:</span>
                  <strong>{jogador2.pontos ?? 0}</strong>
                </div>
                <div style={styles.statRow}>
                  <span>⚔️ Vitórias:</span>
                  <strong>{jogador2.vitorias ?? 0}</strong>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
    color: '#fff',
    userSelect: 'none',
  },
  bgRed: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 25% 50%, #ef4444 0%, #7f1d1d 70%, #450a0a 100%)',
    clipPath: 'polygon(0 0, 58% 0, 42% 100%, 0% 100%)',
    zIndex: 1,
  },
  bgBlue: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 75% 50%, #2563eb 0%, #1e3a8a 70%, #090d16 100%)',
    clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)',
    zIndex: 1,
  },
  diagonalBeam: {
    position: 'absolute',
    top: '-10%',
    bottom: '-10%',
    left: '50%',
    width: '6px',
    background: 'linear-gradient(to bottom, transparent, #ffffff, #f87171, #60a5fa, transparent)',
    transform: 'translateX(-50%) rotate(13.5deg)',
    boxShadow: '0 0 25px 6px rgba(255, 255, 255, 0.85)',
    zIndex: 2,
  },
  topBadge: {
    position: 'relative',
    zIndex: 3,
    background: 'rgba(0, 0, 0, 0.65)',
    padding: '10px 28px',
    borderRadius: '999px',
    border: '2px solid rgba(255,255,255,0.25)',
    marginBottom: '28px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
  },
  topBadgeText: {
    fontSize: '1.25rem',
    fontWeight: 900,
    letterSpacing: '3px',
    color: '#fbbf24',
  },
  arenaContainer: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    maxWidth: '960px',
    gap: '24px',
  },
  playerCard: {
    flex: 1,
    maxWidth: '300px',
    padding: '28px 22px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  cardRed: {
    background: 'rgba(69, 10, 10, 0.72)',
    border: '2px solid rgba(248, 113, 113, 0.45)',
  },
  cardBlue: {
    background: 'rgba(15, 23, 42, 0.75)',
    border: '2px solid rgba(96, 165, 250, 0.45)',
  },
  playerTag: {
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '1.5px',
    opacity: 0.85,
    marginBottom: '12px',
  },
  avatarWrapperRed: {
    width: '130px',
    height: '130px',
    borderRadius: '22px',
    overflow: 'hidden',
    border: '4px solid #f87171',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
    marginBottom: '16px',
    backgroundColor: '#1f2937',
  },
  avatarWrapperBlue: {
    width: '130px',
    height: '130px',
    borderRadius: '22px',
    overflow: 'hidden',
    border: '4px solid #60a5fa',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
    marginBottom: '16px',
    backgroundColor: '#1f2937',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  playerName: {
    fontSize: '1.6rem',
    fontWeight: 800,
    margin: '0 0 16px 0',
    textAlign: 'center',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
  },
  statsBox: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.45)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
  },
  vsCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 10px',
  },
  vsText: {
    fontSize: '5.5rem',
    fontWeight: 900,
    fontStyle: 'italic',
    color: '#ffffff',
    textShadow: '0 0 25px #ef4444, 0 0 45px #3b82f6, 0 6px 12px rgba(0,0,0,0.9)',
    lineHeight: 1,
  },
  scorePreview: {
    marginTop: '14px',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '8px 24px',
    borderRadius: '10px',
    fontSize: '1.8rem',
    fontWeight: 900,
    letterSpacing: '4px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  countdownBadge: {
    marginTop: '16px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#e2e8f0',
    background: 'rgba(0,0,0,0.5)',
    padding: '6px 14px',
    borderRadius: '999px',
  },
};