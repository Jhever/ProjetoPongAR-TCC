import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Configuracao = () => {
  const navigate = useNavigate();
  const { isDark, isAnonimo, userData, toggleTheme, toggleAnonimo } = useConfig();

  const theme = {
    bg: isDark ? '#000' : '#F5F5F5',
    text: isDark ? '#FFF' : '#222',
    cardBkg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFF',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#DDD',
    accent: '#9333ea',
    cyan: '#00ffff',
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
      justifyContent: 'center',
      fontFamily: '"Segoe UI", sans-serif',
      transition: '0.3s all ease',
      padding: '20px 0',
    },
    profileBox: {
      width: '90%',
      maxWidth: '700px',
      padding: '30px',
      background: theme.cardBkg,
      borderRadius: '20px',
      border: `1px solid ${theme.borderColor}`,
      boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.1)',
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${theme.borderColor}`,
    },
    backBtn: {
      marginTop: '30px',
      background: 'linear-gradient(to right, #166534, #22c55e)',
      color: '#fff',
      border: 'none',
      padding: '15px 40px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontWeight: 'bold' as const,
      fontSize: '1.1rem',
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={{ color: '#87CEEB', fontStyle: 'italic', margin: 0 }}>PONG COM AR</h1>
      <h2 style={{ 
        color: theme.accent, 
        WebkitTextStroke: `1px ${theme.cyan}`, 
        fontSize: '3.5rem',
        margin: '10px 0 30px 0' 
      }}>PERFIL USUÁRIO</h2>

      <div style={styles.profileBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${theme.text}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>👤</div>
          <button style={{ background: 'none', border: 'none', color: theme.cyan, cursor: 'pointer', fontWeight: 'bold' }}>ALTERAR FOTO DE PERFIL</button>
        </div>

        <div style={styles.row}><span>SEU ID:</span> <span style={{ opacity: 0.8 }}>{userData.id} (NÃO MUDÁVEL)</span></div>
        <div style={styles.row}><span>SEU USUÁRIO:</span> <span style={{ opacity: 0.8 }}>{userData.usuario}</span></div>
        <div style={styles.row}><span>EMAIL:</span> <span style={{ opacity: 0.8 }}>{userData.email} (NÃO MUDÁVEL)</span></div>
        <div style={styles.row}><span>SENHA:</span> <span style={{ opacity: 0.8 }}>•••••••• (ALTERAR A CADA 30 DIAS)</span></div>

        <div style={styles.row}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>ATIVAR MODO ANÔNIMO:</span>
            <small style={{ opacity: 0.6 }}>QUANDO ATIVADO, NINGUÉM PODE VER SEU USUÁRIO, APENAS SEUS PONTOS</small>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <label><input type="radio" checked={!isAnonimo} onChange={toggleAnonimo} /> NÃO</label>
             <label><input type="radio" checked={isAnonimo} onChange={toggleAnonimo} /> SIM</label>
          </div>
        </div>

        <div style={{ ...styles.row, borderBottom: 'none', justifyContent: 'center', marginTop: '10px' }}>
          <button onClick={toggleTheme} style={{ padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', backgroundColor: isDark ? '#333' : '#DDD', color: theme.text, border: 'none' }}>
            {isDark ? '🌙 MODO ESCURO' : '☀️ MODO CLARO'}
          </button>
        </div>
      </div>

      <button style={styles.backBtn} onClick={() => navigate('/home')}>
        VOLTAR PÁGINA INICIAL ➔
      </button>
    </div>
  );
};

export default Configuracao;