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
}

const Ranking = () => {
  const navigate = useNavigate();
  const { userData, isAnonimo: isAnonimoContext } = useConfig();

  const [showHistorico, setShowHistorico] = useState(false);
  const [rankingData, setRankingData] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/ranking')
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
  }, []);

  const getHistorico = () => {
    const data = localStorage.getItem('pong_historico');
    return data ? JSON.parse(data) : [];
  };

  const styles = {
    screen: {
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", sans-serif',
      boxSizing: 'border-box' as const,
    },
    mainTitle: { color: '#87CEEB', fontSize: '3.5rem', fontFamily: '"Arial Black", sans-serif', fontStyle: 'italic', margin: 0 },
    rankTitle: { color: '#ff4d4d', fontSize: '4.5rem', fontFamily: '"Times New Roman", serif', margin: 0, letterSpacing: '5px' },
    tableContainer: { width: '95%', maxWidth: '1200px', marginTop: '20px' },
    headerRow: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid #fff', paddingBottom: '10px', marginBottom: '15px', textAlign: 'center' as const, fontSize: '0.85rem', fontWeight: 'bold' as const },
    dataRow: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 0', textAlign: 'center' as const, fontSize: '1rem', alignItems: 'center' },
    footer: { width: '95%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', marginTop: 'auto', padding: '40px 0' },
    btnBlue: { background: 'linear-gradient(to right, #2563eb, #9333ea)', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' as const },
    btnGreen: { background: 'linear-gradient(to right, #059669, #a3e635)', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' as const },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '20px', width: '80%', maxWidth: '600px', border: '2px solid #2563eb', position: 'relative' as const }
  };

  const getMedal = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return "";
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.mainTitle}>PONG COM AR</h1>
      <div><h2 style={styles.rankTitle}>RANKING GLOBAL</h2></div>
      <div style={{ alignSelf: 'flex-start', marginLeft: '5%', marginBottom: '10px' }}>DO 1° AO 10°</div>

      <div style={styles.tableContainer}>
        <div style={styles.headerRow}>
          <span>ID USUARIO</span>
          <span>PONTOS</span>
          <span>POSIÇÃO</span>
          <span>NOME</span>
          <span>PONTOS DESAFIO</span>
          <span>VITORIA</span>
          <span>DERROTA</span>
          <span>GOLS FEITO</span>
          <span>GOLS SOFRIDO</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#87CEEB', fontSize: '1.2rem' }}>
            Carregando ranking do banco de dados...
          </div>
        ) : rankingData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Nenhum jogador pontuado ainda.
          </div>
        ) : (
          rankingData.map((player) => {
            // Verifica se este registro é o do usuário atual logado
            const isCurrentUser = userData && String(userData.id) === String(player.id_usuario);
            
            // É anônimo se o contexto disser que é (para o logado) ou se o banco trouxer a flag
            const jogadorAnonimo = (isCurrentUser && isAnonimoContext) || player.is_anonimo || player.nome === 'ANÔNIMO';
            
            // Exibe 'ANÔNIMO' se estiver ativado, senão o nome normal
            const nomeExibido = jogadorAnonimo ? 'ANÔNIMO' : player.nome;

            return (
              <div key={player.id_usuario} style={styles.dataRow}>
                {/* ID SEMPRE com zeros à esquerda: 00000001 */}
                <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {String(player.id_usuario).padStart(8, '0')}
                </span>
                <span>{player.pontos}</span>
                <span>{getMedal(player.posicao)} {player.posicao}°</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: jogadorAnonimo ? '#94a3b8' : (player.posicao <= 3 ? '#a3e635' : '#fff') 
                }}>
                  {nomeExibido}
                </span>
                <span>{player.desafio ?? player.pontos_desafio ?? 0}</span>
                <span style={{ color: '#4ade80' }}>{player.vitoria}</span>
                <span style={{ color: '#f87171' }}>{player.derrota}</span>
                <span>{player.gols_feito ?? player.gols_feitos ?? 0}</span>
                <span>{player.gols_sofrido ?? player.gols_sofridos ?? 0}</span>
              </div>
            );
          })
        )}
      </div>

      <div style={styles.footer}>
        <button style={styles.btnBlue} onClick={() => setShowHistorico(true)}>HISTORICO DE PARTIDAS</button>
        <button style={styles.btnGreen} onClick={() => navigate('/home')}>VOLTAR PAGINA INICIAL</button>
      </div>

      {showHistorico && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={() => setShowHistorico(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'red', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', padding: '4px 8px' }}>X</button>
            <h2 style={{ textAlign: 'center', color: '#87CEEB' }}>HISTÓRICO RECENTE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
              <span>DATA</span><span>RESULTADO</span><span>PLACAR</span>
            </div>
            {getHistorico().length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Nenhuma partida recente gravada neste navegador.</p>
            ) : (
              getHistorico().map((p: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #333' }}>
                  <span>{p.data}</span>
                  <span style={{ color: p.resultado?.toUpperCase().includes('VIT') ? '#a3e635' : '#ff4d4d' }}>{p.resultado}</span>
                  <span>{p.placar}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;