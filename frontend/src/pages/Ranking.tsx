import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

interface PlayerRank {
  id_usuario: number | string;
  pontos: number;
  posicao: number;
  nome: string;
  is_anonimo?: boolean;
  desafio?: number;
  pontos_desafio?: number;
  vitoria: number;
  derrota: number;
  gols_feito?: number;
  gols_feitos?: number;
  gols_sofrido?: number;
  gols_sofridos?: number;
  foto?: string; // Suporte para a foto do perfil
}

const Ranking = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo: isAnonimoContext } = useConfig();

  const [showHistorico, setShowHistorico] = useState(false);
  const [rankingData, setRankingData] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://projetopongar-tcc.onrender.com';
  
  useEffect(() => {
    fetch(`${API_URL}/api/ranking`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar dados');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRankingData(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar ranking real:', err);
        setLoading(false);
      });
  }, [API_URL]);

  const getHistorico = () => {
    const data = localStorage.getItem('pong_historico');
    return data ? JSON.parse(data) : [];
  };

  const getMedal = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return `#${pos}`;
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #1a0b2e 0%, #090612 100%)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 20px 40px 20px',
      fontFamily: "'Courier New', monospace, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* 📌 CABEÇALHO FIXO (STICKY HEADER) COM BOTÕES DE NAVEGAÇÃO INTEGRADOS */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        maxWidth: '1100px',
        backgroundColor: 'rgba(9, 6, 18, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        boxSizing: 'border-box',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        {/* Botão Histórico à Esquerda */}
        <button 
          onClick={() => setShowHistorico(true)} 
          style={{
            background: 'linear-gradient(135deg, #2563eb, #9333ea)',
            border: 'none',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          HISTÓRICO
        </button>

        {/* Títulos Centralizados */}
        <div style={{ textAlign: 'center', flex: 1, minWidth: '220px' }}>
          <h1 style={{ 
            fontSize: '0.9rem', 
            letterSpacing: '3px', 
            color: '#38bdf8', 
            margin: '0 0 2px 0',
            textTransform: 'uppercase'
          }}>
            PONG COM AR
          </h1>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900', 
            letterSpacing: '2px',
            background: 'linear-gradient(135deg, #ef4444, #f87171, #fca5a5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            textShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
          }}>
            RANKING GLOBAL
          </h2>
        </div>

        {/* Botão Voltar à Direita */}
        <button 
          onClick={() => navigate('/home')} 
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            border: 'none',
            color: 'white',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          VOLTAR AO MENU
        </button>
      </div>

      {/* SUBTÍTULO DA TABELA */}
      <div style={{ width: '100%', maxWidth: '1100px', marginBottom: '10px', paddingLeft: '5px' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '1px' }}>
          DO 1° AO 10° COLOCADO
        </span>
      </div>

      {/* TABELA COM ROLAGEM HORIZONTAL SEGURA */}
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        overflowX: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ minWidth: '850px' }}>
          {/* HEADER DA TABELA */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '100px 90px 90px 1.5fr 110px 90px 90px 100px 100px', 
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)', 
            paddingBottom: '12px', 
            marginBottom: '10px', 
            textAlign: 'center', 
            fontSize: '0.8rem', 
            fontWeight: 'bold', 
            color: '#94a3b8',
            letterSpacing: '1px'
          }}>
            <span>ID USUÁRIO</span>
            <span>PONTOS</span>
            <span>POSIÇÃO</span>
            <span style={{ textAlign: 'left', paddingLeft: '15px' }}>NOME</span>
            <span>DESAFIO</span>
            <span style={{ color: '#4ade80' }}>VITÓRIA</span>
            <span style={{ color: '#f87171' }}>DERROTA</span>
            <span>GOLS FEITO</span>
            <span>GOLS SOFR.</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#38bdf8', fontSize: '1rem', letterSpacing: '1px' }}>
              Carregando ranking do banco de dados...
            </div>
          ) : rankingData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '1rem' }}>
              Nenhum jogador pontuado ainda.
            </div>
          ) : (
            rankingData.map((player) => {
              const isCurrentUser = userData && String(userData.id) === String(player.id_usuario);
              const jogadorAnonimo = (isCurrentUser && isAnonimoContext) || player.is_anonimo || player.nome === 'ANÔNIMO';
              const nomeExibido = jogadorAnonimo ? 'ANÔNIMO' : player.nome;
              const isPodium = player.posicao <= 3;
              
              const fotoJogador = isCurrentUser ? (userData as any)?.foto : player.foto;

              return (
                <div key={player.id_usuario} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 90px 90px 1.5fr 110px 90px 90px 100px 100px', 
                  padding: '14px 0', 
                  textAlign: 'center', 
                  fontSize: '0.95rem', 
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  backgroundColor: isCurrentUser ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
                    #{String(player.id_usuario).padStart(6, '0')}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#facc15' }}>{player.pontos}</span>
                  <span style={{ fontWeight: 'bold' }}>{getMedal(player.posicao)}</span>
                  
                  {/* COLUNA DO NOME COM AVATAR / FOTO CORRIGIDO */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    textAlign: 'left', 
                    paddingLeft: '15px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#1a1f2c',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '1rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {!jogadorAnonimo && fotoJogador ? (
                        fotoJogador.startsWith('data:image') || fotoJogador.startsWith('http') ? (
                          <img src={fotoJogador} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{fotoJogador}</span>
                        )
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: jogadorAnonimo ? '#94a3b8' : (isPodium ? '#a3e635' : '#fff'),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {nomeExibido}
                    </span>
                  </div>

                  <span style={{ color: '#c084fc' }}>{player.desafio ?? player.pontos_desafio ?? 0}</span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{player.vitoria}</span>
                  <span style={{ color: '#f87171', fontWeight: 'bold' }}>{player.derrota}</span>
                  <span>{player.gols_feito ?? player.gols_feitos ?? 0}</span>
                  <span>{player.gols_sofrido ?? player.gols_sofridos ?? 0}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE HISTÓRICO */}
      {showHistorico && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            padding: '30px',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '550px',
            border: '1px solid rgba(37, 99, 235, 0.4)',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
            boxSizing: 'border-box'
          }}>
            <button 
              onClick={() => setShowHistorico(false)} 
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: '#ef4444',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
            <h2 style={{ textAlign: 'center', color: '#38bdf8', marginTop: 0, letterSpacing: '1px' }}>
              HISTÓRICO RECENTE
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1.2fr', 
              textAlign: 'center', 
              marginTop: '20px', 
              borderBottom: '1px solid #334155', 
              paddingBottom: '10px',
              fontSize: '0.85rem',
              color: '#94a3b8',
              fontWeight: 'bold'
            }}>
              <span>DATA</span>
              <span>RESULTADO</span>
              <span>PLACAR</span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
              {getHistorico().length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', marginTop: '30px' }}>
                  Nenhuma partida recente gravada neste navegador.
                </p>
              ) : (
                getHistorico().map((p: any, i: number) => (
                  <div key={i} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1.2fr', 
                    textAlign: 'center', 
                    padding: '12px 0', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.9rem',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#94a3b8' }}>{p.data}</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: p.resultado?.toUpperCase().includes('VIT') ? '#4ade80' : '#f87171' 
                    }}>
                      {p.resultado}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>{p.placar}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;