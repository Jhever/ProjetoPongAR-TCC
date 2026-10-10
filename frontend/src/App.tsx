import React from 'react';
import { useNavigate } from 'react-router-dom';
import {useConfig} from './context/ConfigContext';
// import { useConfig } from '../context/ConfigContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo, isDark } = useConfig();

  const avatarAtual = (userData as any)?.foto || '👤';
  const nomeExibido = isAnonimo ? 'ANÔNIMO' : (userData?.usuario || 'Jogador');

  // Lista dos módulos de navegação com ícones e descrições para enriquecer o visual
  const menuCards = [
    { titulo: 'JOGAR MULTIPLAYER', desc: 'Partidas online com IA e AR', rota: '/modo-jogo', icone: '🥽', cor: '#38bdf8' },
    { titulo: 'PARTIDA TREINO', desc: 'Pratique contra a máquina', rota: '/game-treino', icone: '🤖', cor: '#c084fc' },
    { titulo: 'TESTAR CÂMERA (AR)', desc: 'Calibrar rastreamento MediaPipe', rota: '/testar-camera', icone: '📷', cor: '#f43f5e' },
    { titulo: 'RANKING GLOBAL', desc: 'Veja os melhores colocados', rota: '/ranking', icone: '🏆', cor: '#facc15' },
    { titulo: 'CONFIGURAÇÃO', desc: 'Perfil, senha e preferências', rota: '/configuracao', icone: '⚙️', cor: '#94a3b8' },
    { titulo: 'INFORMAÇÕES', desc: 'Regras e manual do jogo', rota: '/informacoes', icone: '📖', cor: '#38bdf8' },
    { titulo: 'SUPORTE E AJUDA', desc: 'Relate problemas ou dúvidas', rota: '/suporte', icone: '💬', cor: '#34d399' },
    { titulo: 'DESAFIOS', desc: 'Missões diárias e recompensas', rota: '/desafios', icone: '🎯', cor: '#e879f9' },
    { titulo: 'SAIR DO JOGO', desc: 'Encerrar sessão atual', rota: '/', icone: '🚪', cor: '#ef4444' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'radial-gradient(circle at 50% 10%, #1a0b2e 0%, #090612 100%)' : 'radial-gradient(circle at 50% 10%, #f3e8ff 0%, #f8fafc 100%)',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontFamily: "'Courier New', monospace, sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      {/* HEADER DE BOAS-VINDAS / PERFIL */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
        backdropFilter: 'blur(12px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '20px',
        padding: '20px 30px',
        marginBottom: '40px',
        boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(147, 51, 234, 0.15)', border: '2px solid #9333ea',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '1.6rem', overflow: 'hidden'
          }}>
            {avatarAtual.startsWith('data:image') ? (
              <img src={avatarAtual} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avatarAtual
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '1px' }}>SEJAM BEM-VINDO,</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' }}>
              {nomeExibido}
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          color: '#38bdf8',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          ⚡ STATUS: ONLINE
        </div>
      </div>

      {/* TÍTULO PRINCIPAL DO JOGO */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '900',
          letterSpacing: '4px',
          background: 'linear-gradient(135deg, #38bdf8, #9333ea, #e879f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          textShadow: '0 0 40px rgba(147, 51, 234, 0.4)'
        }}>
          PONG COM AR
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '8px', letterSpacing: '2px', fontSize: '0.95rem' }}>
          JOGUE ATRAVÉS DE VISÃO COMPUTACIONAL E REALIDADE AUMENTADA
        </p>
      </div>

      {/* GRID DE CARDS DE NAVEGAÇÃO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '1000px'
      }}>
        {menuCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.rota)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = card.cor;
              e.currentTarget.style.boxShadow = `0 12px 40px ${card.cor}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.boxShadow = isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.04)';
            }}
          >
            <div style={{
              fontSize: '2.2rem',
              background: `${card.cor}15`,
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
              border: `1px solid ${card.cor}44`
            }}>
              {card.icone}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 'bold',
                color: isDark ? '#f8fafc' : '#0f172a',
                letterSpacing: '0.5px'
              }}>
                {card.titulo}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#94a3b8',
                lineHeight: '1.3'
              }}>
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;