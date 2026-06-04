// src/pages/EsperarPartida.tsx
import { useLocation, useNavigate } from 'react-router-dom';

const EsperarPartida = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { modo, codigoId } = location.state || { modo: 'criar', codigoId: '000000' };

  // Define o texto com base no modo que veio da tela anterior
  const getTextoEspera = () => {
    if (modo === 'assistir') return 'CARREGANDO PARTIDA AO VIVO...';
    if (modo === 'entrar') return 'ESTABELECENDO CONEXÃO...';
    return 'AGUARDANDO CONEXÃO DO AMIGO...';
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
    },
    title: {
      color: '#87CEEB',
      fontSize: '2rem',
      marginBottom: '40px',
      fontWeight: 'bold' as const,
    },
    loaderWrapper: {
      width: '100px',
      height: '100px',
      marginBottom: '40px',
    },
    svg: {
      width: '100%',
      height: '100%',
      animation: 'rotateAll 2s linear infinite',
    },
    loadingCircle: {
      fill: 'none',
      stroke: 'white',
      strokeWidth: '4',
      strokeLinecap: 'round' as const,
      animation: 'dashEffect 2s ease-in-out infinite',
    },
    dotContainer: {
      animation: 'dotRotate 2s ease-in-out infinite',
      transformOrigin: '25px 25px',
    },
    infoText: {
      color: '#fff',
      fontSize: '1.5rem',
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
    },
    idDisplay: {
      marginTop: '20px',
      color: '#9333ea',
      fontSize: '1.8rem',
      WebkitTextStroke: '1px #fff',
    }
  };

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes rotateAll { 100% { transform: rotate(360deg); } }
          @keyframes dashEffect {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 100, 150; stroke-dashoffset: -15; }
            100% { stroke-dasharray: 1, 150; stroke-dashoffset: -125; }
          }
          @keyframes dotRotate {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(285deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <h1 style={styles.title}>PONG COM AR</h1>

      <div style={styles.loaderWrapper}>
        <svg style={styles.svg} viewBox="0 0 50 50">
          <circle style={styles.loadingCircle} cx="25" cy="25" r="20" />
          <g style={styles.dotContainer}>
            <circle cx="25" cy="5" r="4" fill="#ff00ff" />
          </g>
        </svg>
      </div>

      <p style={styles.infoText}>{getTextoEspera()}</p>
      
      {modo === 'criar' && (
        <p style={styles.idDisplay}>ID DA SALA: {codigoId}</p>
      )}
    </div>
  );
};

export default EsperarPartida;