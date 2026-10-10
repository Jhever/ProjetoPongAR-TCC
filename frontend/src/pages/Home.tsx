import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo, isDark } = useConfig();

  const avatarFoto = (userData as any)?.foto || '👤';
  const nomeExibido = isAnonimo ? 'ANÔNIMO' : (userData?.usuario || 'Jogador');

  // Estilo minimalista e direto, sem exageros visuais artificiais
  const theme = {
    bg: isDark ? '#000000' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    cardBg: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    accent: '#38BDF8',
    muted: '#94A3B8'
  };

  const menuItems = [
    { title: 'JOGAR MULTIPLAYER', route: '/modo-jogo' },
    { title: 'PARTIDA TREINO', route: '/game-treino' },
    { title: 'TESTAR CÂMERA (AR)', route: '/testar-camera' },
    { title: 'RANKING GLOBAL', route: '/ranking' },
    { title: 'CONFIGURAÇÃO', route: '/configuracao' },
    { title: 'INFORMAÇÕES', route: '/informacoes' },
    { title: 'SUPORTE E AJUDA', route: '/suporte' },
    { title: 'DESAFIOS', route: '/desafios' },
    { title: 'SAIR DO JOGO', route: '/' },
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
      transition: 'background 0.2s, color 0.2s'
    }}>
      {/* CABEÇALHO DO USUÁRIO */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 25px',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        marginBottom: '30px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '45px', height: '45px',
            borderRadius: '50%',
            backgroundColor: theme.border,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '1.4rem', overflow: 'hidden'
          }}>
            {avatarFoto.startsWith('data:image') ? (
              <img src={avatarFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avatarFoto
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: theme.muted, letterSpacing: '1px' }}>USUÁRIO ATIVO</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{nomeExibido}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: theme.accent, fontWeight: 'bold' }}>
          {isAnonimo ? '[ ANÔNIMO ]' : '[ ONLINE ]'}
        </div>
      </div>

      {/* TÍTULO PRINCIPAL */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '950',
          fontStyle: 'italic',
          letterSpacing: '3px',
          color: theme.accent,
          margin: 0
        }}>
          PONG COM AR
        </h1>
        <div style={{ fontSize: '0.85rem', color: theme.muted, marginTop: '5px', letterSpacing: '2px' }}>
          SISTEMA DE JOGABILIDADE POR VISÃO COMPUTACIONAL
        </div>
      </div>

      {/* GRID DE BOTÕES LIMPO E PROFISSIONAL */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '15px',
        width: '100%',
        maxWidth: '1000px'
      }}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              padding: '20px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              textAlign: 'left',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
              e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.backgroundColor = theme.cardBg;
            }}
          >
            <span>{item.title}</span>
            <span style={{ color: theme.accent, fontSize: '0.9rem' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;