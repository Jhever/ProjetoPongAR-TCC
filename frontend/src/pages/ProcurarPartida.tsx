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
      alert('É necessário estar conectado com uma conta para disputar o Online.');
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

    // 5. Partida encontrada: envia para a tela de jogo
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
      height: '100vh',
      backgroundColor: '#050505',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    backgroundGlow1: {
      position: 'absolute' as const,
      top: '0%', left: '0%', width: '100%', height: '100%',
      background: 'radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 50%)',
      zIndex: 0,
      pointerEvents: 'none' as const,
    },
    backgroundGlow2: {
      position: 'absolute' as const,
      bottom: '0%', right: '0%', width: '100%', height: '100%',
      background: 'radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
      zIndex: 0,
      pointerEvents: 'none' as const,
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      width: '100%',
    },
    mainTitle: {
      color: '#00d4ff', // Cyan Neon
      fontSize: '4.5rem',
      fontStyle: 'italic',
      fontWeight: '900',
      letterSpacing: '6px',
      textShadow: '0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3)',
      margin: '0 0 10px 0',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },
    statusTitle: {
      color: '#a855f7', // Roxo Neon
      fontSize: '1.4rem',
      fontWeight: 'bold',
      letterSpacing: '8px',
      margin: '0 0 60px 0',
      textAlign: 'center' as const,
      textShadow: '0 0 15px rgba(168, 85, 247, 0.6)',
      textTransform: 'uppercase' as const,
    },
    spinnerWrapper: {
      width: '80px',
      height: '80px',
      marginBottom: '40px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bolinhaLoading: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '4px solid rgba(168, 85, 247, 0.1)',
      borderTopColor: statusMensagem.includes('ENCONTRADA') ? '#4ade80' : '#a855f7',
      animation: statusMensagem.includes('ENCONTRADA') ? 'none' : 'spin 1s linear infinite',
      boxShadow: statusMensagem.includes('ENCONTRADA') 
        ? '0 0 20px rgba(74, 222, 128, 0.6)' 
        : '0 0 20px rgba(168, 85, 247, 0.4)',
      transition: 'all 0.3s ease',
    },
    infoText: {
      color: statusMensagem.includes('ENCONTRADA') ? '#4ade80' : '#ffffff',
      fontSize: '1.2rem',
      fontWeight: 'bold' as const,
      letterSpacing: '3px',
      margin: '0 0 50px 0',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      animation: statusMensagem.includes('ENCONTRADA') ? 'none' : 'pulseText 2s infinite',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      color: '#f87171',
      border: '2px solid #f87171',
      borderRadius: '30px',
      padding: '12px 40px',
      fontSize: '1rem',
      fontWeight: 'bold' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      textTransform: 'uppercase' as const,
      transition: 'all 0.3s ease',
      boxShadow: '0 0 15px rgba(248, 113, 113, 0.15)',
    },
  };

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes pulseText {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>

      {/* Luzes difusas no fundo da tela */}
      <div style={styles.backgroundGlow1} />
      <div style={styles.backgroundGlow2} />

      {/* Todo o conteúdo flutuando de forma centralizada */}
      <div style={styles.content}>
        <h1 style={styles.mainTitle}>PONG AR</h1>
        <h2 style={styles.statusTitle}>PARTIDA ONLINE</h2>

        <div style={styles.spinnerWrapper}>
          <div style={styles.bolinhaLoading}></div>
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
            e.currentTarget.style.boxShadow = '0 0 15px rgba(248, 113, 113, 0.15)';
          }}
        >
          Cancelar Busca
        </button>
      </div>
    </div>
  );
};

export default ProcurarPartida;