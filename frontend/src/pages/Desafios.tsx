import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const styles = {
  backButton: {
    marginTop: '40px',
    background: 'linear-gradient(to right, #f87171, #ef4444)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '15px 50px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
    transition: '0.3s',
  }
};

// Interface para tipar o Desafio no TypeScript
interface Desafio {
  id: number;
  titulo: string;
  descricao: string;
  objetivo: number;
  status: 'pendente' | 'concluido' | 'finalizado';
  progresso_atual: number;
}

const Desafios: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isDark } = useConfig();
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [pulosFeitos, setPulosFeitos] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDesafios = useCallback(async () => {
    if (!userData?.id) return;
    try {
      setLoading(true);
      const [desafiosRes, countRes] = await Promise.all([
        fetch(`http://localhost:3001/api/desafios/${userData.id}`),
        fetch(`http://localhost:3001/api/desafios/contagem-pulos/${userData.id}`)
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
      const res = await fetch(`http://localhost:3001/api/desafios/${action}`, {
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

  const theme = {
    bg: isDark ? '#000' : '#F5F5F5',
    text: isDark ? '#FFF' : '#333',
    card: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFF',
    accent: '#9333ea',
  };

  const limiteMaximo = 3;
  const limiteAtingido = pulosFeitos >= limiteMaximo;

  return (
    <div style={{ padding: '40px', backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: theme.accent }}>DESAFIOS DIÁRIOS</h1>
      <p style={{ marginBottom: '20px' }}>Pulos realizados: {pulosFeitos} / {limiteMaximo}</p>
      
      {loading ? (
        <p>Carregando desafios...</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', width: '100%', maxWidth: '600px' }}>
          {desafios.map((d, index) => {
            const barColor = d.status === 'finalizado' ? '#86efac' : d.status === 'concluido' ? '#fde68a' : '#fca5a5';
            return (
              <div key={index} style={{ padding: '20px', border: `1px solid ${barColor}`, borderRadius: '15px', background: theme.card, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{d.titulo}</h3>
                <p style={{ margin: '0 0 15px 0' }}>{d.descricao}</p>
                
                <div style={{ width: '100%', background: '#333', height: '8px', borderRadius: '4px', margin: '10px 0' }}>
                  <div style={{ width: `${Math.min(((d.progresso_atual || 0) / (d.objetivo || 1)) * 100, 100)}%`, background: barColor, height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {d.status === 'pendente' && (
                    <button 
                      disabled={limiteAtingido}
                      onClick={() => handleAction(d.id, 'pular')} 
                      style={{ 
                        background: limiteAtingido ? '#444' : '#fca5a5', 
                        color: limiteAtingido ? '#888' : '#000',
                        border: 'none', padding: '8px 16px', borderRadius: '5px', 
                        cursor: limiteAtingido ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                      }}
                    >
                      {limiteAtingido ? "LIMITE DE PULOS ATINGIDO" : `PULAR (${pulosFeitos}/${limiteMaximo})`}
                    </button>
                  )}
                  {d.status === 'concluido' && (
                    <button onClick={() => handleAction(d.id, 'recolher')} style={{ background: '#fde68a', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      RECOLHER
                    </button>
                  )}
                  {d.status === 'finalizado' && (
                    <span style={{ color: '#86efac', fontWeight: 'bold' }}>✅ RECOMPENSA RECOLHIDA</span>
                  )}
                </div>
              </div>
            );
          })}
          {desafios.length === 0 && <p>Nenhum desafio disponível para hoje.</p>}
        </div>
      )}

      <button style={styles.backButton} onClick={() => navigate('/home')}>VOLTAR AO MENU</button>
    </div>
  );
};

export default Desafios;