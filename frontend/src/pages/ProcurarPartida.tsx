import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProcurarPartida = () => {
  const navigate = useNavigate();

  // Simulação: Após 5 segundos procurando, ele encontraria uma partida
  // Útil para você testar o fluxo de navegação no TCC
  useEffect(() => {
    const timer = setTimeout(() => {
      // navigate('/jogo'); // Descomente quando a tela de jogo estiver pronta
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
      position: 'relative' as const,
      overflow: 'hidden',
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      zIndex: 2,
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '4.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      margin: 0,
    },
    statusTitle: {
      color: '#9333ea',
      fontSize: '5.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      textTransform: 'uppercase' as const,
      WebkitTextStroke: '2px #fff',
      margin: '10px 0 40px 0',
      textAlign: 'center' as const,
    },
    infoWrapper: {
      alignSelf: 'flex-end',
      marginRight: '12%',
      textAlign: 'right' as const,
      color: '#fff',
      marginBottom: '40px',
    },
    infoText: {
      fontSize: '1.8rem',
      fontWeight: 'bold' as const,
      margin: '5px 0',
    },
    actionContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '20px',
      alignSelf: 'flex-end',
      marginRight: '15%',
    },
    loaderWrapper: {
      width: '80px',
      height: '80px',
    },
    svg: {
      width: '100%',
      height: '100%',
      animation: 'fullRotate 2s linear infinite',
    },
    loadingCircle: {
      fill: 'none',
      stroke: 'white',
      strokeWidth: '4',
      strokeLinecap: 'round' as const,
      animation: 'dashEffect 1.5s ease-in-out infinite',
    },
    headDot: {
      fill: '#ff00ff',
      animation: 'dotOrbit 1.5s ease-in-out infinite',
      transformOrigin: '25px 25px',
    },
    cancelButton: {
      backgroundColor: '#f87171',
      color: '#fff',
      border: 'none',
      borderRadius: '40px',
      padding: '15px 40px',
      fontSize: '1.4rem',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      textTransform: 'uppercase' as const,
      transition: '0.2s',
    },
  };

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes fullRotate {
            100% { transform: rotate(360deg); }
          }
          @keyframes dashEffect {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 1, 150; stroke-dashoffset: -125; }
          }
          @keyframes dotOrbit {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(100deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={styles.content}>
        <h1 style={styles.mainTitle}>PONG COM AR</h1>
        <h2 style={styles.statusTitle}>INICIANDO PARTIDA</h2>

        <div style={styles.infoWrapper}>
          <p style={styles.infoText}>PROCURANDO PARTIDA</p>
          <p style={styles.infoText}>POR FAVOR AGUARDE</p>
        </div>

        <div style={styles.actionContainer}>
          <div style={styles.loaderWrapper}>
            <svg style={styles.svg} viewBox="0 0 50 50">
              <circle style={styles.loadingCircle} cx="25" cy="25" r="20" />
              <circle style={styles.headDot} cx="25" cy="5" r="3.5" />
            </svg>
          </div>
          
          <button 
            style={styles.cancelButton}
            onClick={() => navigate('/home')}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f87171')}
          >
            CANCELAR BUSCA
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcurarPartida;