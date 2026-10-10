import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext'; 

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://projetopongar-tcc.onrender.com';

const Home = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Novo estado para puxar as infrações e os pontos fresquinhos do banco
  const [dadosAtualizados, setDadosAtualizados] = useState({ pontos: 0, infracoes: 0 });

  const { isDark, isAnonimo, userData, toggleAnonimo } = useConfig();

  // Toda vez que abrir a Home, ele pergunta pro banco de dados: "Quantos pontos eu tenho?"
  useEffect(() => {
    if (userData?.id) {
      fetch(`${API_URL}/api/usuario/${userData.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setDadosAtualizados({ 
              pontos: data.pontos_totais || 0, 
              infracoes: data.total_infracoes || 0 
            });
          }
        })
        .catch(err => console.error("Erro ao buscar dados do perfil:", err));
    }
  }, [userData]);

  const theme = {
    bg: isDark ? '#000' : '#F5F5F5',
    text: isDark ? '#FFF' : '#333',
    card: isDark ? '#94a3b8' : '#e2e8f0',
    border: isDark ? 'white' : '#333',
    accent: '#87CEEB',
    danger: '#ef4444' // Cor vermelha para alertas de infração
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
      width: '260px', // Aumentei um pouquinho para caber as infos novas
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
    // Estilo para o aviso de infração
    alertaInfracao: {
      margin: '8px 0',
      fontSize: '0.9rem',
      fontWeight: 'bold' as const,
      color: theme.danger,
      padding: '8px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '4px',
      border: `1px solid ${theme.danger}`
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
    modalBackdrop: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999, 
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
      backgroundColor: '#ef4444', 
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
      backgroundColor: theme.accent, 
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
      case "JOGAR MULTIPLAYER": navigate('/modo-jogo'); break;
      case "TESTAR CAMERA (AR)": navigate('/testar-camera'); break;
      case "PARTIDA TREINO": navigate('/game-treino'); break;
      case "RANKING GLOBAL": navigate('/ranking'); break;
      case "CONFIGURAÇÃO": navigate('/configuracao'); break;
      case "INFORMAÇÕES": navigate('/informacoes'); break;
      case "SUPORTE E AJUDA": navigate('/suporte'); break;
      case "DESAFIOS": navigate('/desafios'); break;
      case "SAIR DO JOGO": setShowExitModal(true); break;
      default: console.log(`${item} em breve.`);
    }
  };

  const menuItems = [
    "JOGAR MULTIPLAYER", "PARTIDA TREINO", "TESTAR CAMERA (AR)",
    "RANKING GLOBAL", "CONFIGURAÇÃO", "INFORMAÇÕES",
    "SUPORTE E AJUDA", "DESAFIOS", "SAIR DO JOGO"
  ];

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={styles.profileContainer} onClick={() => setShowProfile(!showProfile)}>
          
          {/* Bolinha vermelha de notificação se o cara tiver infrações! */}
          {dadosAtualizados.infracoes > 0 && !showProfile && (
            <div style={{
              position: 'absolute', top: 5, right: 5, width: 14, height: 14, 
              backgroundColor: '#ef4444', borderRadius: '50%', zIndex: 10,
              boxShadow: '0 0 10px #ef4444', animation: 'pulse 2s infinite'
            }} />
          )}
          
          <UserCircle size={80} color={theme.text} strokeWidth={1} />
          
          <div style={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
            <p style={styles.menuItemText}>
              USUÁRIO: {isAnonimo ? "ANÔNIMO" : (userData?.usuario || "TESTE")}
            </p>

            <p style={styles.menuItemText}>
              ID: {userData?.id ? String(userData.id).padStart(8, '0') : "00000000"}
            </p>
            
            <p style={styles.menuItemText}>
              PONTOS: {dadosAtualizados.pontos} ⭐
            </p>

            {/* SE ELE TIVER INFRAÇÕES, MOSTRA O AVISO LOGO AQUI */}
            {dadosAtualizados.infracoes > 0 && (
              <div style={styles.alertaInfracao}>
                ⚠️ ATENÇÃO: {dadosAtualizados.infracoes}/3 Infrações registradas na sua conta.
              </div>
            )}

            <p style={{...styles.menuItemText, border: 'none', marginTop: '15px'}}>MODO ANÔNIMO:</p>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
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

      {/* --- CÓDIGO DO MODAL DE CONFIRMAÇÃO --- */}
      {showExitModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <p style={styles.modalText}>Gostaria de sair do jogo Pong?</p>
            <div style={styles.modalButtonsDiv}>
              <button 
                style={styles.modalBtnYes} 
                onClick={() => {
                  // Aqui além do navigate('/'), a gente poderia até limpar o localStorage do usuário se quisesse deslogar
                  navigate('/');
                }}
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