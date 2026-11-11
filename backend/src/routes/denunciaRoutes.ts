import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js'; // Conexão via 'pg' usando a URL do Supabase

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { 
    partida_id, 
    denunciante_id, 
    denunciado_id, 
    denunciado_nome,
    motivo, 
    status_ia,     // Recebe o Veredito da IA (Edge Computing no React)
    confianca_ia,  // Porcentagem de certeza
    detalhes 
  } = req.body;

  try {
    // 1. Se a IA local julgou como CULPADO (PROCEDENTE)
    if (status_ia === 'PROCEDENTE' && denunciado_id) {
      
      console.log(`🚨 PUNIÇÃO: Jogador ${denunciado_id} (${denunciado_nome}) cometeu infração: ${motivo}`);
      console.log(`🤖 Confiança da IA: ${confianca_ia}% | Detalhes: ${detalhes}`);

      // ==========================================
      // APLICAÇÃO DA PENALIDADE NO SUPABASE
      // ==========================================
      
      // Busca a ficha criminal atual do jogador infrator
      const jogador = await pool.query(
        "SELECT total_infracoes, pontos_totais FROM jogadores WHERE id = $1", 
        [denunciado_id]
      );

      if (jogador.rows.length > 0) {
        // TRAVA DE SEGURANÇA: Se for null no banco, assume 0
        let infracoes = (jogador.rows[0].total_infracoes || 0) + 1;
        let pontosAtuais = (jogador.rows[0].pontos_totais || 0);
        
        let pontosRemovidos = 0;
        let statusConta = 'ATIVA';

        // Escala Progressiva de Punição
        if (infracoes === 1) {
          // Apenas um susto, não tira pontos na primeira vez
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

    // 2. Responde pro Frontend para ele fechar o modal e avisar o usuário
    return res.json({ 
      success: true, 
      message: "Denúncia processada e auditada com sucesso." 
    });

  } catch (error) {
    console.error("❌ Erro no banco de dados ao processar denúncia:", error);
    return res.status(500).json({ error: "Falha na persistência da moderação automatizada." });
  }
});

export default router;