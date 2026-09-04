import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// GET: Buscar Top 50 do ranking consolidado
router.get('/api/ranking', async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        j.id AS id_usuario,
        COALESCE(j.pontos_totais, 0) AS pontos,
        CASE WHEN j.is_anonimo THEN 'Anônimo' ELSE j.usuario END AS nome,
        COALESCE(COUNT(CASE WHEN UPPER(p.resultado) = 'VITORIA' THEN 1 END), 0) AS vitorias,
        COALESCE(COUNT(CASE WHEN UPPER(p.resultado) = 'DERROTA' THEN 1 END), 0) AS derrotas,
        COALESCE(SUM(p.pontuacao_jogador), 0) AS gols_feitos,
        COALESCE(SUM(p.pontuacao_adversario), 0) AS gols_sofridos,
        CASE 
          WHEN COUNT(p.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN UPPER(p.resultado) = 'VITORIA' THEN 1 END)::numeric / COUNT(p.id)) * 100, 1)
          ELSE 0 
        END AS winrate
      FROM jogadores j
      LEFT JOIN partidas p ON j.id = p.jogador_id
      GROUP BY j.id, j.pontos_totais, j.is_anonimo, j.usuario
      ORDER BY pontos DESC, vitorias DESC
      LIMIT 50;
    `;

    const result = await pool.query(query);

    const rankingComPosicao = result.rows.map((row, index) => ({
      posicao: index + 1,
      ...row,
      vitorias: Number(row.vitorias),
      derrotas: Number(row.derrotas),
      gols_feitos: Number(row.gols_feitos),
      gols_sofridos: Number(row.gols_sofridos),
      winrate: Number(row.winrate)
    }));

    res.json(rankingComPosicao);
  } catch (err: any) {
    console.error("Erro na busca de ranking:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST: Registrar término de partida e pontuação
router.post('/api/ranking/registrar-partida', async (req: Request, res: Response) => {
  const { jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado } = req.body;

  if (!jogador_id || !resultado) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Salva a partida no histórico
    const insertPartida = `
      INSERT INTO partidas (jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    await client.query(insertPartida, [
      jogador_id,
      adversario_nome || 'Adversário',
      pontuacao_jogador || 0,
      pontuacao_adversario || 0,
      resultado.toUpperCase()
    ]);

    // 2. Calcula delta de pontos (+25 para vitória, -10 para derrota)
    const isVitoria = resultado.toUpperCase() === 'VITORIA';
    const deltaPontos = isVitoria ? 25 : -10;

    // 3. Atualiza pontos totais do jogador (sem deixar ficar negativo)
    const updateJogador = `
      UPDATE jogadores 
      SET pontos_totais = GREATEST(0, COALESCE(pontos_totais, 0) + $1)
      WHERE id = $2
      RETURNING pontos_totais;
    `;
    const resultadoJogador = await client.query(updateJogador, [deltaPontos, jogador_id]);

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      novos_pontos: resultadoJogador.rows[0]?.pontos_totais ?? 0,
      delta: deltaPontos
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error("Erro ao registrar partida:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;