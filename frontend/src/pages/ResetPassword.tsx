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
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      position: 'relative' as const,
      overflowX: 'hidden' as const,
      boxSizing: 'border-box' as const,
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '40px',
      zIndex: 1,
    },
    title: {
      color: '#87CEEB',
      fontSize: '4.5rem',
      fontFamily: 'Arial, sans-serif',
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
    fieldContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      width: '100%',
      marginBottom: '20px',
    },
    label: {
      color: '#87CEEB',
      fontFamily: 'Arial, sans-serif',
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
    eyeButton: {
      position: 'absolute' as const,
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#87CEEB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      zIndex: 2,
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
    statusMessage: {
      color: statusMsg.startsWith('✅') ? '#4ade80' : '#ff4444',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0 0 15px 0',
      padding: '10px',
      backgroundColor: statusMsg.startsWith('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      borderRadius: '6px',
      borderLeft: `3px solid ${statusMsg.startsWith('✅') ? '#4ade80' : '#ff4444'}`,
      width: '100%',
      boxSizing: 'border-box' as const,
    }
  };

  return (
    <div style={styles.container}>
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
                e.target.style.borderColor = '#87CEEB';
                e.target.style.boxShadow = '0 0 10px rgba(135, 206, 235, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
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
                e.target.style.borderColor = '#87CEEB';
                e.target.style.boxShadow = '0 0 10px rgba(135, 206, 235, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333333';
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
          {isLoading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;