import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Suporte = () => {
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
    },
    menuItem: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '1.4rem',
      padding: '15px 30px',
      borderRadius: '12px',
      cursor: 'pointer',
      margin: '10px 0',
      width: '450px',
      transition: '0.3s all ease',
      backdropFilter: 'blur(5px)',
      outline: 'none',
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
      fontSize: '2.2rem',
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

  // Função para gerenciar o efeito de Hover nos botões
  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    const target = e.currentTarget;
    if (isEnter) {
      target.style.background = 'rgba(255, 255, 255, 0.15)';
      target.style.borderColor = '#00ffff';
      target.style.transform = 'scale(1.03)';
      target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
    } else {
      target.style.background = 'rgba(255, 255, 255, 0.05)';
      target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      target.style.transform = 'scale(1)';
      target.style.boxShadow = 'none';
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
              <p style={{margin: 0, opacity: 0.8}}>Utilize para interagir com a interface, clicar nos botões do menu e navegar entre telas.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>⌨️ TECLADO (Acesso)</span>
              <p style={{margin: 0, opacity: 0.8}}>Utilizado exclusivamente para preencher cadastros, realizar login ou inserir ID.</p>
            </div>
            <div style={{...styles.card, borderLeftColor: '#00ffff'}}>
              <span style={styles.cardHeader}>✋ GESTOS (Gameplay)</span>
              <p style={{margin: 0, opacity: 0.8}}>O controle é 100% por gestos. Mova sua mão verticalmente para controlar seu "goleiro".</p>
            </div>
          </>
        );
      case 'dicas':
        return (
          <>
            <h3 style={styles.modalTitle}>Dicas Técnicas</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>💡 ILUMINAÇÃO</span>
              <p style={{margin: 0, opacity: 0.8}}>Evite janelas atrás de você. A luz deve iluminar sua mão de frente para a câmera.</p>
            </div>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📏 DISTÂNCIA</span>
              <p style={{margin: 0, opacity: 0.8}}>Fique entre 50cm e 1m da webcam para garantir que a mão seja rastreada sem cortes.</p>
            </div>
          </>
        );
      case 'teste':
        return (
          <>
            <h3 style={styles.modalTitle}>Teste de Câmera</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>🦴 RASTREIO</span>
              <p style={{margin: 0, opacity: 0.8}}>Visualize o esqueleto digital da sua mão. Se os pontos seguirem seus dedos, está pronto.</p>
            </div>
          </>
        );
      case 'suporte':
        return (
          <>
            <h3 style={styles.modalTitle}>Suporte</h3>
            <div style={styles.card}>
              <span style={styles.cardHeader}>📧 CONTATO</span>
              <p style={{margin: 0, opacity: 0.8}}>E-mail: alvesdasilvajheverson@gmail.com<br/>WhatsApp: (49) 99948-2077</p>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.mainTitle}>PONG COM AR</h1>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={styles.subTitleText}>SUPORTE E AJUDA</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('guia')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >🎮 Guia de Controle (Híbrido)</button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('dicas')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >✨ Dicas de Visão Computacional</button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('teste')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >📷 Teste de Câmera</button>

        <button 
          style={styles.menuItem} 
          onClick={() => setModalAtivo('suporte')}
          onMouseEnter={(e) => handleHover(e, true)}
          onMouseLeave={(e) => handleHover(e, false)}
        >🎧 Chamar Suporte</button>
      </div>

      <button 
        style={styles.backButton} 
        onClick={() => navigate('/home')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >VOLTAR AO MENU</button>

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

export default Suporte;