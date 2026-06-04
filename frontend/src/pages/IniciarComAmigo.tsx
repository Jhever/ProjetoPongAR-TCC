import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const IniciarComAmigo = () => {
  const navigate = useNavigate();
  
  // Estados para os IDs
  const [meuId, setMeuId] = useState('');
  const [idAmigo, setIdAmigo] = useState('');
  const [idAssistir, setIdAssistir] = useState('');

  // Gera um ID randômico de 8 dígitos ao carregar a tela
  useEffect(() => {
    const gerarId = () => {
      // Gera número entre 10000000 e 99999999
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    };
    setMeuId(gerarId());
  }, []);

  // Função para validar se a entrada é apenas número e limitar a 8 caracteres
  const handleInputChange = (value: string, setter: (val: string) => void) => {
    const apenasNumeros = value.replace(/[^0-9]/g, '');
    if (apenasNumeros.length <= 8) {
      setter(apenasNumeros);
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
      fontFamily: '"Segoe UI", sans-serif',
      padding: '20px',
    },
    titleSection: {
      textAlign: 'center' as const,
      marginBottom: '40px',
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '4rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: 0,
    },
    subTitleBox: {
      border: '2px solid #9333ea',
      padding: '10px 40px',
      marginTop: '10px',
    },
    subTitle: {
      color: '#9333ea',
      fontSize: '4.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      WebkitTextStroke: '1px #fff',
      margin: 0,
      textAlign: 'center' as const,
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '25px',
      width: '100%',
      maxWidth: '800px',
      alignItems: 'flex-end',
      marginTop: '30px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      width: '100%',
      justifyContent: 'flex-end',
    },
    label: {
      color: '#fff',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
    },
    input: {
      width: '300px',
      height: '50px',
      backgroundColor: 'transparent',
      border: '2px solid #fff',
      color: '#fff',
      fontSize: '1.5rem',
      textAlign: 'center' as const,
      outline: 'none',
      fontFamily: 'monospace', // Melhora a visualização dos números
    },
    actionRow: {
      display: 'flex',
      gap: '20px',
      marginTop: '40px',
      width: '100%',
      maxWidth: '800px',
      justifyContent: 'center',
    },
    backButton: {
      backgroundColor: '#f87171',
      color: '#fff',
      border: 'none',
      borderRadius: '40px',
      padding: '12px 40px',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      textTransform: 'uppercase' as const,
      transition: '0.3s',
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.titleSection}>
        <h1 style={styles.mainTitle}>PONG COM AR</h1>
        <div style={styles.subTitleBox}>
          <h2 style={styles.subTitle}>INICIANDO PARTIDA COM AMIGO</h2>
        </div>
      </div>

      <div style={styles.inputGroup}>
        <div style={styles.row}>
          <span style={styles.label}>CRIAR ID PARA JOGAR COM AMIGO</span>
          <input 
            style={styles.input} 
            value={meuId} 
            readOnly 
          />
        </div>

        <div style={styles.row}>
          <span style={styles.label}>ADICIONAR ID DO AMIGO</span>
          <input 
            style={styles.input} 
            placeholder="________" 
            value={idAmigo}
            onChange={(e) => handleInputChange(e.target.value, setIdAmigo)}
          />
        </div>

        <div style={styles.row}>
          <span style={styles.label}>ASSISTIR PARTIDA DO AMIGO</span>
          <input 
            style={styles.input} 
            placeholder="________" 
            value={idAssistir}
            onChange={(e) => handleInputChange(e.target.value, setIdAssistir)}
          />
        </div>
      </div>

      <div style={styles.actionRow}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/home')}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f87171')}
        >
          VOLTAR AO MENU
        </button>
      </div>
    </div>
  );
};

export default IniciarComAmigo;