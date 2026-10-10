import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Suporte = () => {
  const navigate = useNavigate();
  const { isDark } = useConfig();
  const [modalAtivo, setModalAtivo] = useState<string | null>(null);

  // Paleta de cores integrada com o tema do sistema
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
    topBar: {
      width: '100%',
      maxWidth: '500px',
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '20px',
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
      marginBottom: '35px',
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
      fontSize: 'clamp(2.2vw, 4vw, 3.2rem)',
      fontWeight: '900',
      textTransform: 'uppercase' as const,
      lineHeight: '1.1',
      marginTop: '4px',
      letterSpacing: '2px',
    },
    listContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      maxWidth: '500px',
      gap: '12px',
    },
    menuItem: {
      background: theme.cardBg,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      fontSize: '1rem',
      padding: '18px 24px',
      borderRadius: '12px',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontWeight: '700' as const,
      boxSizing: 'border-box' as const,
      boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)',
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
      fontSize: '1.6rem',
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
    if (isEnter) {
      target.style.borderColor = theme.accent;
      target.style.backgroundColor = theme.cardHover;
      target.style.transform = 'translateY(-2px)';
    } else {
      target.style.borderColor = theme.border;
      target.style.backgroundColor = theme.cardBg;
      target.style.transform = 'translateY(0)';
    }
  };

  const renderModalContent = () => {
    switch (modalAtivo) {
      case 'guia':
        return (
          <>
            <h3 style={styles.modalTitle}>Guia de Controle</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🖱️ MOUSE (Navegação)</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Utilize para interagir com a interface, clicar nos botões do menu e navegar entre telas.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>⌨️ TECLADO (Acesso)</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Utilizado exclusivamente para preencher cadastros, realizar login ou inserir ID.</p>
            </div>
            <div style={{ ...styles.card, borderLeftColor: theme.accent }}>
              <span style={styles.cardHeader}>✋ GESTOS (Gameplay)</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>O controle é 100% por gestos. Mova sua mão verticalmente para controlar seu "goleiro".</p>
            </div>
          </>
        );
      case 'dicas':
        return (
          <>
            <h3 style={styles.modalTitle}>Dicas Técnicas</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>💡 ILUMINAÇÃO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Evite janelas atrás de você. A luz deve iluminar sua mão de frente para a câmera.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📏 DISTÂNCIA</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Fique entre 50cm e 1m da webcam para garantir que a mão seja rastreada sem cortes.</p>
            </div>
          </>
        );
      case 'teste':
        return (
          <>
            <h3 style={styles.modalTitle}>Teste de Câmera</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🦴 RASTREIO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>Visualize o esqueleto digital da sua mão. Se os pontos seguirem seus dedos, está pronto.</p>
            </div>
          </>
        );
      case 'suporte':
        return (
          <>
            <h3 style={styles.modalTitle}>Suporte</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📧 CONTATO</span>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.5' }}>E-mail: alvesdasilvajheverson@gmail.com<br />WhatsApp: (49) 99948-2077</p>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={styles.screen}>
      {/* Botão de Voltar fixo no topo */}
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
        <h1 style={styles.mainTitle}>PONG COM AR</h1>
        <h2 style={styles.subTitleText}>SUPORTE E AJUDA</h2>
      </div>

      <div style={styles.listContainer}>
        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('guia')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          🎮 Guia de Controle (Híbrido)
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('dicas')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          ✨ Dicas de Visão Computacional
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('teste')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          📷 Teste de Câmera
        </button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('suporte')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >
          🎧 Chamar Suporte
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

export default Suporte;