import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Importação dos ícones

const Register = () => {
  const navigate = useNavigate();
  
  // Estados para os campos do formulário
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Função para validar e criar conta
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
      const response = await fetch('http://localhost:3001/register', {
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
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
    },
    title: {
      color: '#87CEEB',
      fontSize: '4rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      marginBottom: '30px',
      textTransform: 'uppercase' as const,
      textShadow: '0 0 15px rgba(135, 206, 235, 0.4)',
    },
    window: {
      backgroundColor: '#cbd5e1',
      width: '500px',
      borderRadius: '20px',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      boxShadow: '0 0 30px rgba(135, 206, 235, 0.2)',
    },
    headerWindow: {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginBottom: '20px'
    },
    circle: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#94a3b8'
    },
    subtitle: {
      color: '#1e293b',
      fontSize: '1.5rem',
      fontWeight: 'bold' as const,
      marginBottom: '20px',
    },
    input: {
      width: '320px',
      height: '45px',
      marginBottom: '15px',
      border: '1px solid #64748b',
      borderRadius: '4px',
      padding: '0 15px',
      fontSize: '1rem',
      textAlign: 'center' as const,
      backgroundColor: '#f1f5f9',
      color: '#000',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    // Estilos novos para comportar o olhinho da senha
    inputGroup: {
      position: 'relative' as const,
      width: '320px',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
    },
    passwordInput: {
      width: '100%',
      height: '45px',
      border: '1px solid #64748b',
      borderRadius: '4px',
      padding: '0 40px 0 15px', // Espaço extra na direita para o ícone
      fontSize: '1rem',
      textAlign: 'center' as const,
      backgroundColor: '#f1f5f9',
      color: '#000',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '10px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px',
    },
    errorText: {
      color: '#dc2626',
      fontSize: '0.9rem',
      fontWeight: 'bold' as const,
      marginBottom: '15px',
      height: '20px',
    },
    footerActions: {
      display: 'flex',
      gap: '30px',
      marginTop: '20px',
    },
    actionButton: {
      background: 'none',
      border: 'none',
      color: '#1e293b',
      fontSize: '0.9rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      textDecoration: 'underline',
      transition: '0.2s',
    }
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>PONG COM AR</h1>

      <div style={styles.window}>
        <div style={styles.headerWindow}>
          <div style={styles.circle}></div>
          <div style={{ ...styles.circle, width: '60px', borderRadius: '10px' }}></div>
        </div>

        <h2 style={styles.subtitle}>CRIAÇÃO DE CONTA</h2>

        <p style={styles.errorText}>{error}</p>

        <input
          style={styles.input}
          placeholder="EMAIL"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <input
          style={styles.input}
          placeholder="CONFIRMAR EMAIL"
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="NOME USUÁRIO"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        
        {/* CAMPO DE SENHA COM O BOTÃO DE VISUALIZAR */}
        <div style={styles.inputGroup}>
          <input
            style={styles.passwordInput}
            type={showPassword ? "text" : "password"}
            placeholder="SENHA"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            tabIndex={-1} // Impede que a navegação por Tab pare no ícone
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        

        <div style={styles.footerActions}>
          <button 
            style={{...styles.actionButton, color: '#000'}} 
            onClick={handleCreateAccount}
            onMouseOver={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#000')}
          >
            CRIAR SUA CONTA
          </button>
          
          <button 
            style={styles.actionButton}
            onClick={() => navigate('/')}
          >
            VOLTAR PÁGINA LOGIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;