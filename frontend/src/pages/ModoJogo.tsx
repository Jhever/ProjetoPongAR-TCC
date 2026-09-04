import React from 'react';
import { useNavigate } from 'react-router-dom';

const ModoJogo = () => {
  const navigate = useNavigate();

  const botoes = [
    {
      titulo: 'JOGAR PRESENCIAL',
      sub: '2 jogadores lado a lado na mesma câmera',
      rota: '/game-local',
      cor: '#22c55e'
    },
    {
      titulo: 'JOGAR ONLINE',
      sub: 'Patida Online com jogadores aleatórios',
      rota: '/procurar-partida',
      cor: '#3b82f6'
    },
    {
      titulo: 'JOGAR COM AMIGO',
      sub: 'Criar ou entrar em sala privada via código',
      rota: '/iniciar-com-amigo',
      cor: '#a855f7'
    }
  ];

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
        fontSize: '3rem',
        color: '#87CEEB',
        margin: '0 0 10px 0',
        letterSpacing: '2px'
      }}>
        PONG AR
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px' }}>
        Selecione a modalidade da partida
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '420px' }}>
        {botoes.map((b, idx) => (
          <button
            key={idx}
            onClick={() => navigate(b.rota)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '18px 24px',
              backgroundColor: '#0f172a',
              border: `2px solid ${b.cor}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.15s, background 0.15s',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.backgroundColor = '#1e293b';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#0f172a';
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: b.cor }}>{b.titulo}</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>{b.sub}</span>
          </button>
        ))}

        <button
          onClick={() => navigate('/home')}
          style={{
            marginTop: '10px',
            padding: '12px',
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            color: '#94a3b8',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          VOLTAR AO MENU
        </button>
      </div>
    </div>
  );
};

export default ModoJogo;