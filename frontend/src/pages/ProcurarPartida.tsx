import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

interface UsuarioStorage {
  id?: number;
  usuario?: string;
  is_anonimo?: boolean;
}

const ProcurarPartida = () => {
  const navigate = useNavigate();
  const [statusMensagem, setStatusMensagem] = useState('PROCURANDO ADVERSÁRIO...');

  useEffect(() => {
    // 1. Valida se o usuário tem conta real para jogar partidas ranqueadas
    const usuarioSalvo: UsuarioStorage = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!usuarioSalvo.id || usuarioSalvo.is_anonimo) {
      alert('É necessário estar conectado com uma conta para disputar o Ranking Online.');
      navigate('/home');
      return;
    }

    // 2. Conecta o socket caso não esteja conectado
    if (!socket.connected) {
      socket.connect();
    }

    const jogadorId = usuarioSalvo.id;
    const nome = usuarioSalvo.usuario || 'Jogador';

    // 3. Entra na fila competitiva no backend
    socket.emit('entrarFila', { jogadorId, nome, tipoPartida: 'ONLINE' });

    // 4. Aguardando adversário
    socket.on('aguardandoAdversario', () => {
      setStatusMensagem('AGUARDANDO OPONENTE...');
    });

    // 5. Partida encontrada: envia para a tela de jogo marcando explicitamente como ONLINE
    socket.on('partidaEncontrada', (dados: {
      salaId: string;
      lado: 'esquerda' | 'direita';
      adversario: string;
      adversarioId: number | string;
    }) => {
      setStatusMensagem('PARTIDA ENCONTRADA!');
      
      // Pequeno delay para o jogador ler a mensagem antes de sumir
      setTimeout(() => {
        navigate('/game', {
          state: {
            ...dados,
            tipoPartida: 'ONLINE',
            jogadorId,
            jogadorNome: nome
          }
        });
      }, 1000);
    });

    return () => {
      socket.off('aguardandoAdversario');
      socket.off('partidaEncontrada');
    };
  }, [navigate]);

  const handleCancelar = () => {
    const usuarioSalvo: UsuarioStorage = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (socket.connected) {
      socket.emit('cancelarFila', { jogadorId: usuarioSalvo.id });
      socket.disconnect();
    }
    navigate('/home');
  };

  const styles = {
    screen: {
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#050505',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
      boxSizing: 'border-box' as const,
    },
    backgroundGlow1: {
      position: 'absolute' as const,
      top: '-20%', left: '-10%', width: '500px', height: '500px',
      background: 'radial-gradient(circle, rgba(135, 206, 235, 0.15) 0%, transparent 70%)',
      zIndex: 0,
    },
    backgroundGlow2: {
      position: 'absolute' as const,
      bottom: '-20%', right: '-10%', width: '600px', height: '600px',
      background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
      zIndex: 0,
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '600px',
      zIndex: 2,
      padding: '40px',
      backgroundColor: 'rgba(10, 10, 10, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '2.5rem',
      fontStyle: 'italic',
      fontWeight: '900',
      letterSpacing: '4px',
      textShadow: '0 0 10px rgba(135, 206, 235, 0.8), 0 0 20px rgba(135, 206, 235, 0.4)',
      margin: '0 0 5px 0',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },
    statusTitle: {
      color: '#a855f7',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      letterSpacing: '6px',
      margin: '0 0 40px 0',
      textAlign: 'center' as const,
      textShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
      textTransform: 'uppercase' as const,
    },
    loaderWrapper: {
      position: 'relative' as const,
      width: '120px',
      height: '120px',
      marginBottom: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radarCircle: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      border: '2px dashed rgba(135, 206, 235, 0.3)',
      borderRadius: '50%',
      animation: 'spin 4s linear infinite',
    },
    radarCore: {
      width: '40px',
      height: '40px',
      backgroundColor: statusMensagem.includes('ENCONTRADA') ? '#4ade80' : '#87CEEB',
      borderRadius: '50%',
      boxShadow: statusMensagem.includes('ENCONTRADA') 
        ? '0 0 20px #4ade80, 0 0 40px #4ade80' 
        : '0 0 20px #87CEEB, 0 0 40px #87CEEB, 0 0 60px #87CEEB',
      animation: statusMensagem.includes('ENCONTRADA') ? 'none' : 'pulseOrbe 1.5s ease-in-out infinite',
      transition: 'all 0.3s ease',
    },
    infoText: {
      color: statusMensagem.includes('ENCONTRADA') ? '#4ade80' : '#ffffff',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      letterSpacing: '2px',
      margin: '0 0 40px 0',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      animation: statusMensagem.includes('ENCONTRADA') ? 'none' : 'pulseText 2s infinite',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      color: '#f87171',
      border: '2px solid #f87171',
      borderRadius: '8px',
      padding: '15px 40px',
      fontSize: '1rem',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      textTransform: 'uppercase' as const,
      transition: 'all 0.3s ease',
      boxShadow: '0 0 10px rgba(248, 113, 113, 0.1)',
    },
  };

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes pulseOrbe {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          @keyframes pulseText {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>

      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />

      <div style={styles.content}>
        <div>
          <h1 style={styles.mainTitle}>PONG AR</h1>
          <h2 style={styles.statusTitle}>RANKING ONLINE</h2>
        </div>

        <div style={styles.loaderWrapper}>
          <div style={styles.radarCircle}></div>
          <div style={styles.radarCore}></div>
        </div>

        <p style={styles.infoText}>{statusMensagem}</p>

        <button
          style={styles.cancelButton}
          onClick={handleCancelar}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(248, 113, 113, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(248, 113, 113, 0.1)';
          }}
        >
          Cancelar Busca
        </button>
      </div>
    </div>
  );
};

export default ProcurarPartida;