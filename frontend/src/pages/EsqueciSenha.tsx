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
      backgroundColor: '#0a0d14',
      fontFamily: "'Courier New', monospace, sans-serif",
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden',
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
    neonTitle: {
      color: '#fff',
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: '4.5rem',
      letterSpacing: '4px',
      textShadow: '0 0 20px #3b82f6, 0 0 40px #00d4ff, 0 5px 15px rgba(0,0,0,0.8)',
      margin: '0 0 40px 0',
      textAlign: 'center' as const,
      zIndex: 1,
      lineHeight: 1,
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
      gap: '24px',
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
      margin: '0',
      letterSpacing: '2px',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      paddingBottom: '15px',
    },
    instructionText: {
      color: '#94a3b8',
      textAlign: 'center' as const,
      fontSize: '0.95rem',
      margin: '0',
      lineHeight: '1.5',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      color: '#93c5fd',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(96, 165, 250, 0.4)',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      color: '#e2e8f0',
      fontSize: '1rem',
      fontFamily: "'Courier New', monospace",
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: '#fff',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      letterSpacing: '2px',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
    },
    linkContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '15px',
      alignItems: 'center',
      marginTop: '15px',
    },
    link: {
      color: '#60a5fa',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      padding: '5px 10px',
      transition: 'color 0.2s',
      fontWeight: 'bold',
    },
    statusMessage: {
      color: statusMsg.includes('✅') ? '#4ade80' : '#ef4444',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0',
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '6px',
      borderLeft: `3px solid ${statusMsg.includes('✅') ? '#4ade80' : '#ef4444'}`,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />
      
      <h1 style={styles.neonTitle}>PONG AR</h1>
      
      <form style={styles.card} onSubmit={handleRecuperar}>
        <h2 style={styles.cardTitle}>RECUPERAR SENHA</h2>
        
        <p style={styles.instructionText}>
          Digite o e-mail associado à sua conta para receber as instruções de redefinição de senha.
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>E-MAIL CADASTRADO</label>
          <input
            type="email"
            placeholder="jheverson@unoesc.edu.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
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

        {statusMsg && <p style={styles.statusMessage}>{statusMsg}</p>}

        <button 
          type="submit" 
          style={{ 
            ...styles.button, 
            opacity: isLoading ? 0.7 : 1, 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: isLoading ? '#475569' : '#3b82f6',
            boxShadow: isLoading ? 'none' : styles.button.boxShadow
          }}
          disabled={isLoading}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#2563eb')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
        >
          {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
        </button>

        <div style={styles.linkContainer}>
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={styles.link}
            onMouseOver={(e) => e.currentTarget.style.color = '#93c5fd'}
            onMouseOut={(e) => e.currentTarget.style.color = '#60a5fa'}
          >
            ← Voltar para o Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default EsqueciSenha;