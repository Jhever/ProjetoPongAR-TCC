import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

const IniciarComAmigo = () => {
  const navigate = useNavigate();
  const [codigoEntrada, setCodigoEntrada] = useState('');
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState('');
  const [aguardandoAmigo, setAguardandoAmigo] = useState(false);

  // Obtém o usuário autenticado ou define um identificador fallback
  const usuarioSalvo = JSON.parse(localStorage.getItem('usuario') || '{}');
  const jogadorId = usuarioSalvo.id || Math.floor(Math.random() * 10000);
  const nome = usuarioSalvo.usuario || `Jogador_${Math.floor(Math.random() * 100)}`;

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Confirmação de sala privada criada pelo servidor
    socket.on('salaCriada', (dados: { codigo: string }) => {
      setCodigoGerado(dados.codigo);
      setAguardandoAmigo(true);
    });

    // Erros ao tentar entrar (ex: sala não existe ou cheia)
    socket.on('erroSala', (msg: string) => {
      setMensagemErro(msg);
    });

    // Ambos os jogadores recebem quando a sala estiver com os 2 prontos
    socket.on('partidaEncontrada', (dados: {
      salaId: string;
      lado: 'esquerda' | 'direita';
      adversario: string;
      adversarioId: number | string;
    }) => {
      navigate('/game', { 
        state: {
          ...dados,
          tipoPartida: 'Amigo' 
        }
      });
    });

    return () => {
      socket.off('salaCriada');
      socket.off('erroSala');
      socket.off('partidaEncontrada');
    };
  }, [navigate]);

  // Gerador de código de 5 caracteres alfanuméricos
  const gerarCodigo = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCriarSala = () => {
    setMensagemErro('');
    const novoCodigo = gerarCodigo();
    socket.emit('criarSalaAmigo', { codigo: novoCodigo, jogadorId, nome });
  };

  const handleEntrarSala = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro('');
    const codLimpo = codigoEntrada.trim().toUpperCase();

    if (!codLimpo) {
      setMensagemErro('Digite o código da sala!');
      return;
    }

    socket.emit('entrarSalaAmigo', { codigo: codLimpo, jogadorId, nome });
  };

  const handleVoltar = () => {
    socket.disconnect();
    navigate('/modo-jogo');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      color: '#fff',
      padding: '20px'
    }}>
      <h1 style={{
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '2.5rem',
        color: '#a855f7',
        margin: '0 0 10px 0',
        letterSpacing: '2px'
      }}>
        JOGAR COM AMIGO
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '35px' }}>
        Crie uma sala privada ou insira o código de um amigo
      </p>

      {mensagemErro && (
        <div style={{
          backgroundColor: '#ef444422',
          border: '1px solid #ef4444',
          color: '#f87171',
          padding: '10px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          {mensagemErro}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        width: '100%',
        maxWidth: '750px'
      }}>
        {/* OPÇÃO 1: CRIAR SALA */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '30px 25px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.4rem', color: '#38bdf8', margin: '0 0 10px 0' }}>CRIAR UMA SALA</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '25px' }}>
            Gere um código exclusivo e envie para o seu oponente entrar
          </p>

          {!aguardandoAmigo ? (
            <button
              onClick={handleCriarSala}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: '0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
            >
              GERAR CÓDIGO DE SALA
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
              <div style={{
                backgroundColor: '#1e293b',
                border: '2px dashed #38bdf8',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '2rem',
                fontWeight: 'bold',
                letterSpacing: '6px',
                color: '#38bdf8',
                width: '80%'
              }}>
                {codigoGerado}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#4ade80' }}>
                ● Aguardando amigo entrar na sala...
              </span>
            </div>
          )}
        </div>

        {/* OPÇÃO 2: ENTRAR EM SALA EXISTENTE */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '30px 25px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.4rem', color: '#a855f7', margin: '0 0 10px 0' }}>ENTRAR EM UMA SALA</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '25px' }}>
            Digite o código de 5 caracteres que seu amigo gerou
          </p>

          <form onSubmit={handleEntrarSala} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              maxLength={5}
              value={codigoEntrada}
              onChange={(e) => setCodigoEntrada(e.target.value.toUpperCase())}
              placeholder="Ex: X9K2P"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '1.2rem',
                textAlign: 'center',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#9333ea',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: '0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#7e22ce')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#9333ea')}
            >
              CONECTAR À SALA
            </button>
          </form>
        </div>
      </div>

      <button
        onClick={handleVoltar}
        style={{
          marginTop: '40px',
          padding: '10px 25px',
          backgroundColor: 'transparent',
          border: '1px solid #475569',
          color: '#94a3b8',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}
      >
        VOLTAR
      </button>
    </div>
  );
};

export default IniciarComAmigo;