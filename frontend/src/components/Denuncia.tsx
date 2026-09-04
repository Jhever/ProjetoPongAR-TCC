import React, { useState } from 'react';
import { auditoriaGlobal, MotivoDenuncia, ResultadoAuditoria } from '../services/Denuncia';

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

      await fetch('http://localhost:3001/api/denuncias', {
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      fontFamily: '"Segoe UI", sans-serif'
    },
    modal: {
      background: '#0f172a',
      border: '2px solid #ef4444',
      borderRadius: '12px',
      padding: '25px',
      width: '90%',
      maxWidth: '520px',
      color: '#f8fafc',
      boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
    },
    title: {
      fontSize: '1.4rem',
      fontWeight: 'bold' as const,
      color: '#f87171',
      marginBottom: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    select: {
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      background: '#1e293b',
      border: '1px solid #475569',
      color: '#fff',
      fontSize: '0.95rem',
      marginTop: '10px',
      marginBottom: '20px'
    },
    resultBox: {
      padding: '12px',
      borderRadius: '6px',
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      marginBottom: '15px',
      fontSize: '0.85rem'
    },
    btnSubmit: {
      background: '#ef4444',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      width: '100%'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.title}>
          <span>DENUNCIAR COMPORTAMENTO</span>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0 0 15px 0' }}>
          Jogador denunciado: <strong style={{ color: '#38bdf8' }}>{denunciadoNome}</strong>
        </p>

        {!resultado ? (
          <>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>SELECIONE O TIPO DE INFRAÇÃO:</label>
            <select 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value as MotivoDenuncia)} 
              style={styles.select}
              disabled={analisando}
            >
              <option value="GESTO_OBSCENO">Gesto Obsceno / Dedo do Meio (Visão AR)</option>
              <option value="CONTEUDO_IMPROPRIO">Exposição Imprópria / Nudez na Câmera</option>
              <option value="TEXTO_OFENSIVO">Mensagens Escritas / Papel Exibido</option>
              <option value="ANTI_JOGO_AFK">Conduta Antidesportiva / Inatividade Proposital</option>
              <option value="TRAPACA_MOVIMENTO">Movimentação Anômala / Uso de Scripts</option>
            </select>

            <button 
              onClick={handleSubmit} 
              disabled={analisando}
              style={{ ...styles.btnSubmit, opacity: analisando ? 0.7 : 1 }}
            >
              {analisando ? 'A IA ESTÁ REVISANDO O REPLAY...' : 'ENVIAR DENÚNCIA PARA A IA'}
            </button>
          </>
        ) : (
          <div>
            <div style={{
              ...styles.resultBox,
              borderColor: resultado.procedente ? '#ef4444' : '#22c55e'
            }}>
              <div style={{ fontWeight: 'bold', color: resultado.procedente ? '#f87171' : '#4ade80', marginBottom: '5px' }}>
                VEREDITO DA IA: {resultado.procedente ? 'INFRAÇÃO DETECTADA' : 'INFRAÇÃO NÃO CONFIRMADA'}
              </div>
              <p style={{ margin: '4px 0' }}>{resultado.detalhes}</p>
              <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                Grau de Confiança: <strong>{(resultado.confianca * 100).toFixed(0)}%</strong>
              </p>
            </div>

            <button 
              onClick={onClose} 
              style={{ ...styles.btnSubmit, background: '#334155' }}
            >
              FECHAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Denuncia;