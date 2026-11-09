import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useConfig();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await loginUser(user, password);

      if (success) {
        navigate('/home');
      } else {
        setError('E-mail ou senha incorretos!');
      }
    } catch (err: any) {
      console.error("ERRO CRÍTICO CAPTURADO NO LOGIN:", err);
      setError(`O login travou por um erro: ${err.message}`);
    }
  };

  const styles = {
    screen: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace, sans-serif",
      margin: 0,
      padding: '20px',
      overflow: 'hidden',
      position: 'relative' as const,
      boxSizing: 'border-box' as const,
    },
    backgroundGlow1: {
      position: 'absolute' as const,
      top: '-20%',
      left: '-10%',
      width: '500px',
      height: '500px',
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      zIndex: 0,
    },
    backgroundGlow2: {
      position: 'absolute' as const,
      bottom: '-20%',
      right: '-10%',
      width: '600px',
      height: '600px',
      background: 'radial-gradient(circle, rgba(46, 204, 113, 0.1) 0%, transparent 70%)',
      zIndex: 0,
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '40px',
      zIndex: 1,
    },
    title: {
      color: '#fff',
      fontSize: '4.5rem',
      fontStyle: 'italic',
      fontWeight: '900',
      letterSpacing: '4px',
      textShadow: '0 0 20px #3b82f6, 0 0 40px #00d4ff, 0 5px 15px rgba(0,0,0,0.8)',
      margin: '0 0 5px 0',
      lineHeight: 1,
      textAlign: 'center' as const,
    },
    subtitle: {
      color: '#93c5fd',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      letterSpacing: '3px',
      margin: 0,
      textAlign: 'center' as const,
    },
    loginCard: {
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      padding: '40px 30px',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '420px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      backdropFilter: 'blur(12px)',
      zIndex: 1,
    },
    cardTitle: {
      color: '#60a5fa',
      textAlign: 'center' as const,
      fontSize: '1.6rem',
      fontWeight: 'bold',
      margin: '0 0 25px 0',
      letterSpacing: '2px',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      paddingBottom: '15px',
      width: '100%',
    },
    inputGroup: {
      width: '100%',
      marginBottom: '15px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      position: 'relative' as const,
    },
    label: {
      color: '#93c5fd',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
    },
    input: {
      width: '100%',
      height: '50px',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      border: '1px solid rgba(96, 165, 250, 0.4)',
      borderRadius: '8px',
      padding: '0 45px 0 16px',
      color: '#e2e8f0',
      fontSize: '1rem',
      fontFamily: "'Courier New', monospace",
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '12px',
      bottom: '13px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#60a5fa',
      display: 'flex',
      alignItems: 'center',
      padding: 0,
      zIndex: 2,
    },
    loginButton: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: 'bold' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      marginTop: '15px',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
    },
    linkContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      width: '100%',
      alignItems: 'center',
      marginTop: '20px',
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#60a5fa',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      textDecoration: 'none',
      transition: 'color 0.2s',
      padding: 0,
    },
    statusMessage: {
      color: '#ef4444',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '10px 0',
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '6px',
      borderLeft: '3px solid #ef4444',
      width: '100%',
      boxSizing: 'border-box' as const,
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />
      
      <div style={styles.titleContainer}>
        <h1 style={styles.title}>PONG AR</h1>
        <h2 style={styles.subtitle}>(REALIDADE AUMENTADA)</h2>
      </div>

      <div style={styles.loginCard}>
        <h2 style={styles.cardTitle}>BEM-VINDO</h2>
        
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-MAIL OU USUÁRIO</label>
            <input 
              style={styles.input} 
              placeholder="jheverson@unoesc.edu.br" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>SENHA</label>
            <input 
              style={styles.input} 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p style={styles.statusMessage}>{error}</p>}

          <button 
            type="submit"
            style={styles.loginButton}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            ENTRAR
          </button>
        </form>

        <div style={styles.linkContainer}>
          <button 
            style={styles.linkButton}
            onClick={() => navigate('/esqueci-senha')}
            onMouseOver={(e) => e.currentTarget.style.color = '#93c5fd'}
            onMouseOut={(e) => e.currentTarget.style.color = '#60a5fa'}
          >
            Esqueci minha senha
          </button>
          
          <button 
            style={styles.linkButton}
            onClick={() => navigate('/register')}
            onMouseOver={(e) => e.currentTarget.style.color = '#93c5fd'}
            onMouseOut={(e) => e.currentTarget.style.color = '#60a5fa'}
          >
            Criar nova conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;