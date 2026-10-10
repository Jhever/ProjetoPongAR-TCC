import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

// Define os itens do menu com ícones e rotas para garantir tipagem e organização
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string; // Usaremos emojis ou você pode substituir por componentes de ícones (ex: Lucide, FontAwesome)
  route: string;
  color: string; // Cor de destaque do neon
}

const menuItems: MenuItem[] = [
  {
    id: 'multiplayer',
    title: 'JOGAR MULTIPLAYER',
    description: 'Encontre oponentes online ou via AR',
    icon: '🌐',
    route: '/modo-jogo',
    color: '#38bdf8', // Ciano Neon
  },
  {
    id: 'treino',
    title: 'PARTIDA TREINO',
    description: 'Aprimore suas habilidades contra a IA',
    icon: '🤖',
    route: '/game-treino',
    color: '#c084fc', // Roxo Neon
  },
  {
    id: 'camera',
    title: 'TESTAR CÂMERA (AR)',
    description: 'Calibre o rastreamento de movimento MediaPipe',
    icon: '📷',
    route: '/testar-camera',
    color: '#f43f5e', // Rosa Neon
  },
  {
    id: 'ranking',
    title: 'RANKING GLOBAL',
    description: 'Veja sua posição na tabela de líderes',
    icon: '🏆',
    route: '/ranking',
    color: '#facc15', // Amarelo Neon
  },
  {
    id: 'config',
    title: 'CONFIGURAÇÃO',
    description: 'Gerencie seu perfil, senha e preferências',
    icon: '⚙️',
    route: '/configuracao',
    color: '#94a3b8', // Cinza Neutro
  },
  {
    id: 'info',
    title: 'INFORMAÇÕES',
    description: 'Regras do jogo e detalhes do projeto',
    icon: '📖',
    route: '/informacoes',
    color: '#38bdf8', // Ciano Neon
  },
  {
    id: 'suporte',
    title: 'SUPORTE E AJUDA',
    description: 'Relate problemas ou entre em contato',
    icon: '💬',
    route: '/suporte',
    color: '#34d399', // Verde Neon
  },
  {
    id: 'desafios',
    title: 'DESAFIOS',
    description: 'Missões diárias e conquistas',
    icon: '🎯',
    route: '/desafios',
    color: '#e879f9', // Magenta Neon
  },
  {
    id: 'sair',
    title: 'SAIR DO JOGO',
    description: 'Encerrar sessão atual',
    icon: '🚪',
    route: '/',
    color: '#ef4444', // Vermelho Neon
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo, isDark } = useConfig();

  // Recupera a foto do perfil (suporta tanto avatar pré-definido quanto Base64)
  const avatarFoto = (userData as any)?.foto || '👤';
  const nomeExibido = isAnonimo ? 'ANÔNIMO' : (userData?.usuario || 'Jogador');

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      // Fundo com gradiente radial profundo, simulando uma sala de controle futurista
      background: isDark ? 'radial-gradient(circle at 50% 10%, #1a0b2e 0%, #090612 100%)' : 'radial-gradient(circle at 50% 10%, #f3e8ff 0%, #f8fafc 100%)',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontFamily: "'Courier New', monospace, sans-serif", // Fonte estilo terminal/arcade
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* PAINEL DO CABEÇALHO (PERFIL E STATUS) - Vidro Fumê Moderno */}
      <header style={{
        width: '100%',
        maxWidth: '1100px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '24px',
        padding: '20px 30px',
        marginBottom: '40px',
        boxShadow: isDark ? '0 10px 40px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box',
        transition: 'background 0.3s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Círculo do Avatar */}
          <div style={{
            width: '70px', height: '70px',
            borderRadius: '50%',
            background: isDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.05)',
            border: '2px solid #9333ea',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '2rem', overflow: 'hidden'
          }}>
             {avatarFoto.startsWith('data:image') ? (
              <img src={avatarFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avatarFoto
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', letterSpacing: '1px' }}>BEM-VINDO,</div>
            <h1 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '900', 
                margin: '2px 0', 
                color: isDark ? '#fff' : '#0f172a',
                letterSpacing: '0.5px' 
            }}>
                {nomeExibido}
            </h1>
          </div>
        </div>

        {/* Botão de Status / Modo Anônimo */}
        <div style={{
            display: 'flex', alignItems: 'center', gap: '15px'
        }}>
            {isAnonimo && (
                <span style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                }}>
                    👁️ MODO ANÔNIMO ATIVO
                </span>
            )}
            <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: '#38bdf8',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase'
            }}>
              ⚡ Status: Online
            </div>
        </div>
      </header>

      {/* TÍTULO PRINCIPAL DO JOGO (Com Efeito Gradiente) */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '900',
          letterSpacing: '5px',
          background: 'linear-gradient(135deg, #38bdf8, #9333ea, #e879f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          textShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
        }}>
          PONG COM AR
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          marginTop: '10px',
          letterSpacing: '3px',
          fontWeight: 'light'
        }}>
          CENTRAL DE CONTROLE DE MISSÕES
        </p>
      </div>

      {/* GRID DE NAVEGAÇÃO (Cards Interativos) */}
      <main style={{
        display: 'grid',
        // Responsivo: adapta de 1 a 3 colunas dependendo da tela
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '25px',
        width: '100%',
        maxWidth: '1100px',
        padding: '10px'
      }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            style={{
              // Card Estilo Glassmorphism
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
              borderRadius: '20px',
              padding: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '25px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.05)',
              // Impede que o texto quebre de forma estranha
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            // Efeito Hover no Mouse (Animação de elevação e borda neon)
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.boxShadow = `0 15px 50px ${item.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.boxShadow = isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Ícone do Card (Emoticon Grande) */}
            <div style={{
                fontSize: '3rem',
                background: `${item.color}15`,
                width: '70px',
                height: '70px',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                border: `1px solid ${item.color}40`,
            }}>
                {item.icon}
            </div>

            {/* Título e Descrição */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '800',
                color: isDark ? '#fff' : '#0f172a',
                letterSpacing: '1px'
              }}>
                {item.title}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#94a3b8',
                lineHeight: '1.5',
                fontWeight: '400'
              }}>
                {item.description}
              </p>
            </div>

            {/* Seta de Navegação Sutil à Direita */}
            <div style={{
                marginLeft: 'auto',
                fontSize: '1.5rem',
                color: item.color,
                opacity: 0,
                transition: 'opacity 0.3s',
                }}
                // Mostra a seta apenas no hover
                className="nav-arrow"
            >
                →
            </div>
              
              {/* Adiciona a classe css necessária para o hover da seta funcionar via JS inline */}
              <style>{`
                  button:hover .nav-arrow { opacity: 1 !important; }
              `}</style>
          </button>
        ))}
      </main>

      {/* RODAPÉ / VERSÃO */}
      <footer style={{
          marginTop: '60px',
          marginBottom: '20px',
          fontSize: '0.8rem',
          color: '#475569',
          letterSpacing: '1px'
      }}>
          PONG COM AR v1.0 | SISTEMA OPERACIONAL PONG-OS
      </footer>
    </div>
  );
};

export default Home;