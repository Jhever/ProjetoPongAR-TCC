import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      // Faz a requisição para a rota que envia o e-mail via Nodemailer
      const response = await fetch('http://localhost:3001/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg('✅ ' + data.message); 
        setEmail(''); // Limpa o campo após o sucesso
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

  // --- ESTILOS INLINE ESPELHADOS DA TELA DE LOGIN ---
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
    instructionText: {
      color: '#aaaaaa',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0',
      lineHeight: '1.4',
    },
    input: {
      width: '100%',
      padding: '15px',
      borderRadius: '5px',
      border: 'none',
      backgroundColor: '#f0f8ff', // Azul bem clarinho/branco
      color: '#333333',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      outline: 'none',
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
    linkContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '15px',
      alignItems: 'center',
      marginTop: '10px',
    },
    link: {
      color: '#87CEEB',
      textDecoration: 'underline',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
      padding: '0',
    },
    statusMessage: {
      color: '#a3e635', // Verde limão suave para status
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      margin: '0',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.neonTitle}>PONG COM AR</h1>
      
      <form style={styles.card} onSubmit={handleRecuperar}>
        <h2 style={styles.cardTitle}>RECUPERAR SENHA</h2>
        
        <p style={styles.instructionText}>
          Digite o e-mail associado à sua conta para receber as instruções de redefinição de senha.
        </p>

        <input
          type="email"
          placeholder="Seu email de cadastro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        {statusMsg && <p style={styles.statusMessage}>{statusMsg}</p>}

        <button 
          type="submit" 
          style={{ ...styles.button, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          disabled={isLoading}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
        >
          {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
        </button>

        <div style={styles.linkContainer}>
          <button 
            type="button" 
            onClick={() => navigate('/')} // Ajuste para a sua rota de login exata
            style={styles.link}
          >
            Lembrei minha senha! Voltar para login
          </button>
        </div>
      </form>
    </div>
  );
};

export default EsqueciSenha;