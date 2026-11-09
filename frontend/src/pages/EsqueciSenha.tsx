import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatusMsg('Por favor, insira seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Processando...');

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg('✅ ' + data.message); 
        setEmail('');
      } else {
        setStatusMsg(`❌ ${data.error || 'Erro ao tentar recuperar a senha.'}`);
      }
    } catch (error) {
      console.error('Erro de requisição:', error);
      setStatusMsg('❌ Erro de conexão com o servidor. O backend está rodando?');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden',
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
    neonTitle: {
      color: '#87CEEB',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: '4.5rem',
      letterSpacing: '4px',
      textShadow: '0 0 10px rgba(135, 206, 235, 0.8), 0 0 20px rgba(135, 206, 235, 0.6), 0 0 40px rgba(135, 206, 235, 0.4)',
      margin: '0 0 5px 0',
      textAlign: 'center' as const,
      lineHeight: 1,
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
    card: {
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
      zIndex: 1,
    },
    cardTitle: {
      color: '#87CEEB',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '1.4rem',
      fontWeight: 'bold',
      margin: '0 0 25px 0',
      letterSpacing: '2px',
      width: '100%',
    },
    instructionText: {
      color: '#94a3b8',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '0.95rem',
      margin: '0 0 20px 0',
      lineHeight: '1.5',
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
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'all 0.3s ease',
      WebkitBoxShadow: '0 0 0px 1000px #111111 inset',
      WebkitTextFillColor: '#ffffff',
    },
    button: {
      width: '100%',
      height: '55px',
      backgroundColor: '#87CEEB',
      color: '#000000',
      border: 'none',
      borderRadius: '6px',
      fontFamily: 'Arial, sans-serif',
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
    link: {
      background: 'none',
      border: 'none',
      color: '#aaaaaa',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.9rem',
      textDecoration: 'underline',
      transition: 'color 0.2s',
      padding: 0,
    },
    statusMessage: {
      color: statusMsg.includes('✅') ? '#4ade80' : '#ff4444',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0 0 15px 0',
      padding: '10px',
      backgroundColor: statusMsg.includes('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      borderRadius: '6px',
      borderLeft: `3px solid ${statusMsg.includes('✅') ? '#4ade80' : '#ff4444'}`,
      width: '100%',
      boxSizing: 'border-box' as const,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />
      
      <div style={styles.titleContainer}>
        <h1 style={styles.neonTitle}>PONG AR</h1>
        <h2 style={styles.subtitle}>(REALIDADE AUMENTADA)</h2>
      </div>
      
      <form style={styles.card} onSubmit={handleRecuperar}>
        <h2 style={styles.cardTitle}>RECUPERAR SENHA</h2>
        
        <p style={styles.instructionText}>
          Digite o e-mail associado à sua conta para receber as instruções de redefinição de senha.
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>E-MAIL CADASTRADO</label>
          <input
            type="email"
            placeholder="seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
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

        {statusMsg && <p style={styles.statusMessage}>{statusMsg}</p>}

        <button 
          type="submit" 
          style={{ 
            ...styles.button, 
            opacity: isLoading ? 0.7 : 1, 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: isLoading ? '#475569' : '#87CEEB',
            boxShadow: isLoading ? 'none' : styles.button.boxShadow
          }}
          disabled={isLoading}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#a3ddf2';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(135, 206, 235, 0.6)';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#87CEEB';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(135, 206, 235, 0.3)';
            }
          }}
        >
          {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
        </button>

        <div style={styles.linkContainer}>
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={styles.link}
            onMouseOver={(e) => e.currentTarget.style.color = '#87CEEB'}
            onMouseOut={(e) => e.currentTarget.style.color = '#aaaaaa'}
          >
            ← Voltar para o Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default EsqueciSenha;