import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const Register = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateAccount = async () => {
    if (email === '' || user === '' || password === '') {
      setError('PREENCHA TODOS OS CAMPOS!');
      return;
    } 
    if (email !== confirmEmail) {
      setError('OS EMAILS NÃO SÃO IGUAIS!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user, email, senha: password })
      });

      if (response.ok) {
        alert('Conta criada com sucesso!');
        navigate('/');
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setError('Servidor indisponível.');
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
    subtitleGlow: {
      color: '#93c5fd',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      letterSpacing: '3px',
      margin: 0,
      textAlign: 'center' as const,
    },
    card: {
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
    registerButton: {
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
    errorText: {
      color: '#ef4444',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: error ? '0 0 15px 0' : '0',
      padding: error ? '10px' : '0',
      backgroundColor: error ? 'rgba(0,0,0,0.3)' : 'transparent',
      borderRadius: '6px',
      borderLeft: error ? '3px solid #ef4444' : 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
      height: error ? 'auto' : '0',
      overflow: 'hidden',
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />

      <div style={styles.titleContainer}>
        <h1 style={styles.title}>PONG AR</h1>
        <h2 style={styles.subtitleGlow}>(REALIDADE AUMENTADA)</h2>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>CRIAR CONTA</h2>

        <p style={styles.errorText}>{error}</p>

        <div style={{ width: '100%' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>NOME DE USUÁRIO</label>
            <input
              style={styles.input}
              placeholder="Digite seu nickname"
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
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-MAIL</label>
            <input
              style={styles.input}
              placeholder="seu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>CONFIRMAR E-MAIL</label>
            <input
              style={styles.input}
              placeholder="Confirme seu e-mail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
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
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            style={styles.registerButton} 
            onClick={handleCreateAccount}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            FINALIZAR CADASTRO
          </button>
          
          <div style={styles.linkContainer}>
            <button 
              style={styles.linkButton}
              onClick={() => navigate('/')}
              onMouseOver={(e) => e.currentTarget.style.color = '#93c5fd'}
              onMouseOut={(e) => e.currentTarget.style.color = '#60a5fa'}
            >
              ← Voltar para o Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;