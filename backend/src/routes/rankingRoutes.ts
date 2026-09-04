import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// GET: Ranking Global (Apenas partidas ONLINE)
router.get('/api/ranking', async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        j.id AS id_usuario,
        COALESCE(j.pontos_totais, 0) AS pontos,
        CASE 
          WHEN j.is_anonimo THEN 'ANÔNIMO' 
          ELSE j.usuario 
        END AS nome,
        COALESCE((
          SELECT SUM(d.pontos_recompensa)
          FROM progresso_desafios pd
          JOIN desafios d ON d.id = pd.desafio_id
          WHERE pd.jogador_id = j.id AND pd.status = 'concluido'
        ), 0) AS desafio,
        COALESCE(COUNT(CASE WHEN UPPER(p.resultado) = 'VITORIA' AND UPPER(p.tipo_partida) = 'ONLINE' THEN 1 END), 0) AS vitoria,
        COALESCE(COUNT(CASE WHEN UPPER(p.resultado) = 'DERROTA' AND UPPER(p.tipo_partida) = 'ONLINE' THEN 1 END), 0) AS derrota,
        COALESCE(SUM(CASE WHEN UPPER(p.tipo_partida) = 'ONLINE' THEN p.pontuacao_jogador ELSE 0 END), 0) AS gols_feito,
        COALESCE(SUM(CASE WHEN UPPER(p.tipo_partida) = 'ONLINE' THEN p.pontuacao_adversario ELSE 0 END), 0) AS gols_sofrido
      FROM jogadores j
      LEFT JOIN partidas p ON j.id = p.jogador_id AND UPPER(p.tipo_partida) = 'ONLINE'
      GROUP BY j.id, j.pontos_totais, j.is_anonimo, j.usuario
      ORDER BY pontos DESC, vitoria DESC
      LIMIT 10;
    `;

    const result = await pool.query(query);

    const rankingComPosicao = result.rows.map((row, index) => ({
      posicao: index + 1,
      id_usuario: row.id_usuario,
      pontos: Number(row.pontos),
      nome: row.nome,
      desafio: Number(row.desafio),
      vitoria: Number(row.vitoria),
      derrota: Number(row.derrota),
      gols_feito: Number(row.gols_feito),
      gols_sofrido: Number(row.gols_sofrido)
    }));

    res.json(rankingComPosicao);
  } catch (err: any) {
    console.error("Erro ao buscar ranking:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST: Registrar Partida (Verifica o tipo da partida)
router.post('/api/ranking/registrar-partida', async (req: Request, res: Response) => {
  const {
    jogador_id,
    adversario_nome,
    pontuacao_jogador,
    pontuacao_adversario,
    resultado,
    tipo_partida = 'ONLINE' // Padrão ONLINE caso não informado
  } = req.body;

  if (!jogador_id || !resultado) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Grava o histórico da partida com seu tipo especificado
    const insertQuery = `
      INSERT INTO partidas (
        jogador_id, 
        adversario_nome, 
        pontuacao_jogador, 
        pontuacao_adversario, 
        resultado, 
        tipo_partida
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    await client.query(insertQuery, [
      jogador_id,
      adversario_nome || 'Adversário',
      pontuacao_jogador || 0,
      pontuacao_adversario || 0,
      resultado.toUpperCase(),
      tipo_partida.toUpperCase()
    ]);

    let deltaPontos = 0;
    let novosPontos = null;

    // 2. SÓ altera a carteira de 'pontos_totais' se for partida ONLINE
    if (tipo_partida.toUpperCase() === 'ONLINE') {
      const isVitoria = resultado.toUpperCase() === 'VITORIA';
      deltaPontos = isVitoria ? 25 : -10;

      const updateJogador = `
        UPDATE jogadores 
        SET pontos_totais = GREATEST(0, COALESCE(pontos_totais, 0) + $1)
        WHERE id = $2
        RETURNING pontos_totais;
      `;
      const resJogador = await client.query(updateJogador, [deltaPontos, jogador_id]);
      novosPontos = resJogador.rows[0]?.pontos_totais;
    }

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      tipo_partida: tipo_partida.toUpperCase(),
      pontuacao_alterada: tipo_partida.toUpperCase() === 'ONLINE',
      delta: deltaPontos,
      novos_pontos: novosPontos
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