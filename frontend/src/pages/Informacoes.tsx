import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Informacoes: React.FC = () => {
  const navigate = useNavigate();
  const [modalAtivo, setModalAtivo] = useState<string | null>(null);

  const styles = {
    screen: {
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-start', // Alterado para flex-start para permitir scroll natural sem cortar o topo
      padding: '40px 20px',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'relative' as const,
      boxSizing: 'border-box' as const,
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: 'clamp(2.5rem, 5vw, 4rem)', // Responsivo para evitar estouro em telas menores
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: '0',
      textAlign: 'center' as const,
    },
    subTitleText: {
      color: '#9333ea',
      fontSize: 'clamp(3rem, 6vw, 4.5rem)', // Responsivo
      fontFamily: '"Arial Black", sans-serif',
      textTransform: 'uppercase' as const,
      WebkitTextStroke: '2px #00ffff',
      lineHeight: '0.9',
      textAlign: 'center' as const,
      marginTop: '-5px',
    },
    headerText: {
      color: '#87CEEB',
      fontSize: '1rem',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      marginBottom: '25px',
      letterSpacing: '1px',
      textAlign: 'center' as const,
      maxWidth: '600px',
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      maxWidth: '550px',
      marginBottom: '20px',
    },
    menuItem: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '1.1rem',
      padding: '14px 22px',
      borderRadius: '12px',
      cursor: 'pointer',
      margin: '6px 0',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      transition: '0.3s all ease',
      backdropFilter: 'blur(5px)',
      outline: 'none',
      fontWeight: 'bold' as const,
      textAlign: 'left' as const,
      boxSizing: 'border-box' as const,
    },
    bullet: {
      width: '12px',
      height: '2px',
      backgroundColor: '#9333ea',
      marginRight: '15px',
      transition: '0.3s background-color ease',
      flexShrink: 0,
    },
    overlay: {
      position: 'fixed' as const, // Alterado para fixed para cobrir toda a tela corretamente no scroll
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
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
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '30px',
      position: 'relative' as const,
      color: '#fff',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      boxSizing: 'border-box' as const,
    },
    closeBtn: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      background: 'none',
      color: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      width: '35px',
      height: '35px',
      cursor: 'pointer',
      fontSize: '18px',
      transition: '0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: '1.8rem',
      color: '#00ffff',
      marginBottom: '25px',
      textAlign: 'center' as const,
      fontWeight: '900' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: '18px',
      borderRadius: '16px',
      marginBottom: '15px',
      borderLeft: '4px solid #9333ea',
    },
    cardHeader: {
      color: '#87CEEB',
      fontWeight: 'bold' as const,
      display: 'block',
      marginBottom: '5px',
      fontSize: '1.05rem',
    },
    backButton: {
      marginTop: '10px',
      marginBottom: '20px',
      background: 'linear-gradient(to right, #f87171, #ef4444)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '14px 45px',
      fontSize: '1rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
      transition: '0.3s',
    }
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    const target = e.currentTarget;
    const bullet = target.querySelector('.bullet-item') as HTMLDivElement;
    
    if (isEnter) {
      target.style.background = 'rgba(255, 255, 255, 0.15)';
      target.style.borderColor = '#00ffff';
      target.style.transform = 'scale(1.02) translateX(8px)';
      target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
      if (bullet) bullet.style.backgroundColor = '#00ffff';
    } else {
      target.style.background = 'rgba(255, 255, 255, 0.05)';
      target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      target.style.transform = 'scale(1) translateX(0)';
      target.style.boxShadow = 'none';
      if (bullet) bullet.style.backgroundColor = '#9333ea';
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
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Ao ganhar partidas voce garante 30 pontos, caso empate 15 pontos e caso perca ganha 5 pontos para não ficar desanimado com o jogo.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🎯 MISSÕES E DESAFIOS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Completar e recolher as missões do painel diário concede pontos de ranking e também amplia sua experiência no jogo.</p>
            </div>
          </>
        );
      case 'conduta':
        return (
          <>
            <h3 style={styles.modalTitle}>REGRAS DE CONDUTA</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>⏱️ DESCONEXÕES INVOLUNTÁRIAS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Sair intencionalmente de uma partida em andamento conta como derrota automática (W.O.) e deduz -15 pontos do ranking global.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🤝 FAIR PLAY (JOGO LIMPO)</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>O uso de qualquer artifício externo para travar o sinal da webcam ou burlar o rastreamento gerará suspensão automática.</p>
            </div>
          </>
        );
      case 'denuncias':
        return (
          <>
            <h3 style={styles.modalTitle}>MODERAÇÃO POR IA</h3>
            <div style={{ ...styles.card, borderLeftColor: '#ef4444' }}>
              <span style={{ ...styles.cardHeader, color: '#ef4444' }}>🤖 DETECÇÃO DE INFRAÇÕES</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Nossas partidas são monitoradas por uma Inteligência Artificial (FastAPI). Ao registrar uma denúncia de "Gesto Obsceno" ou "AFK", a IA escaneia os últimos frames da sua câmera para confirmar a infração baseada na geometria da mão.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#f59e0b' }}>
              <span style={{ ...styles.cardHeader, color: '#f59e0b' }}>⚠️ PUNIÇÃO PROGRESSIVA</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>As penalidades ocorrem em níveis: o 1º caso gera apenas um aviso, o 2º retira 30 pontos do ranking do infrator, e a 3ª infração resulta no banimento automático da conta.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#3b82f6' }}>
              <span style={{ ...styles.cardHeader, color: '#3b82f6' }}>🛡️ FILTRO ANTI-RAGE REPORT</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Para evitar denúncias falsas por frustração, nossa IA cruza as denúncias com o placar do jogo. Se um jogador perdendo de goleada relatar uma infração inexistente, a denúncia é bloqueada.</p>
            </div>
          </>
        );
      case 'ar_funcionamento':
        return (
          <>
            <h3 style={styles.modalTitle}>REALIDADE AUMENTADA (AR)</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>👁️ VISÃO COMPUTACIONAL</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>O sistema utiliza redes neurais em tempo real (MediaPipe) para ler a transmissão da sua câmera e isolar os 21 pontos (landmarks) da sua mão.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#00ffff' }}>
              <span style={styles.cardHeader}>🔄 MAPEAMENTO DIGITAL</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Essas coordenadas físicas são projetadas e convertidas instantaneamente na movimentação vertical da raquete no jogo.</p>
            </div>
          </>
        );
      case 'hardware':
        return (
          <>
            <h3 style={styles.modalTitle}>REQUISITOS MÍNIMOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📷 WEBCAM</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Resolução mínima de 480p operando estável a 30 FPS para evitar lag e quebras na leitura dos seus gestos durante o WebRTC.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>💻 PROCESSAMENTO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Processador dual-core moderno com aceleração de hardware ativa no navegador web para processar os nós de IA sem sobrecarregar a CPU.</p>
            </div>
          </>
        );
      case 'creditos':
        return (
          <>
            <h3 style={styles.modalTitle}>CRÉDITOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🛠️ DESENVOLVEDORES PRINCIPAIS</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem', fontWeight: 'bold' }}>Jheverson Alves da Silva & Nathaniel Nicolas Rissi Soares</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#00ffff' }}>
              <span style={styles.cardHeader}>📚 ARQUITETURA DO PROJETO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Desenvolvido como software de TCC combinando Frontend em React (TypeScript), Backend Node.js (Servidor Autoritativo e WebSocket), IA em Python (FastAPI/MediaPipe) e banco de dados PostgreSQL via Supabase.</p>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.mainTitle}>PONG COM AR</h1>
      <div style={{ marginBottom: '10px' }}>
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

      <button 
        style={styles.backButton} 
        onClick={() => navigate('/home')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        VOLTAR AO MENU
      </button>

      <div style={styles.overlay} onClick={() => setModalAtivo(null)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button 
            style={styles.closeBtn} 
            onClick={() => setModalAtivo(null)}
            onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
          >✕</button>
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};

export default Informacoes;