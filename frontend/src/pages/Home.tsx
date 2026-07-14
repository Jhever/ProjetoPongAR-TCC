import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext'; // Importando o contexto global

const Home = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  
  // NOVO ESTADO: Controla a exibição da mensagem de saída
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Usando os dados do "Cofre" global
  const { isDark, isAnonimo, userData, toggleAnonimo } = useConfig();

  const theme = {
    bg: isDark ? '#000' : '#F5F5F5',
    text: isDark ? '#FFF' : '#333',
    card: isDark ? '#94a3b8' : '#e2e8f0',
    border: isDark ? 'white' : '#333',
    accent: '#87CEEB',
  };

  const styles = {
    screen: {
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: '40px',
      position: 'relative' as const,
      backgroundColor: theme.bg,
      color: theme.text,
      transition: '0.3s all ease',
      boxSizing: 'border-box' as const,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '80px',
      width: '100%',
      maxWidth: '1200px',
      position: 'relative' as const,
    },
    profileContainer: {
      position: 'relative' as const,
      cursor: 'pointer',
    },
    profileMenu: {
      position: 'absolute' as const,
      top: '90px',
      left: '0',
      backgroundColor: theme.card,
      padding: '15px',
      borderRadius: '8px',
      width: '240px',
      color: isDark ? '#fff' : '#000',
      zIndex: 100,
      display: showProfile ? 'block' : 'none',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    },
    menuItemText: {
      margin: '8px 0',
      fontSize: '1rem',
      fontWeight: 'bold' as const,
      borderBottom: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
      paddingBottom: '5px',
    },
    labelStyle: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    title: {
      color: theme.accent,
      fontSize: '4.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: 0,
      flex: 1,
      textAlign: 'center' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '60px 40px',
      width: '100%',
      maxWidth: '1200px',
    },
    button: {
      background: 'transparent',
      color: theme.text,
      border: 'none',
      borderBottom: `6px solid ${theme.text}`,
      paddingBottom: '10px',
      fontSize: '1.1rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      transition: '0.3s',
      textAlign: 'left' as const,
      textTransform: 'uppercase' as const,
    },
    // --- ESTILOS DO MODAL DE SAÍDA ---
    modalBackdrop: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fundo escurecido
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999, // Fica por cima de absolutamente tudo
    },
    modalCard: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      padding: '40px',
      borderRadius: '15px',
      textAlign: 'center' as const,
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: `2px solid ${theme.accent}`,
      maxWidth: '400px',
      width: '90%',
    },
    modalText: {
      fontSize: '1.4rem',
      fontWeight: 'bold' as const,
      marginBottom: '30px',
      color: theme.text,
    },
    modalButtonsDiv: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
    },
    modalBtnYes: {
      padding: '12px 30px',
      backgroundColor: '#ef4444', // Vermelho para a ação destrutiva (sair)
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      fontSize: '1.1rem',
      transition: '0.2s',
    },
    modalBtnNo: {
      padding: '12px 30px',
      backgroundColor: theme.accent, // Azul do tema para manter no jogo
      color: '#000',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      fontSize: '1.1rem',
      transition: '0.2s',
    }
  };

  const handleMenuClick = (item: string) => {
    switch (item) {
      case "INICIAR PARTIDA ONLINE": navigate('/procurar-partida'); break;
      case "INICIAR PARTIDA COM AMIGO": navigate('/iniciar-com-amigo'); break;
      case "TESTAR CAMERA (AR)": navigate('/testar-camera'); break;
      case "PARTIDA TREINO": navigate('/game-treino'); break;
      case "RANKING GLOBAL": navigate('/ranking'); break;
      case "CONFIGURAÇÃO": navigate('/configuracao'); break;
      case "INFORMAÇÕES": navigate('/informacoes'); break;
      case "SUPORTE E AJUDA": navigate('/suporte'); break;
      case "DESAFIOS": navigate('/desafios'); break;
      
      // ⚠️ MUDANÇA AQUI: Abre o modal em vez de sair direto
      case "SAIR DO JOGO": setShowExitModal(true); break;
      
      default: console.log(`${item} em breve.`);
    }
  };

  const menuItems = [
    "INICIAR PARTIDA ONLINE", "INICIAR PARTIDA COM AMIGO", "TESTAR CAMERA (AR)",
    "PARTIDA TREINO", "RANKING GLOBAL", "CONFIGURAÇÃO",
    "INFORMAÇÕES", "SUPORTE E AJUDA", "SAIR DO JOGO"
  ];

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={styles.profileContainer} onClick={() => setShowProfile(!showProfile)}>
          <UserCircle size={80} color={theme.text} strokeWidth={1} />
          
          <div style={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
            <p style={styles.menuItemText}>
              USUÁRIO: {isAnonimo ? "ANÔNIMO" : (userData?.usuario || "TESTE")}
            </p>

            <p style={styles.menuItemText}>
              ID: {isAnonimo ? "########" : (userData?.id ? String(userData.id).padStart(8, '0') : "00000000")}
            </p>

            <p style={{...styles.menuItemText, border: 'none'}}>MODO ANÔNIMO:</p>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <label style={styles.labelStyle}>
                <input type="radio" name="anonimo" checked={isAnonimo} onChange={toggleAnonimo} /> SIM
              </label>
              <label style={styles.labelStyle}>
                <input type="radio" name="anonimo" checked={!isAnonimo} onChange={toggleAnonimo} /> NÃO
              </label>
            </div>
          </div>
        </div>

        <h1 style={styles.title}>PONG COM AR</h1>
      </header>

      <main style={styles.grid}>
        {menuItems.map((item, index) => (
          <button 
            key={index} 
            style={styles.button}
            onClick={() => handleMenuClick(item)}
            onMouseOver={(e) => { e.currentTarget.style.borderBottomColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
            onMouseOut={(e) => { e.currentTarget.style.borderBottomColor = theme.text; e.currentTarget.style.color = theme.text; }}
          >
            {item}
          </button>
        ))}
      </main>

      <footer style={{ marginTop: '60px' }}>
        <button style={{...styles.button, width: '200px', borderBottomColor: '#9333ea'}} onClick={() => navigate('/desafios')}>
          DESAFIOS
        </button>
      </footer>

      {/* --- CÓDIGO DO MODAL DE CONFIRMAÇÃO --- */}
      {showExitModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <p style={styles.modalText}>Gostaria de sair do jogo Pong?</p>
            <div style={styles.modalButtonsDiv}>
              <button 
                style={styles.modalBtnYes} 
                onClick={() => navigate('/')}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                SIM
              </button>
              <button 
                style={styles.modalBtnNo} 
                onClick={() => setShowExitModal(false)}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                NÃO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;