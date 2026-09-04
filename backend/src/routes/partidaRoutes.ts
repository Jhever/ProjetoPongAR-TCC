import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.post('/salvar-partida', async (req: Request, res: Response) => {
  const { jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado } = req.body;
  try {
    await pool.query(
      'INSERT INTO partidas (jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado) VALUES ($1, $2, $3, $4, $5)',
      [jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado]
    );

    if (resultado === 'vitoria') {
      await pool.query('UPDATE jogadores SET pontos_totais = COALESCE(pontos_totais, 0) + 50 WHERE id = $1', [jogador_id]);
    }

    res.status(201).json({ message: "Partida registrada!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;