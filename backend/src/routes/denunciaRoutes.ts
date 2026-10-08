import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js'; // Conexão via 'pg' usando a URL do Supabase

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { 
    partida_id, 
    denunciante_id, 
    denunciado_id, 
    tipo_denuncia, 
    historico_frames, 
    placar_denunciante, 
    placar_denunciado 
  } = req.body;

  try {
    // 1. Envia os dados para a sua Inteligência Artificial (FastAPI em Python)
    const respostaPython = await fetch('http://localhost:8000/api/auditoria/analisar-gesto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jogador_id: denunciado_id,
        tipo_denuncia: tipo_denuncia,
        historico_frames: historico_frames,
        placar_denunciante: placar_denunciante || 0,
        placar_denunciado: placar_denunciado || 0
      })
    });

    const resultadoIA = await respostaPython.json();

    // 2. Se a IA julgou como CULPADO (procedente: true)
    if (resultadoIA.procedente && denunciado_id) {
      
      console.log(`🚨 PUNIÇÃO: Jogador ${denunciado_id} cometeu infração!`);

      // ==========================================
      // AQUI VOCÊ DESCONTA OS PONTOS E APLICA BANIMENTO USANDO O POOL
      // ==========================================
      
      // Busca a ficha criminal atual do jogador infrator
      const jogador = await pool.query(
        "SELECT total_infracoes, pontos_totais FROM jogadores WHERE id = $1", 
        [denunciado_id]
      );

      if (jogador.rows.length > 0) {
        let infracoes = jogador.rows[0].total_infracoes + 1;
        let pontosAtuais = jogador.rows[0].pontos_totais;
        
        let pontosRemovidos = 0;
        let statusConta = 'ATIVA';

        // Escala Progressiva de Punição
        if (infracoes === 1) {
          // Apenas um susto, não tira pontos na primeira vez (ou tira, você decide)
          pontosRemovidos = 0; 
        } 
        else if (infracoes === 2) {
          pontosRemovidos = 30; // Arranca os pontos
        } 
        else if (infracoes >= 3) {
          pontosRemovidos = 30;
          statusConta = 'BANIDA'; // Perdeu a conta
        }

        // Garante que a conta não fique negativa
        const novosPontos = Math.max(0, pontosAtuais - pontosRemovidos);

        // Dispara o UPDATE no Supabase
        await pool.query(`
          UPDATE jogadores 
          SET total_infracoes = $1, 
              pontos_totais = $2,
              status_conta = $3
          WHERE id = $4
        `, [infracoes, novosPontos, statusConta, denunciado_id]);
        
        console.log(`Penalidade aplicada. Ficha: ${infracoes} infrações. Novo saldo: ${novosPontos}. Status: ${statusConta}`);
      }
    }

    // 3. Responde pro Frontend para ele fechar o modal e avisar o usuário
    return res.json({ 
      success: true, 
      auditoria: resultadoIA 
    });

  } catch (error) {
    console.error("❌ Erro ao conectar com o serviço de IA Python:", error);
    return res.status(500).json({ error: "Falha na moderação automatizada." });
  }
});

export default router;