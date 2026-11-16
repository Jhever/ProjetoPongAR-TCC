import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

interface UsuarioStorage {
  id?: number;
  usuario?: string;
  is_anonimo?: boolean;
}

const ProcurarPartida = () => {
  const navigate = useNavigate();
  const [statusMensagem, setStatusMensagem] = useState('ENTRANDO NA FILA...');
  const [tempoFila, setTempoFila] = useState(0);
  const [partidaEncontrada, setPartidaEncontrada] = useState(false);
  const timerRef = useRef<number | null>(null);
  // Inicia e controla o cronômetro visual da fila
  useEffect(() => {
    if (!partidaEncontrada) {
      timerRef.current = setInterval(() => {
        setTempoFila((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [partidaEncontrada]);

  // Formata os segundos para MM:SS
  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const usuarioSalvo: UsuarioStorage = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!usuarioSalvo.id || usuarioSalvo.is_anonimo) {
      alert('É necessário estar conectado com uma conta para disputar o Ranking Online.');
      navigate('/home');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const jogadorId = usuarioSalvo.id;
    const nome = usuarioSalvo.usuario || 'Jogador';

    socket.emit('entrarFila', { jogadorId, nome, tipoPartida: 'ONLINE' });

    socket.on('aguardandoAdversario', () => {
      setStatusMensagem('PROCURANDO ADVERSÁRIO');
    });

    socket.on('partidaEncontrada', (dados: {
      salaId: string;
      lado: 'esquerda' | 'direita';
      adversario: string;
      adversarioId: number | string;
    }) => {
      setPartidaEncontrada(true);
      setStatusMensagem('PARTIDA ENCONTRADA');
      
      // Delay de transição dramática
      setTimeout(() => {
        navigate('/game', {
          state: {
            ...dados,
            tipoPartida: 'ONLINE',
            jogadorId,
            jogadorNome: nome
          }
        });
      }, 1500);
    });

    return () => {
      socket.off('aguardandoAdversario');
      socket.off('partidaEncontrada');
    };
  }, [navigate]);

  const handleCancelar = () => {
    if (partidaEncontrada) return; // Trava o botão se a partida já foi achada
    
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
      backgroundColor: '#0f172a', // Fundo slate bem escuro e liso
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: '#f8fafc',
      padding: '40px',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    headerText: {
      fontSize: '0.85rem',
      fontWeight: 'bold',
      letterSpacing: '4px',
      color: '#64748b', // Slate cinza
      textTransform: 'uppercase' as const,
    },
    centerArea: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    spinnerWrapper: {
      width: '60px',
      height: '60px',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative' as const,
    },
    spinnerRing: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      border: '3px solid rgba(255, 255, 255, 0.05)',
      borderTopColor: partidaEncontrada ? '#4ade80' : '#38bdf8', // Muda de azul pra verde
      borderRadius: '50%',
      animation: partidaEncontrada ? 'none' : 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite',
    },
    spinnerCore: {
      width: '24px',
      height: '24px',
      backgroundColor: partidaEncontrada ? '#4ade80' : 'transparent',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
    },
    statusText: {
      fontSize: '1.8rem',
      fontWeight: '900',
      letterSpacing: '3px',
      margin: '0 0 15px 0',
      textTransform: 'uppercase' as const,
      color: partidaEncontrada ? '#4ade80' : '#ffffff',
    },
    timerText: {
      fontSize: '1rem',
      fontFamily: "'Courier New', monospace",
      color: '#94a3b8',
      letterSpacing: '2px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: '20px',
    },
    cancelBtn: {
      backgroundColor: 'transparent',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      padding: '12px 40px',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      cursor: partidaEncontrada ? 'default' : 'pointer',
      opacity: partidaEncontrada ? 0 : 1, // Some suavemente quando acha partida
      transition: 'all 0.2s ease',
      borderRadius: '4px',
    }
  };

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Cabeçalho minimalista estilo FPS Tático */}
      <div style={styles.header}>
        <span style={styles.headerText}>PONG AR // COMPETITIVO</span>
      </div>

      {/* Área central com o Matchmaking */}
      <div style={styles.centerArea}>
        <div style={styles.spinnerWrapper}>
          <div style={styles.spinnerRing}></div>
          <div style={styles.spinnerCore}></div>
        </div>

        <h2 style={styles.statusText}>{statusMensagem}</h2>
        
        {/* Mostra o cronômetro da fila apenas enquanto procura */}
        {!partidaEncontrada && (
          <div style={styles.timerText}>
            TEMPO DECORRIDO: {formatarTempo(tempoFila)}
          </div>
        )}
      </div>

      {/* Rodapé com botão limpo */}
      <div style={styles.footer}>
        <button
          style={styles.cancelBtn}
          onClick={handleCancelar}
          onMouseOver={(e) => {
            if (!partidaEncontrada) {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!partidaEncontrada) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            }
          }}
          disabled={partidaEncontrada}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ProcurarPartida;