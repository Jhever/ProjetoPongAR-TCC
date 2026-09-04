import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/api/desafios/contagem-pulos/:jogador_id', async (req: Request, res: Response) => {
  const { jogador_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS total_pulos FROM progresso_desafios WHERE jogador_id = $1 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AND status = 'pulado'",
      [jogador_id]
    );
    res.json({ total: parseInt(result.rows[0].total_pulos) || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/desafios/:jogador_id', async (req: Request, res: Response) => {
  const { jogador_id } = req.params;
  try {
    let result = await pool.query(
      `SELECT d.id, d.titulo, d.descricao, d.objetivo, d.pontos_recompensa, p.status, p.progresso_atual 
       FROM desafios d 
       JOIN progresso_desafios p ON d.id = p.desafio_id 
       WHERE p.jogador_id = $1 AND p.data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AND p.status != 'pulado' 
       ORDER BY p.id ASC LIMIT 5`,
      [jogador_id]
    );

    if (result.rows.length < 5) {
      const faltam = 5 - result.rows.length;
      await pool.query(
        `INSERT INTO progresso_desafios (jogador_id, desafio_id, data_registro, status, progresso_atual)
         SELECT $1, id, (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE, 'pendente', 0
         FROM desafios 
         WHERE id NOT IN (
             SELECT desafio_id FROM progresso_desafios 
             WHERE jogador_id = $1 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE
         )
         ORDER BY RANDOM() LIMIT $2`,
        [jogador_id, faltam]
      );

      result = await pool.query(
        `SELECT d.id, d.titulo, d.descricao, d.objetivo, d.pontos_recompensa, p.status, p.progresso_atual 
         FROM desafios d 
         JOIN progresso_desafios p ON d.id = p.desafio_id 
         WHERE p.jogador_id = $1 AND p.data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AND p.status != 'pulado' 
         ORDER BY p.id ASC LIMIT 5`,
        [jogador_id]
      );
    }

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/desafios/pular', async (req: Request, res: Response) => {
  const { jogador_id, desafio_id } = req.body;
  const LIMITE = 3;

  try {
    const contagem = await pool.query(
      "SELECT COUNT(*) FROM progresso_desafios WHERE jogador_id = $1 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AND status = 'pulado'",
      [jogador_id]
    );

    if (parseInt(contagem.rows[0].count) >= LIMITE) {
      return res.status(403).json({ error: "Limite de pulos diários atingido!" });
    }

    const result = await pool.query(
      "UPDATE progresso_desafios SET status = 'pulado' WHERE jogador_id = $1 AND desafio_id = $2 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE",
      [jogador_id, desafio_id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Desafio não encontrado." });

    res.json({ message: "Desafio pulado com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/desafios/recolher', async (req: Request, res: Response) => {
  const { jogador_id, desafio_id } = req.body;
  try {
    const desafioResult = await pool.query("SELECT pontos_recompensa FROM desafios WHERE id = $1", [desafio_id]);
    if (desafioResult.rows.length === 0) return res.status(404).json({ error: "Desafio não encontrado." });

    const pontosGanhos = desafioResult.rows[0].pontos_recompensa;
    const updateProgresso = await pool.query(
      "UPDATE progresso_desafios SET status = 'finalizado' WHERE jogador_id = $1 AND desafio_id = $2 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AND status = 'concluido'",
      [jogador_id, desafio_id]
    );

    if (updateProgresso.rowCount === 0) {
      return res.status(400).json({ error: "Desafio não concluído ou recompensa já resgatada." });
    }

    await pool.query("UPDATE jogadores SET pontos_totais = COALESCE(pontos_totais, 0) + $1 WHERE id = $2", [pontosGanhos, jogador_id]);
    res.json({ message: `Recompensa recolhida! Você ganhou ${pontosGanhos} pontos!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/desafios/progresso', async (req: Request, res: Response) => {
  const { jogador_id, desafio_id, progresso } = req.body;
  try {
    const result = await pool.query(
      "UPDATE progresso_desafios SET progresso_atual = $1 WHERE jogador_id = $2 AND desafio_id = $3 AND data_registro = (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE",
      [progresso, jogador_id, desafio_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Desafio não encontrado." });
    res.json({ message: "Progresso atualizado!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;