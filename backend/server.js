// @ts-nocheck
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão adaptada para ler a String de Conexão (URI) do Supabase vinda do .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obrigatório para evitar erros de conexão segura na nuvem
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- ROTA DE CONTAGEM (ESSENCIAL PARA O FRONTEND) ---
app.get('/api/desafios/contagem-pulos/:jogador_id', async (req, res) => {
    const { jogador_id } = req.params;
    try {
        const result = await pool.query(
            "SELECT COUNT(*) AS total_pulos FROM progresso_desafios WHERE jogador_id = $1 AND data_registro = CURRENT_DATE AND status = 'pulado'",
            [jogador_id]
        );
        
        // Garante que se o retorno for nulo por algum motivo, ele assuma 0
        const total = parseInt(result.rows[0].total_pulos) || 0;
        
        res.json({ total: total });
    } catch (err) { 
        console.error("Erro na rota de contagem-pulos:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

// --- ROTA DE DESAFIOS (Corrigida e Higienizada) ---
app.get('/api/desafios/:jogador_id', async (req, res) => {
    const { jogador_id } = req.params;
    try {
        // 1. Busca os desafios atuais que não estão pulados nem finalizados de forma errada
        let result = await pool.query(
            "SELECT d.id, d.titulo, d.descricao, d.objetivo, p.status, p.progresso_atual FROM desafios d JOIN progresso_desafios p ON d.id = p.desafio_id WHERE p.jogador_id = $1 AND p.data_registro = CURRENT_DATE AND p.status != 'pulado' ORDER BY p.id ASC LIMIT 5",
            [jogador_id]
        );

        // 2. Se houver menos de 5 na tela, gera novos para completar o painel
        if (result.rows.length < 5) {
            const faltam = 5 - result.rows.length;
            
            await pool.query(`
                INSERT INTO progresso_desafios (jogador_id, desafio_id, data_registro, status, progresso_atual)
                SELECT $1, id, CURRENT_DATE, 'pendente', 0
                FROM desafios 
                WHERE id NOT IN (
                    SELECT desafio_id FROM progresso_desafios 
                    WHERE jogador_id = $1 AND data_registro = CURRENT_DATE
                )
                ORDER BY RANDOM() LIMIT $2`, [jogador_id, faltam]
            );
            
            // Re-busca para entregar os 5 finais atualizados ao React
            result = await pool.query(
                "SELECT d.id, d.titulo, d.descricao, d.objetivo, p.status, p.progresso_atual FROM desafios d JOIN progresso_desafios p ON d.id = p.desafio_id WHERE p.jogador_id = $1 AND p.data_registro = CURRENT_DATE AND p.status != 'pulado' ORDER BY p.id ASC LIMIT 5",
                [jogador_id]
            );
        }

        res.json(result.rows);
    } catch (err) {
        console.error("ERRO NO SERVIDOR:", err);
        res.status(500).json({ error: err.message });
    }
});

//ROTA PARA PULAR DESAFIOS
app.post('/api/desafios/pular', async (req, res) => {
    const jogador_id = parseInt(req.body.jogador_id);
    const desafio_id = parseInt(req.body.desafio_id);
    const LIMITE = 3;

    try {
        const contagem = await pool.query(
            "SELECT COUNT(*) FROM progresso_desafios WHERE jogador_id = $1 AND data_registro = CURRENT_DATE AND status = 'pulado'",
            [jogador_id]
        );

        if (parseInt(contagem.rows[0].count) >= LIMITE) {
            return res.status(403).json({ error: "Limite de pulos diários atingido!" });
        }

        const result = await pool.query(
            "UPDATE progresso_desafios SET status = 'pulado' WHERE jogador_id = $1 AND desafio_id = $2 AND data_registro = CURRENT_DATE", 
            [jogador_id, desafio_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Desafio não encontrado." });
        }
        
        res.json({ message: "Desafio pulado com sucesso!" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- DEMAIS ROTAS INTACTAS ---
app.post('/register', async (req, res) => {
  const { usuario, email, senha } = req.body;
  try {
    await pool.query('INSERT INTO jogadores (usuario, email, senha) VALUES ($1, $2, $3)', [usuario, email, senha]);
    res.status(201).json({ message: "Conta criada com sucesso!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/get-user', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jogadores LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body; 
  try {
    const result = await pool.query('SELECT * FROM jogadores WHERE (email = $1 OR usuario = $1) AND senha = $2', [email, senha]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(401).json({ error: "Dados incorretos!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/update-user', async (req, res) => {
  const { id, currentPassword, newPassword } = req.body;
  try {
    const user = await pool.query('SELECT senha FROM jogadores WHERE id = $1', [id]);
    if (user.rows[0].senha !== currentPassword) return res.status(401).json({ error: "Senha incorreta!" });
    await pool.query('UPDATE jogadores SET senha = $1 WHERE id = $2', [newPassword, id]);
    res.json({ message: "Senha updated!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/salvar-partida', async (req, res) => {
  const { jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado } = req.body;
  try {
    await pool.query('INSERT INTO partidas (jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado) VALUES ($1, $2, $3, $4, $5)', [jogador_id, adversario_nome, pontuacao_jogador, pontuacao_adversario, resultado]);
    res.status(201).json({ message: "Partida registrada!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/desafios/recolher', async (req, res) => {
    const { jogador_id, desafio_id } = req.body;
    try {
        await pool.query("UPDATE progresso_desafios SET status = 'finalizado' WHERE jogador_id = $1 AND desafio_id = $2 AND data_registro = CURRENT_DATE", [jogador_id, desafio_id]);
        res.json({ message: "Recompensa recolhida!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post ('/api/desafios/progresso', async (req, res) => {
    const { jogador_id, desafio_id, progresso } = req.body;
    try {
        const result = await
    pool.query("UPDATE progresso_desafios SET progresso_atual = $1 WHERE jogador_id = $2 AND desafio_id = $3 AND data_registro = CURRENT_DATE", [progresso, jogador_id, desafio_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Desafio não encontrado." });
        }  
        res.json({ message: "Progresso atualizado!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {

    const result = await pool.query(
      'SELECT * FROM jogadores WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Email não encontrado.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expiracao = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `UPDATE jogadores
       SET reset_token = $1,
           reset_token_expira = $2
       WHERE email = $3`,
      [token, expiracao, email]
    );

    const link =
      `http://localhost:5173/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha - Pong AR',
      html: `
        <h2>Recuperação de Senha</h2>

        <p>Foi solicitada uma redefinição de senha para sua conta.</p>

        <p>Clique no link abaixo:</p>

        <a href="${link}">
          Redefinir Senha
        </a>

        <p>Este link expira em 1 hora.</p>
      `
    });

    res.json({
      message: 'Email enviado com sucesso.'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

app.post('/reset-password', async (req, res) => {

  const { token, senha } = req.body;

  try {

    const result = await pool.query(
      `SELECT *
       FROM jogadores
       WHERE reset_token = $1
       AND reset_token_expira > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Token inválido ou expirado.'
      });
    }

    await pool.query(
      `UPDATE jogadores
       SET senha = $1,
           reset_token = NULL,
           reset_token_expira = NULL
       WHERE id = $2`,
      [senha, result.rows[0].id]
    );

    res.json({
      message: 'Senha alterada com sucesso.'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));