import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://projetopongar-tcc.onrender.com';

interface Desafio {
  id: number;
  titulo: string;
  descricao: string;
  objetivo: number;
  pontos_recompensa: number; 
  status: 'pendente' | 'concluido' | 'finalizado';
  progresso_atual: number;
}

const Desafios: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isDark } = useConfig();
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [pulosFeitos, setPulosFeitos] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [recolhendoTudo, setRecolhendoTudo] = useState<boolean>(false);

  const fetchDesafios = useCallback(async () => {
    if (!userData?.id) return;
    try {
      setLoading(true);
      const [desafiosRes, countRes] = await Promise.all([
        fetch(`${API_URL}/api/desafios/${userData.id}`),
        fetch(`${API_URL}/api/desafios/contagem-pulos/${userData.id}`)
      ]);
      
      if (!desafiosRes.ok || !countRes.ok) throw new Error("Erro nas requisições");

      const data = await desafiosRes.json();
      const countData = await countRes.json();
      
      setDesafios(Array.isArray(data) ? data : []);
      setPulosFeitos(countData.total || 0);
    } catch (err) { 
      console.error("Erro no fetch do frontend:", err); 
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => { 
    if (userData?.id) fetchDesafios(); 
  }, [fetchDesafios, userData]);

  const handleAction = async (id: number, action: 'pular' | 'recolher') => {
    try {
      const res = await fetch(`${API_URL}/api/desafios/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogador_id: userData?.id, desafio_id: id })
      });
      if (res.ok) {
        await fetchDesafios();
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao realizar ação");
      }
    } catch (error) {
      console.error("Erro na ação:", error);
    }
  };

  // 🌟 NOVA FUNÇÃO: Recolher todas as recompensas concluídas de uma vez só
  const handleRecolherTodas = async () => {
    const concluidos = desafios.filter(d => d.status === 'concluido');
    if (concluidos.length === 0) return;

    try {
      setRecolhendoTudo(true);
      for (const desafio of concluidos) {
        await fetch(`${API_URL}/api/desafios/recolher`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jogador_id: userData?.id, desafio_id: desafio.id })
        });
      }
      await fetchDesafios();
    } catch (error) {
      console.error("Erro ao recolher todas as recompensas:", error);
      alert("Erro ao processar recompensas em lote.");
    } finally {
      setRecolhendoTudo(false);
    }
  };

  const temConcluidosParaRecolher = desafios.some(d => d.status === 'concluido');
  const limiteMaximo = 3;
  const limiteAtingido = pulosFeitos >= limiteMaximo;

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'radial-gradient(circle at 50% 20%, #1a0b2e 0%, #090612 100%)' : 'radial-gradient(circle at 50% 20%, #f3e8ff 0%, #f8fafc 100%)',
      color: isDark ? '#f8fafc' : '#1e293b',
      fontFamily: "'Courier New', monospace, sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      {/* HEADER PREMIUM */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          letterSpacing: '3px',
          background: 'linear-gradient(135deg, #c084fc, #9333ea, #e879f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          textShadow: '0 0 30px rgba(147, 51, 234, 0.3)'
        }}>
          DESAFIOS DIÁRIOS
        </h1>
        <div style={{
          display: 'inline-block',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(147, 51, 234, 0.08)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          padding: '8px 20px',
          borderRadius: '25px',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)'
        }}>
          ⚡ Pulos Realizados: <span style={{ color: '#c084fc' }}>{pulosFeitos}</span> / {limiteMaximo}
        </div>
      </div>

      {/* BOTÃO MESTRE: RECOLHER TODAS */}
      {temConcluidosParaRecolher && (
        <button
          onClick={handleRecolherTodas}
          disabled={recolhendoTudo}
          style={{
            marginBottom: '25px',
            background: 'linear-gradient(135deg, #facc15, #eab308)',
            color: '#000',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: recolhendoTudo ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => !recolhendoTudo && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🎁 {recolhendoTudo ? 'PROCESSANDO...' : 'RECOLHER TODAS AS RECOMPENSAS'}
        </button>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', gap: '15px' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid rgba(147, 51, 234, 0.2)',
            borderTop: '4px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#94a3b8', letterSpacing: '1px' }}>Carregando desafios...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', width: '100%', maxWidth: '650px' }}>
          {desafios.map((d, index) => {
            const isFinalizado = d.status === 'finalizado';
            const isConcluido = d.status === 'concluido';
            
            const cardBg = isDark 
              ? (isFinalizado ? 'rgba(34, 197, 94, 0.04)' : isConcluido ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255, 255, 255, 0.03)')
              : (isFinalizado ? '#f0fdf4' : isConcluido ? '#fefce8' : '#ffffff');

            const borderColor = isFinalizado ? '#22c55e' : isConcluido ? '#eab308' : '#9333ea';
            const barColor = isFinalizado ? '#22c55e' : isConcluido ? '#eab308' : '#a855f7';

            return (
              <div key={index} style={{
                padding: '22px',
                background: cardBg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${borderColor}55`,
                borderRadius: '16px',
                boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Linha superior do card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' }}>
                    {d.titulo}
                  </h3>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #9333ea, #c084fc)', 
                    color: '#fff', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: '900',
                    boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
                    letterSpacing: '1px'
                  }}>
                    💎 {d.pontos_recompensa || 0} PTS
                  </span>
                </div>

                <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.4' }}>
                  {d.descricao}
                </p>

                {/* Barra de Progresso Futurista */}
                <div style={{ width: '100%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', height: '10px', borderRadius: '6px', overflow: 'hidden', margin: '5px 0 15px 0' }}>
                  <div style={{ 
                    width: `${Math.min(((d.progresso_atual || 0) / (d.objetivo || 1)) * 100, 100)}%`, 
                    background: barColor, 
                    height: '100%', 
                    borderRadius: '6px', 
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 10px ${barColor}`
                  }} />
                </div>

                {/* Botões e Status */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '5px' }}>
                  {d.status === 'pendente' && (
                    <button 
                      disabled={limiteAtingido}
                      onClick={() => handleAction(d.id, 'pular')} 
                      style={{ 
                        background: limiteAtingido ? '#334155' : 'linear-gradient(135deg, #f43f5e, #e11d48)', 
                        color: limiteAtingido ? '#94a3b8' : '#fff',
                        border: 'none', 
                        padding: '10px 20px', 
                        borderRadius: '10px', 
                        cursor: limiteAtingido ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: limiteAtingido ? 'none' : '0 4px 15px rgba(244, 63, 94, 0.3)',
                        transition: '0.2s'
                      }}
                    >
                      {limiteAtingido ? "LIMITE ATINGIDO" : `PULAR (${pulosFeitos}/${limiteMaximo})`}
                    </button>
                  )}
                  {d.status === 'concluido' && (
                    <button 
                      onClick={() => handleAction(d.id, 'recolher')} 
                      style={{ 
                        background: 'linear-gradient(135deg, #facc15, #eab308)', 
                        color: '#000', 
                        border: 'none', 
                        padding: '10px 22px', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontWeight: '900',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      🎁 RECOLHER RECOMPENSA
                    </button>
                  )}
                  {d.status === 'finalizado' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>✅ RECOMPENSA RECOLHIDA</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {desafios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Nenhum desafio disponível para hoje. Volte amanhã!
            </div>
          )}
        </div>
      )}

      {/* BOTÃO VOLTAR */}
      <button 
        style={{
          marginTop: '40px',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
          color: isDark ? '#fff' : '#334155',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '14px 40px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s',
          backdropFilter: 'blur(10px)'
        }} 
        onClick={() => navigate('/home')}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ef4444';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = '#ef4444';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0';
          e.currentTarget.style.color = isDark ? '#fff' : '#334155';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        VOLTAR AO MENU
      </button>
    </div>
  );
};

export default Desafios;