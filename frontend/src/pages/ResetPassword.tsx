import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>(); 
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senha || !confirmarSenha) {
      setStatusMsg('Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      setStatusMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Processando...');

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg('✅ ' + data.message + ' Redirecionando...');
        setTimeout(() => {
          navigate('/'); 
        }, 3000);
      } else {
        setStatusMsg(`❌ ${data.error || 'Erro ao tentar redefinir a senha.'}`);
      }
    } catch (error) {
      console.error('Erro de requisição:', error);
      setStatusMsg('❌ Erro de conexão com o servidor.');
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
    card: {
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      padding: '40px 30px',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '420px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
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
      margin: '0 0 10px 0',
      letterSpacing: '2px',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      paddingBottom: '15px',
    },
    fieldContainer: {
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
    inputGroup: {
      position: 'relative' as const,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
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
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#60a5fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      zIndex: 2,
    },
    button: {
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
      marginTop: '10px',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
    },
    statusMessage: {
      color: statusMsg.startsWith('✅') ? '#4ade80' : '#ef4444',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0',
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '6px',
      borderLeft: `3px solid ${statusMsg.startsWith('✅') ? '#4ade80' : '#ef4444'}`,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />
      
      <div style={styles.titleContainer}>
        <h1 style={styles.title}>PONG AR</h1>
        <h2 style={styles.subtitle}>(REALIDADE AUMENTADA)</h2>
      </div>
      
      <form style={styles.card} onSubmit={handleRedefinir}>
        <h2 style={styles.cardTitle}>CRIAR NOVA SENHA</h2>

        <div style={styles.fieldContainer}>
          <label style={styles.label}>NOVA SENHA</label>
          <div style={styles.inputGroup}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
              maxLength={15}
              required
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
        </div>

        <div style={styles.fieldContainer}>
          <label style={styles.label}>CONFIRMAR NOVA SENHA</label>
          <div style={styles.inputGroup}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(96, 165, 250, 0.4)';
                e.target.style.boxShadow = 'none';
              }}
              maxLength={15}
              required
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
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
          {isLoading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;