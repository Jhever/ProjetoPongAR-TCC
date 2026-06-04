import React from 'react';
import { useNavigate } from 'react-router-dom';

const Ranking = () => {
  const navigate = useNavigate();

  // Simulação de dados que viriam do banco de dados
  const rankingData = [
    { id: "1234567", pontos: 500, pos: 1, nome: "ANONIMO", desafio: 50, v: 5, d: 0, gf: 50, gs: 20 },
    { id: "1234566", pontos: 400, pos: 2, nome: "FULANO B", desafio: 56, v: 4, d: 2, gf: 56, gs: 35 },
    { id: "1234532", pontos: 400, pos: 3, nome: "FULANO C", desafio: 60, v: 4, d: 3, gf: 60, gs: 50 },
    { id: "1234512", pontos: 360, pos: 10, nome: "FULANO D", desafio: 42, v: 3, d: 3, gf: 42, gs: 45 },
    { id: "1244112", pontos: 60, pos: 50, nome: "FULANO E", desafio: 21, v: 0, d: 3, gf: 21, gs: 30 },
  ];

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
    },
    mainTitle: {
      color: '#87CEEB',
      fontSize: '3.5rem',
      fontFamily: '"Arial Black", sans-serif',
      fontStyle: 'italic',
      margin: 0,
    },
    rankTitle: {
      color: '#ff4d4d', // Cor avermelhada do print
      fontSize: '4.5rem',
      fontFamily: '"Times New Roman", serif',
      margin: 0,
      letterSpacing: '5px',
    },
    tableContainer: {
      width: '95%',
      maxWidth: '1200px',
      marginTop: '20px',
    },
    headerRow: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1.2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
      borderBottom: '1px solid #fff',
      paddingBottom: '10px',
      marginBottom: '15px',
      textAlign: 'center' as const,
      fontSize: '0.85rem',
      fontWeight: 'bold' as const,
    },
    dataRow: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1.2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
      padding: '12px 0',
      textAlign: 'center' as const,
      fontSize: '1rem',
      alignItems: 'center',
    },
    medal: {
      fontSize: '1.2rem',
      marginRight: '5px',
    },
    footer: {
      width: '95%',
      maxWidth: '1200px',
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 'auto',
      padding: '40px 0',
    },
    btnBlue: {
      background: 'linear-gradient(to right, #2563eb, #9333ea)',
      border: 'none',
      color: 'white',
      padding: '12px 25px',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold' as const,
    },
    btnGreen: {
      background: 'linear-gradient(to right, #059669, #a3e635)',
      border: 'none',
      color: 'white',
      padding: '12px 25px',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold' as const,
    }
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
      
      <div>
        <h2 style={styles.rankTitle}>RANKING GLOBAL</h2>
      </div>

      <div style={{ alignSelf: 'flex-start', marginLeft: '5%', marginBottom: '10px' }}>
        DO 1 ATÉ 100
      </div>

      <div style={styles.tableContainer}>
        {/* Cabeçalho */}
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

        {/* Linhas de Dados */}
        {rankingData.map((player, index) => (
          <div key={index} style={styles.dataRow}>
            <span>{player.id}</span>
            <span>{player.pontos}</span>
            <span>{getMedal(player.pos)} {player.pos}</span>
            <span>{player.nome}</span>
            <span>{player.desafio}</span>
            <span>{player.v}</span>
            <span>{player.d}</span>
            <span>{player.gf}</span>
            <span>{player.gs}</span>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <button style={styles.btnBlue}>HISTORICO DE PARTIDAS</button>
        <button style={styles.btnGreen} onClick={() => navigate('/home')}>
          VOLTAR PAGINA INICIAL
        </button>
      </div>
    </div>
  );
};

export default Ranking;