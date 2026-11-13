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
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif', // Arial no container global
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box' as const,
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '40px',
    },
    title: {
      color: '#87CEEB',
      fontSize: '4.5rem',
      fontFamily: 'Arial, sans-serif', // Arial forçado no título
      fontStyle: 'italic',
      fontWeight: '900',
      letterSpacing: '4px',
      textShadow: '0 0 10px rgba(135, 206, 235, 0.8), 0 0 20px rgba(135, 206, 235, 0.6), 0 0 40px rgba(135, 206, 235, 0.4)',
      margin: '0 0 5px 0',
      lineHeight: 1,
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },
    subtitle: {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      letterSpacing: '6px',
      margin: 0,
      textAlign: 'center' as const,
      textShadow: '0 0 10px rgba(135, 206, 235, 0.5)',
    },
    loginCard: {
      backgroundColor: '#0a0a0a',
      padding: '40px 30px',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      border: '1px solid #1a1a1a',
      boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 15px rgba(135, 206, 235, 0.1)',
    },
    cardTitle: {
      color: '#87CEEB',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '1.4rem',
      fontWeight: 'bold',
      margin: '0 0 25px 0',
      letterSpacing: '2px',
    },
    inputGroup: {
      width: '100%',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      position: 'relative' as const,
    },
    label: {
      color: '#87CEEB',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
    },
    input: {
      width: '100%',
      height: '50px',
      backgroundColor: '#111111',
      border: '1px solid #333333',
      borderRadius: '6px',
      padding: '0 45px 0 15px',
      color: '#ffffff',
      fontSize: '1rem',
      fontFamily: 'Arial, sans-serif', // Arial forçado dentro da caixa de texto
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '12px',
      bottom: '13px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#87CEEB',
      display: 'flex',
      alignItems: 'center',
      padding: 0,
    },
    loginButton: {
      width: '100%',
      height: '55px',
      backgroundColor: '#87CEEB',
      color: '#000000',
      border: 'none',
      borderRadius: '6px',
      fontFamily: 'Arial, sans-serif', // Arial forçado no botão
      fontSize: '1.1rem',
      fontWeight: '900',
      letterSpacing: '2px',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase' as const,
      boxShadow: '0 0 15px rgba(135, 206, 235, 0.3)',
    },
    linkContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      width: '100%',
      alignItems: 'center',
      marginTop: '25px',
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#aaaaaa',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif', // Arial forçado nos links
      fontSize: '0.9rem',
      textDecoration: 'underline',
      transition: 'color 0.2s',
      padding: 0,
    },
    statusMessage: {
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0 0 15px 0',
      padding: '10px',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      borderRadius: '6px',
      borderLeft: '3px solid #ff4444',
      width: '100%',
      boxSizing: 'border-box' as const,
    }
  };

  return (
    <div style={styles.screen}>
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
                e.target.style.borderColor = '#87CEEB';
                e.target.style.boxShadow = '0 0 10px rgba(135, 206, 235, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
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
                e.target.style.borderColor = '#87CEEB';
                e.target.style.boxShadow = '0 0 10px rgba(135, 206, 235, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
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
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#a3ddf2';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(135, 206, 235, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#87CEEB';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(135, 206, 235, 0.3)';
            }}
          >
            ENTRAR
          </button>
        </form>

        <div style={styles.linkContainer}>
          <button 
            style={styles.linkButton}
            onClick={() => navigate('/esqueci-senha')}
            onMouseOver={(e) => e.currentTarget.style.color = '#87CEEB'}
            onMouseOut={(e) => e.currentTarget.style.color = '#aaaaaa'}
          >
            Esqueci minha senha
          </button>
          
          <button 
            style={styles.linkButton}
            onClick={() => navigate('/register')}
            onMouseOver={(e) => e.currentTarget.style.color = '#87CEEB'}
            onMouseOut={(e) => e.currentTarget.style.color = '#aaaaaa'}
          >
            Criar nova conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;