import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Informacoes: React.FC = () => {
  const navigate = useNavigate();
  const [modalAtivo, setModalAtivo] = useState<string | null>(null);

  const styles = {
    screen: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '4rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: '0',
    },
    subTitleText: {
      color: '#9333ea',
      fontSize: '4.5rem',
      fontFamily: '"Arial Black", sans-serif',
      textTransform: 'uppercase' as const,
      WebkitTextStroke: '2px #00ffff',
      lineHeight: '0.9',
      textAlign: 'center' as const,
      marginTop: '-10px',
    },
    headerText: {
      color: '#87CEEB',
      fontSize: '1.1rem',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      marginBottom: '30px',
      letterSpacing: '1px',
      textAlign: 'center' as const,
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      maxWidth: '550px',
    },
    menuItem: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '1.2rem',
      padding: '15px 25px',
      borderRadius: '12px',
      cursor: 'pointer',
      margin: '8px 0',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      transition: '0.3s all ease',
      backdropFilter: 'blur(5px)',
      outline: 'none',
      fontWeight: 'bold' as const,
      textAlign: 'left' as const,
    },
    bullet: {
      width: '12px',
      height: '2px',
      backgroundColor: '#9333ea',
      marginRight: '15px',
      transition: '0.3s background-color ease',
    },
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: modalAtivo ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      width: '90%',
      maxWidth: '650px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '40px',
      position: 'relative' as const,
      color: '#fff',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
    },
    modalTitle: {
      fontSize: '2rem',
      color: '#00ffff',
      marginBottom: '30px',
      textAlign: 'center' as const,
      fontWeight: '900' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '15px',
      borderLeft: '4px solid #9333ea',
    },
    cardHeader: {
      color: '#87CEEB',
      fontWeight: 'bold' as const,
      display: 'block',
      marginBottom: '5px',
      fontSize: '1.1rem',
    },
    backButton: {
      marginTop: '40px',
      background: 'linear-gradient(to right, #f87171, #ef4444)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '15px 50px',
      fontSize: '1.1rem',
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
      target.style.transform = 'scale(1.03) translateX(10px)';
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
              <p style={{ margin: 0, opacity: 0.8 }}>Ao ganhar partidas voce garante 50 pontos, caso empate 25 pontos e caso perca ganha 10 pontos para não ficar desanimado com o jogo.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🎯 MISSÕES E DESAFIOS</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Completar e recolher as missões do painel diário concede pontos de ranking e também amplia sua experiência no jogo.</p>
            </div>
          </>
        );
      case 'conduta':
        return (
          <>
            <h3 style={styles.modalTitle}>REGRAS DE CONDUTA</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>⏱️ DESCONEXÕES INVOLUNTÁRIAS</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Sair intencionalmente de uma partida em andamento conta como derrota automática e deduz pontos do ranking global.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🤝 FAIR PLAY (JOGO LIMPO)</span>
              <p style={{ margin: 0, opacity: 0.8 }}>O uso de qualquer artifício externo para travar o sinal da webcam ou burlar o rastreamento gerará suspensão automática.</p>
            </div>
          </>
        );
      case 'ar_funcionamento':
        return (
          <>
            <h3 style={styles.modalTitle}>REALIDADE AUMENTADA (AR)</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>👁️ VISÃO COMPUTACIONAL</span>
              <p style={{ margin: 0, opacity: 0.8 }}>O sistema utiliza redes neurais em tempo real para ler a transmissão da sua câmera e isolar as coordenadas de movimento da sua mão.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#00ffff' }}>
              <span style={styles.cardHeader}>🔄 MAPEAMENTO DIGITAL</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Essas coordenadas físicas são projetadas e convertidas instantaneamente na movimentação vertical da barra do seu goleiro na tela.</p>
            </div>
          </>
        );
      case 'hardware':
        return (
          <>
            <h3 style={styles.modalTitle}>REQUISITOS MÍNIMOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📷 WEBCAM</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Resolução mínima de 720p operando estável a 30 FPS para evitar lag e quebras na leitura dos seus gestos.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>💻 PROCESSAMENTO</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Processador dual-core moderno com aceleração de hardware ativa no navegador web para processar os nós de IA.</p>
            </div>
          </>
        );
      case 'creditos':
        return (
          <>
            <h3 style={styles.modalTitle}>CRÉDITOS</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🛠️ DESENVOLVEDORES PRINCIPAIS</span>
              <p style={{ margin: 0, opacity: 0.8, fontWeight: 'bold' }}>Jheverson Alves da Silva & Nathaniel Nicolas Rissi Soares</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: '#00ffff' }}>
              <span style={styles.cardHeader}>📚 ARQUITETURA DO PROJETO</span>
              <p style={{ margin: 0, opacity: 0.8 }}>Desenvolvido como software interativo combinando React, Inteligência Artificial para tracking de gestos, NodeJS/PostgreSQL no Backend e uma implementação do Postgresql.</p>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.mainTitle}>PONG COM AR</h1>
      <div style={{ marginBottom: '20px' }}>
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