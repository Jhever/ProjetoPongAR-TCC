import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo, isDark } = useConfig();

  const avatarFoto = (userData as any)?.foto || '👤';
  const nomeExibido = isAnonimo ? 'ANÔNIMO' : (userData?.usuario || 'Jogador');

  // Paleta controlada e sofisticada
  const theme = {
    bg: isDark ? '#07080b' : '#f8fafc',
    cardBg: isDark ? '#111318' : '#ffffff',
    cardHover: isDark ? '#181b22' : '#f1f5f9',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#64748b' : '#64748b',
    border: isDark ? '#1f242d' : '#e2e8f0',
    borderHover: isDark ? '#38bdf8' : '#0284c7',
    accent: '#38bdf8',
  };

  const menuItems = [
    { title: 'JOGAR MULTIPLAYER', route: '/modo-jogo', tag: 'ONLINE' },
    { title: 'PARTIDA TREINO', route: '/game-treino', tag: 'SOLO' },
    { title: 'TESTAR CÂMERA (AR)', route: '/testar-camera', tag: 'WEBCAM' },
    { title: 'RANKING GLOBAL', route: '/ranking', tag: 'TOP 10' },
    { title: 'CONFIGURAÇÃO', route: '/configuracao', tag: 'AJUSTES' },
    { title: 'INFORMAÇÕES', route: '/informacoes', tag: 'REGRAS' },
    { title: 'SUPORTE E AJUDA', route: '/suporte', tag: 'CONTATO' },
    { title: 'DESAFIOS', route: '/desafios', tag: 'DIÁRIO' },
    { title: 'SAIR DO JOGO', route: '/', tag: 'SAIR', danger: true },
  ];

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: '"Courier New", Courier, monospace',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box',
      transition: 'background 0.3s, color 0.3s'
    }}>
      {/* CABEÇALHO DO USUÁRIO */}
      <div style={{
        width: '100%',
        maxWidth: '960px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        marginBottom: '40px',
        boxSizing: 'border-box',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px', height: '50px',
            borderRadius: '10px',
            backgroundColor: isDark ? '#1a1f2c' : '#f1f5f9',
            border: `1px solid ${theme.border}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '1.5rem', overflow: 'hidden'
          }}>
            {avatarFoto.startsWith('data:image') ? (
              <img src={avatarFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avatarFoto
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: theme.muted, letterSpacing: '1.5px', fontWeight: 'bold' }}>USUÁRIO LOGADO</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '2px' }}>{nomeExibido}</div>
          </div>
        </div>
        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '1px',
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
          color: theme.accent,
          border: `1px solid ${theme.accent}33`,
          fontWeight: 'bold'
        }}>
          {isAnonimo ? 'MODO ANÔNIMO' : 'STATUS: ONLINE'}
        </div>
      </div>

      {/* TÍTULO PRINCIPAL */}
      <div style={{ textAlign: 'center', marginBottom: '45px' }}>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: '900',
          letterSpacing: '4px',
          color: theme.text,
          margin: 0,
          textTransform: 'uppercase'
        }}>
          PONG <span style={{ color: theme.accent }}>COM AR</span>
        </h1>
        <div style={{ fontSize: '0.8rem', color: theme.muted, marginTop: '8px', letterSpacing: '2.5px' }}>
          INTERFACE DE CONTROLE E ACESSO RÁPIDO
        </div>
      </div>

      {/* GRID DE BOTÕES POLIDO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '960px'
      }}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              backgroundColor: theme.cardBg,
              color: item.danger ? '#ef4444' : theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              padding: '22px 24px',
              fontSize: '0.95rem',
              fontWeight: '700',
              textAlign: 'left',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.danger ? '#ef4444' : theme.borderHover;
              e.currentTarget.style.backgroundColor = theme.cardHover;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.backgroundColor = theme.cardBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                fontSize: '0.7rem', 
                color: item.danger ? '#ef4444' : theme.muted, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '1px'
              }}>
                {item.tag}
              </span>
              <span style={{ color: item.danger ? '#ef4444' : theme.accent, fontSize: '0.85rem' }}>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;