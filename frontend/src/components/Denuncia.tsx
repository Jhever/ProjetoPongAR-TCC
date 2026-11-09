import React, { useState } from 'react';
import { auditoriaGlobal, MotivoDenuncia, ResultadoAuditoria } from '../services/Denuncia';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

interface DenunciaProps {
  partidaId?: number | string;
  denunciadoNome: string;
  denunciadoId?: number | string;
  onClose: () => void;
}

const Denuncia: React.FC<DenunciaProps> = ({ partidaId, denunciadoNome, denunciadoId, onClose }) => {
  const [motivo, setMotivo] = useState<MotivoDenuncia>('GESTO_OBSCENO');
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuditoria | null>(null);

  const handleSubmit = async () => {
    setAnalisando(true);

    // 1. Executa a varredura da IA sobre os dados gravados da partida
    const analise = await auditoriaGlobal.analisarIncidente(motivo);
    setResultado(analise);
    setAnalisando(false);

    // 2. Persiste o incidente e o veredito da IA no backend
    try {
      const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');

      await fetch(`${API_URL}/denuncias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partida_id: partidaId || null,
          denunciante_id: usuarioLogado?.id || null,
          denunciado_id: denunciadoId || null,
          denunciado_nome: denunciadoNome,
          motivo,
          status_ia: analise.procedente ? 'PROCEDENTE' : 'IMPROCEDENTE',
          confianca_ia: (analise.confianca * 100).toFixed(1),
          detalhes: analise.detalhes
        })
      });
    } catch (err) {
      console.error("Falha ao salvar denúncia no banco:", err);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box' as const,
    },
    modal: {
      backgroundColor: '#0a0a0a',
      padding: '30px',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '500px',
      border: '1px solid #1a1a1a',
      boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255, 68, 68, 0.15)',
      display: 'flex',
      flexDirection: 'column' as const,
      boxSizing: 'border-box' as const,
    },
    title: {
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.4rem',
      fontWeight: 'bold' as const,
      margin: '0 0 15px 0',
      letterSpacing: '2px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 68, 68, 0.2)',
      paddingBottom: '15px',
      textShadow: '0 0 10px rgba(255, 68, 68, 0.5)',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#aaaaaa',
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: 0,
      lineHeight: 1,
      transition: 'color 0.2s',
    },
    infoText: {
      color: '#94a3b8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.95rem',
      lineHeight: '1.5',
      margin: '0 0 20px 0',
    },
    highlightedName: {
      color: '#87CEEB',
      fontWeight: 'bold',
      textShadow: '0 0 8px rgba(135, 206, 235, 0.4)',
    },
    label: {
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      letterSpacing: '1px',
      marginBottom: '8px',
      display: 'block',
    },
    select: {
      width: '100%',
      height: '45px',
      backgroundColor: '#111111',
      border: '1px solid #333333',
      borderRadius: '6px',
      padding: '0 15px',
      color: '#ffffff',
      fontSize: '0.95rem',
      fontFamily: 'Arial, sans-serif',
      marginBottom: '20px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    btnSubmit: {
      width: '100%',
      height: '50px',
      backgroundColor: '#ff4444',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.05rem',
      fontWeight: '900',
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase' as const,
      boxShadow: '0 0 15px rgba(255, 68, 68, 0.3)',
    },
    resultBox: {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#111111',
      border: '1px solid #333333',
      marginBottom: '20px',
      fontSize: '0.95rem',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.5',
      boxSizing: 'border-box' as const,
    },
    btnFechar: {
      width: '100%',
      height: '50px',
      backgroundColor: '#333333',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.05rem',
      fontWeight: '900',
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textTransform: 'uppercase' as const,
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.title}>
          <span>🚨 AUDITORIA</span>
          <button 
            onClick={onClose} 
            style={styles.closeButton}
            onMouseOver={(e) => e.currentTarget.style.color = '#ff4444'}
            onMouseOut={(e) => e.currentTarget.style.color = '#aaaaaa'}
          >
            ✕
          </button>
        </div>

        <p style={styles.infoText}>
          Jogador denunciado: <strong style={styles.highlightedName}>{denunciadoNome}</strong>
        </p>

        {!resultado ? (
          <>
            <div>
              <label style={styles.label}>SELECIONE A INFRAÇÃO</label>
              <select 
                value={motivo} 
                onChange={(e) => setMotivo(e.target.value as MotivoDenuncia)} 
                style={styles.select}
                disabled={analisando}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff4444';
                  e.target.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333333';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="GESTO_OBSCENO">Gesto Obsceno / Dedo do Meio (Visão AR)</option>
                <option value="CONTEUDO_IMPROPRIO">Exposição Imprópria / Nudez na Câmera</option>
                <option value="TEXTO_OFENSIVO">Mensagens Escritas / Papel Exibido</option>
                <option value="ANTI_JOGO_AFK">Conduta Antidesportiva / Inatividade Proposital</option>
                <option value="TRAPACA_MOVIMENTO">Movimentação Anômala / Uso de Scripts</option>
              </select>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={analisando}
              style={{ 
                ...styles.btnSubmit, 
                opacity: analisando ? 0.6 : 1,
                cursor: analisando ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => {
                if (!analisando) {
                  e.currentTarget.style.backgroundColor = '#ff6b6b';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 68, 68, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!analisando) {
                  e.currentTarget.style.backgroundColor = '#ff4444';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.3)';
                }
              }}
            >
              {analisando ? 'A IA ESTÁ REVISANDO O REPLAY...' : 'SOLICITAR AUDITORIA IA'}
            </button>
          </>
        ) : (
          <div>
            <div style={{
              ...styles.resultBox,
              borderColor: resultado.procedente ? '#ff4444' : '#4ade80',
              boxShadow: resultado.procedente ? '0 0 15px rgba(255, 68, 68, 0.1)' : '0 0 15px rgba(74, 222, 128, 0.1)'
            }}>
              <div style={{ 
                fontWeight: '900', 
                color: resultado.procedente ? '#ff4444' : '#4ade80', 
                marginBottom: '10px',
                letterSpacing: '1px'
              }}>
                VEREDITO DA IA: {resultado.procedente ? 'INFRAÇÃO DETECTADA' : 'INFRAÇÃO NÃO CONFIRMADA'}
              </div>
              <p style={{ margin: '0 0 10px 0', color: '#e2e8f0' }}>{resultado.detalhes}</p>
              <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Grau de Confiança Algorítmica: <strong style={{ color: '#ffffff' }}>{(resultado.confianca * 100).toFixed(0)}%</strong>
              </p>
            </div>

            <button 
              onClick={onClose} 
              style={styles.btnFechar}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#475569'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333333'}
            >
              FECHAR RELATÓRIO
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Denuncia;