import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Importação dos ícones

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>(); 
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados separados para mostrar/esconder cada campo de senha
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
      const response = await fetch('http://localhost:3001/reset-password', {
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

  // --- ESTILOS ATUALIZADOS COM O INPUT GROUP ---
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
    },
    neonTitle: {
      color: '#87CEEB',
      fontStyle: 'italic',
      fontWeight: '900',
      fontSize: '3.5rem',
      letterSpacing: '2px',
      textShadow: '0 0 10px rgba(135, 206, 235, 0.8), 0 0 20px rgba(135, 206, 235, 0.6), 0 0 40px rgba(135, 206, 235, 0.4)',
      margin: '0 0 40px 0',
      textAlign: 'center' as const,
    },
    card: {
      backgroundColor: '#1c1c1c',
      padding: '40px 30px',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '400px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    },
    cardTitle: {
      color: '#ffffff',
      textAlign: 'center' as const,
      fontSize: '1.5rem',
      fontWeight: 'normal',
      margin: '0',
    },
    inputGroup: {
      position: 'relative' as const,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
    },
    input: {
      width: '100%',
      padding: '15px',
      paddingRight: '50px', // Espaço extra para o olhinho não sobrepor o texto
      borderRadius: '5px',
      border: 'none',
      backgroundColor: '#f0f8ff',
      color: '#333333',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '10px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#555',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px',
    },
    button: {
      width: '100%',
      padding: '15px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#87CEEB',
      color: '#000000',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'opacity 0.2s',
    },
    statusMessage: {
      color: statusMsg.startsWith('✅') ? '#a3e635' : '#ff4444',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.neonTitle}>PONG COM AR</h1>
      
      <form style={styles.card} onSubmit={handleRedefinir}>
        <h2 style={styles.cardTitle}>CRIAR NOVA SENHA</h2>

        {/* CAMPO: NOVA SENHA */}
        <div style={styles.inputGroup}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Sua nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={styles.input}
            maxLength={15}
            required
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            tabIndex={-1} // Evita que o Tab foque no olhinho e quebre a navegação
          >
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>

        {/* CAMPO: CONFIRMAR NOVA SENHA */}
        <div style={styles.inputGroup}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirme a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            style={styles.input}
            maxLength={15}
            required
          />
          <button 
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>

        {statusMsg && <p style={styles.statusMessage}>{statusMsg}</p>}

        <button 
          type="submit" 
          style={{ ...styles.button, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          disabled={isLoading}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
        >
          {isLoading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;