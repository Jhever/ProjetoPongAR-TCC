import React from 'react';
import { useNavigate } from 'react-router-dom';

const Informacoes = () => {
  const navigate = useNavigate();

  const styles = {
    screen: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      fontFamily: '"Segoe UI", sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
      paddingTop: '50px',
    },
    nebulaBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
      filter: 'blur(40px)',
      zIndex: 1,
    },
    content: {
      position: 'relative' as const,
      zIndex: 2,
      width: '90%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '4rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: 0,
    },
    subTitle: {
      color: '#9333ea',
      fontSize: '5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      WebkitTextStroke: '2px #fff',
      marginTop: '-10px',
    },
    headerText: {
      color: '#87CEEB',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      marginBottom: '30px',
    },
    listContainer: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '15px',
      marginTop: '20px',
    },
    listItem: {
      display: 'flex',
      alignItems: 'center',
      color: '#fff',
      fontSize: '1.4rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    },
    bullet: {
      width: '15px',
      height: '2px',
      backgroundColor: '#fff',
      marginRight: '15px',
    },
    backButton: {
      marginTop: '40px',
      backgroundColor: 'transparent',
      color: '#fff',
      border: '1px solid #fff',
      padding: '10px 30px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '1rem',
      textTransform: 'uppercase' as const,
      transition: '0.3s',
    }
  };

  const infoItems = [
    "COMO É FEITO A CONTAGEM DE PONTOS NO RANKING GLOBAL",
    "REGRAS DE CONDUTA EM PARTIDAS ONLINE",
    "FUNCIONAMENTO DA REALIDADE AUMENTADA",
    "REQUISITOS MÍNIMOS DE HARDWARE",
    "CRÉDITOS E DESENVOLVEDORES"
  ];

  return (
    <div style={styles.screen}>
      <div style={styles.nebulaBackground} />

      <div style={styles.content}>
        <h1 style={styles.mainTitle}>PONG COM AR</h1>
        <h2 style={styles.subTitle}>INFORMAÇÕES</h2>

        <p style={styles.headerText}>REGRAS E INFORMAÇÕES SOBRE PONTUAÇÕES E COMO JOGAR</p>

        <div style={styles.listContainer}>
          {infoItems.map((item, index) => (
            <div 
              key={index} 
              style={styles.listItem}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(10px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={styles.bullet} />
              {item}
            </div>
          ))}
        </div>

        <button 
          style={styles.backButton}
          onClick={() => navigate('/home')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.color = '#000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#fff';
          }}
        >
          Voltar ao Menu
        </button>
      </div>
    </div>
  );
};

export default Informacoes;