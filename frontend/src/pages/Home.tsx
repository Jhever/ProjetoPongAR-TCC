import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext'; 

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const Home = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Estado para puxar as infrações e os pontos do banco
  const [dadosAtualizados, setDadosAtualizados] = useState({ pontos: 0, infracoes: 0 });

  const { isDark, isAnonimo, userData, toggleAnonimo } = useConfig();

  // Recupera a foto salva nas configurações (emoji ou Base64)
  const avatarFoto = (userData as any)?.foto;

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
    bg: isDark ? '#07080b' : '#f8fafc',
    text: isDark ? '#f8fafc' : '#0f172a',
    card: isDark ? '#111318' : '#ffffff',
    border: isDark ? '#1f242d' : '#e2e8f0',
    accent: '#38bdf8',
    danger: '#ef4444'
  };

  const styles = {
    screen: {
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: '40px 20px',
      position: 'relative' as const,
      backgroundColor: theme.bg,
      color: theme.text,
      transition: 'background 0.3s ease, color 0.3s ease',
      boxSizing: 'border-box' as const,
      fontFamily: '"Courier New", Courier, monospace',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      marginBottom: '60px',
      width: '100%',
      maxWidth: '1100px',
      position: 'relative' as const,
    },
    profileContainer: {
      position: 'relative' as const,
      cursor: 'pointer',
    },
    profileMenu: {
      position: 'absolute' as const,
      top: '70px',
      left: '0',
      backgroundColor: theme.card,
      border: `1px solid ${theme.border}`,
      padding: '20px',
      borderRadius: '12px',
      width: '280px',
      color: theme.text,
      zIndex: 100,
      display: showProfile ? 'block' : 'none',
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.08)',
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '15px',
      paddingBottom: '12px',
      borderBottom: `1px solid ${theme.border}`,
    },
    avatarBox: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      backgroundColor: isDark ? '#1a1f2c' : '#f1f5f9',
      border: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '1.4rem',
      overflow: 'hidden',
      flexShrink: 0,
    },
    menuItemText: {
      margin: '10px 0',
      fontSize: '0.90rem',
      fontWeight: 'bold' as const,
      borderBottom: `1px solid ${theme.border}`,
      paddingBottom: '8px',
    },
    alertaInfracao: {
      margin: '10px 0',
      fontSize: '0.85rem',
      fontWeight: 'bold' as const,
      color: theme.danger,
      padding: '10px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '6px',
      border: `1px solid ${theme.danger}`
    },
    labelStyle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold' as const,
    },
    title: {
      color: theme.accent,
      fontSize: '3.5rem',
      fontWeight: '900',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: 0,
      letterSpacing: '3px',
      textAlign: 'center' as const,
      flex: 1,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '25px',
      width: '100%',
      maxWidth: '1100px',
    },
    button: {
      backgroundColor: theme.card,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderBottom: `4px solid ${theme.accent}`,
      padding: '22px 24px',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'left' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.02)',
    },
    modalBackdrop: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999, 
    },
    modalCard: {
      backgroundColor: theme.card,
      padding: '40px',
      borderRadius: '16px',
      textAlign: 'center' as const,
      boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
      border: `1px solid ${theme.border}`,
      maxWidth: '400px',
      width: '90%',
    },
    modalText: {
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      marginBottom: '30px',
      color: theme.text,
    },
    modalButtonsDiv: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
    },
    modalBtnYes: {
      padding: '12px 30px',
      backgroundColor: '#ef4444', 
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      fontSize: '1rem',
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
      fontSize: '1rem',
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
          
          {dadosAtualizados.infracoes > 0 && !showProfile && (
            <div style={{
              position: 'absolute', top: 2, right: 2, width: 12, height: 12, 
              backgroundColor: '#ef4444', borderRadius: '50%', zIndex: 10,
              boxShadow: '0 0 8px #ef4444', animation: 'pulse 2s infinite'
            }} />
          )}
          
          {/* Ícone ou Foto customizada no Header */}
          {avatarFoto ? (
            <div style={{
              width: '55px', height: '55px', borderRadius: '50%',
              border: `2px solid ${theme.accent}`, display: 'flex',
              justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
              backgroundColor: theme.card
            }}>
              {avatarFoto.startsWith('data:image') ? (
                <img src={avatarFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.8rem' }}>{avatarFoto}</span>
              )}
            </div>
          ) : (
            <UserCircle size={55} color={theme.text} strokeWidth={1.5} />
          )}
          
          {/* Menu Flutuante do Perfil */}
          <div style={styles.profileMenu} onClick={(e) => e.stopPropagation()}>
            
            {/* Cabeçalho do menu flutuante com a foto e nome resumido */}
            <div style={styles.profileHeader}>
              <div style={styles.avatarBox}>
                {avatarFoto ? (
                  avatarFoto.startsWith('data:image') ? (
                    <img src={avatarFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{avatarFoto}</span>
                  )
                ) : (
                  '👤'
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 'bold' }}>PERFIL ATIVO</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {isAnonimo ? "ANÔNIMO" : (userData?.usuario || "TESTE")}
                </div>
              </div>
            </div>

            <p style={styles.menuItemText}>
              ID: {userData?.id ? String(userData.id).padStart(8, '0') : "00000000"}
            </p>
            
            <p style={styles.menuItemText}>
              PONTOS: {dadosAtualizados.pontos}
            </p>

            {dadosAtualizados.infracoes > 0 && (
              <div style={styles.alertaInfracao}>
                ⚠️ ATENÇÃO: {dadosAtualizados.infracoes}/3 Infrações registradas.
              </div>
            )}

            <p style={{...styles.menuItemText, border: 'none', marginTop: '12px', fontSize: '0.85rem'}}>MODO ANÔNIMO:</p>
            
            <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
              <label style={styles.labelStyle}>
                <input type="radio" name="anonimo" checked={isAnonimo} onChange={toggleAnonimo} /> SIM
              </label>
              <label style={styles.labelStyle}>
                <input type="radio" name="anonimo" checked={!isAnonimo} onChange={toggleAnonimo} /> NÃO
              </label>
            </div>
          </div>
        </div>

        <h1 style={styles.title}>PONG <span style={{ color: theme.text }}>COM AR</span></h1>
      </header>

      <main style={styles.grid}>
        {menuItems.map((item, index) => (
          <button 
            key={index} 
            style={styles.button}
            onClick={() => handleMenuClick(item)}
            onMouseOver={(e) => { 
              e.currentTarget.style.backgroundColor = isDark ? '#1a1f2c' : '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.backgroundColor = theme.card;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {item}
          </button>
        ))}
      </main>

      {showExitModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <p style={styles.modalText}>Gostaria de sair do jogo Pong?</p>
            <div style={styles.modalButtonsDiv}>
           <button 
  style={styles.modalBtnYes} 
  onClick={() => {
    // 1. Remove os dados da sessão atual do usuário
    localStorage.removeItem('usuario');
    
    // 2. Fecha o modal de saída
    setShowExitModal(false);
    
    // 3. Redireciona para a tela inicial / login
    navigate('/');
  }}
  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
>
  SIM
</button>
              <button 
                style={styles.modalBtnNo} 
                onClick={() => setShowExitModal(false)}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
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