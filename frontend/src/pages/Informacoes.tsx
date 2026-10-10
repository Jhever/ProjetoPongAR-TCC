import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Informacoes: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useConfig();
  const [modalAtivo, setModalAtivo] = useState<string | null>(null);

  // Paleta de cores integrada com o tema do sistema (Dark/Light)
  const theme = {
    bg: isDark ? '#07080b' : '#f8fafc',
    cardBg: isDark ? '#111318' : '#ffffff',
    cardHover: isDark ? '#181b22' : '#f1f5f9',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: '#94a3b8',
    border: isDark ? '#1f242d' : '#e2e8f0',
    accent: '#38bdf8',
    secondaryAccent: '#9333ea',
  };

  const styles = {
    screen: {
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 20px',
      fontFamily: '"Courier New", Courier, monospace',
      position: 'relative' as const,
      boxSizing: 'border-box' as const,
      transition: 'background 0.3s, color 0.3s',
    },
    // Top bar para alinhar o botão de voltar no topo
    topBar: {
      width: '100%',
      maxWidth: '700px',
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '10px',
    },
    backButtonTop: {
      backgroundColor: theme.cardBg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '10px 18px',
      fontSize: '0.85rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      letterSpacing: '1px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)',
      transition: 'all 0.2s',
    },
    headerContainer: {
      textAlign: 'center' as const,
      marginBottom: '30px',
    },
    mainTitle: {
      color: theme.text,
      fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
      fontWeight: '900',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: '0',
      letterSpacing: '2px',
    },
    subTitleText: {
      color: theme.accent,
      fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
      fontWeight: '900',
      textTransform: 'uppercase' as const,
      lineHeight: '1.1',
      marginTop: '4px',
      letterSpacing: '2px',
    },
    headerText: {
      color: theme.muted,
      fontSize: '0.8rem',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      marginBottom: '25px',
      letterSpacing: '1.5px',
      textAlign: 'center' as const,
      maxWidth: '600px',
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      maxWidth: '600px',
      gap: '12px',
      marginBottom: '30px',
    },
    menuItem: {
      background: theme.cardBg,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      fontSize: '0.95rem',
      padding: '18px 24px',
      borderRadius: '12px',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontWeight: '700' as const,
      textAlign: 'left' as const,
      boxSizing: 'border-box' as const,
      boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)',
    },
    bullet: {
      width: '10px',
      height: '10px',
      backgroundColor: theme.secondaryAccent,
      borderRadius: '50%',
      marginRight: '16px',
      transition: '0.2s background-color ease',
      flexShrink: 0,
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: modalAtivo ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box' as const,
    },
    modal: {
      width: '100%',
      maxWidth: '650px',
      maxHeight: '85vh',
      overflowY: 'auto' as const,
      backgroundColor: theme.cardBg,
      borderRadius: '16px',
      border: `1px solid ${theme.border}`,
      padding: '35px',
      position: 'relative' as const,
      color: theme.text,
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      boxSizing: 'border-box' as const,
    },
    closeBtn: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      width: '35px',
      height: '35px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: '0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: '1.5rem',
      color: theme.accent,
      marginBottom: '25px',
      textAlign: 'center' as const,
      fontWeight: '900' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '1.5px',
    },
    card: {
      backgroundColor: isDark ? '#181b22' : '#f8fafc',
      padding: '18px',
      borderRadius: '12px',
      marginBottom: '15px',
      border: `1px solid ${theme.border}`,
      borderLeft: `4px solid ${theme.secondaryAccent}`,
    },
    cardHeader: {
      color: theme.text,
      fontWeight: 'bold' as const,
      display: 'block',
      marginBottom: '6px',
      fontSize: '1rem',
      letterSpacing: '0.5px',
    },
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    const target = e.currentTarget;
    const bullet = target.querySelector('.bullet-item') as HTMLDivElement;
    
    if (isEnter) {
      target.style.borderColor = theme.accent;
      target.style.backgroundColor = theme.cardHover;
      target.style.transform = 'translateY(-2px)';
      if (bullet) bullet.style.backgroundColor = theme.accent;
    } else {
      target.style.borderColor = theme.border;
      target.style.backgroundColor = theme.cardBg;
      target.style.transform = 'translateY(0)';
      if (bullet) bullet.style.backgroundColor = theme.secondaryAccent;
    }
  };

  const renderModalContent = () => {
    switch (modalAtivo) {
      case 'ranking':
        return (
          <>
            <h3 style={styles.modalTitle}>SISTEMA DE PONTUAÇÃO</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🏆 VITÓRIAS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Ao ganhar partidas você garante 30 pontos, caso empate 15 pontos e caso perca ganha 5 pontos para não ficar desanimado com o jogo.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🎯 MISSÕES E DESAFIOS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Completar e recolher as missões do painel diário concede pontos de ranking e também amplia sua experiência no jogo.</p>
            </div>
          </>
        );
      case 'conduta':
        return (
          <>
            <h3 style={styles.modalTitle}>REGRAS DE CONDUTA</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>⏱️ DESCONEXÕES INVOLUNTÁRIAS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Sair intencionalmente de uma partida em andamento conta como derrota automática (W.O.) e deduz -15 pontos do ranking global.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🤝 FAIR PLAY (JOGO LIMPO)</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>O uso de qualquer artifício externo para travar o sinal da webcam ou burlar o rastreamento gerará suspensão automática.</p>
            </div>
          </>
        );
      case 'denuncias':
        return (
          <>
            <h3 style={styles.modalTitle}>MODERAÇÃO POR IA</h3>
            <div style={{ ...styles.card, borderLeftColor: '#ef4444' }}>
              <span style={{ ...styles.cardHeader, color: '#ef4444' }}>🤖 DETECÇÃO DE INFRAÇÕES</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Nossas partidas são monitoradas por uma Inteligência Artificial (FastAPI). Ao registrar uma denúncia de "Gesto Obsceno" ou "AFK", a IA escaneia os últimos frames da sua câmera para confirmar a infração baseada na geometria da mão.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#f59e0b' }}>
              <span style={{ ...styles.cardHeader, color: '#f59e0b' }}>⚠️ PUNIÇÃO PROGRESSIVA</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>As penalidades ocorrem em níveis: o 1º caso gera apenas um aviso, o 2º retira 30 pontos do ranking do infrator, e a 3ª infração resulta no banimento automático da conta.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#3b82f6' }}>
              <span style={{ ...styles.cardHeader, color: '#3b82f6' }}>🛡️ FILTRO ANTI-RAGE REPORT</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Para evitar denúncias falsas por frustração, nossa IA cruza as denúncias com o placar do jogo. Se um jogador perdendo de goleada relatar uma infração inexistente, a denúncia é bloqueada.</p>
            </div>
          </>
        );
      case 'ar_funcionamento':
        return (
          <>
            <h3 style={styles.modalTitle}>REALIDADE AUMENTADA (AR)</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>👁️ VISÃO COMPUTACIONAL</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>O sistema utiliza redes neurais em tempo real (MediaPipe) para ler a transmissão da sua câmera e isolar os 21 pontos (landmarks) da sua mão.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🔄 MAPEAMENTO DIGITAL</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Essas coordenadas físicas são projetadas e convertidas instantaneamente na movimentação vertical da raquete no jogo.</p>
            </div>
          </>
        );
      case 'hardware':
        return (
          <>
            <h3 style={styles.modalTitle}>REQUISITOS MÍNIMOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📷 WEBCAM</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Resolução mínima de 480p operando estável a 30 FPS para evitar lag e quebras na leitura dos seus gestos durante o WebRTC.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>💻 PROCESSAMENTO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Processador dual-core moderno com aceleração de hardware ativa no navegador web para processar os nós de IA sem sobrecarregar a CPU.</p>
            </div>
          </>
        );
      case 'creditos':
        return (
          <>
            <h3 style={styles.modalTitle}>CRÉDITOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🛠️ DESENVOLVEDORES PRINCIPAIS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5', fontWeight: 'bold' }}>Jheverson Alves da Silva & Nathaniel Nicolas Rissi Soares</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📚 ARQUITETURA DO PROJETO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Desenvolvido como software de TCC combinando Frontend em React (TypeScript), Backend Node.js (Servidor Autoritativo e WebSocket), IA em Python (FastAPI/MediaPipe) e banco de dados PostgreSQL via Supabase.</p>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={styles.screen}>
      {/* BARRA SUPERIOR COM BOTÃO DE VOLTAR AO MENU FIXADO */}
      <div style={styles.topBar}>
        <button 
          style={styles.backButtonTop} 
          onClick={() => navigate('/home')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.backgroundColor = theme.cardHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.backgroundColor = theme.cardBg;
          }}
        >
          ← VOLTAR AO MENU
        </button>
      </div>

      <div style={styles.headerContainer}>
        <h1 style={styles.mainTitle}>PONG COM REALIDADE AUMENTADA</h1>
        <h2 style={styles.subTitleText}>INFORMAÇÕES</h2>
      </div>

      <p style={styles.headerText}>REGRAS E INFORMAÇÕES SOBRE PONTUAÇÕES E COMO JOGAR</p>

      <div style={styles.listContainer}>
        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('ranking')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          CONTAGEM DE PONTOS NO RANKING GLOBAL
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('conduta')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          REGRAS DE CONDUTA EM PARTIDAS ONLINE
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('denuncias')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          SISTEMA DE DENÚNCIAS E MODERAÇÃO POR IA
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('ar_funcionamento')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          FUNCIONAMENTO DA REALIDADE AUMENTADA
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('hardware')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          REQUISITOS MÍNIMOS DE HARDWARE
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('creditos')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          <div className="bullet-item" style={styles.bullet} />
          CRÉDITOS E DESENVOLVEDORES
        </button>
      </div>

      <div style={styles.overlay} onClick={() => setModalAtivo(null)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button 
            style={styles.closeBtn} 
            onClick={() => setModalAtivo(null)}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = theme.accent)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = theme.border)}
          >✕</button>
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};

export default Informacoes;