import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Função para lidar com o login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // No futuro, aqui você valida o usuário (Firebase/API)
    // Por enquanto, redireciona para a Home do seu TCC
    navigate('/home'); 
  };

  const styles = {
    screen: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    },
    title: {
      color: '#87CEEB',
      fontSize: '4.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      marginBottom: '30px',
      textShadow: '0 0 20px rgba(135, 206, 235, 0.6)',
      textTransform: 'uppercase' as const,
    },
    loginCard: {
      background: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '40px',
      width: '450px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
    },
    inputGroup: {
      width: '100%',
      marginBottom: '20px',
      position: 'relative' as const,
    },
    input: {
      width: '100%',
      height: '55px',
      backgroundColor: '#f1f5f9',
      border: 'none',
      borderRadius: '4px',
      padding: '0 50px 0 15px',
      color: '#000',
      fontSize: '1.1rem',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#87CEEB',
      display: 'flex',
      alignItems: 'center',
      padding: 0,
      zIndex: 2,
    },
    loginButton: {
      width: '100%',
      height: '55px',
      backgroundColor: '#87CEEB',
      color: '#000',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      marginTop: '10px',
      textTransform: 'uppercase' as const,
      transition: '0.2s',
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: '#87CEEB',
      marginTop: '15px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      textDecoration: 'underline',
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>PONG COM AR</h1>

      <div style={styles.loginCard}>
        <h2 style={{ color: '#fff', marginBottom: '30px', fontWeight: '400' }}>BEM-VINDO</h2>
        
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          {/* Campo Usuário */}
          <div style={styles.inputGroup}>
            <input 
              style={styles.input} 
              placeholder="Seu email ou nome de usuário" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>

          {/* Campo Senha */}
          <div style={styles.inputGroup}>
            <input 
              style={styles.input} 
              type={showPassword ? "text" : "password"} 
              placeholder="Sua senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>

          <button 
            type="submit"
            style={styles.loginButton}
            onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            ENTRAR
          </button>
        </form>

        <button style={styles.linkButton}>Esqueci minha senha</button>
        <button 
          style={styles.linkButton}
          onClick={() => navigate('/register')}
        >
          Criar nova conta
        </button>
      </div>
    </div>
  );
};

export default Login;