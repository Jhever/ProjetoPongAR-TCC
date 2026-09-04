import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { transporter } from '../services/mailer.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { usuario, email, senha } = req.body;
  try {
    await pool.query(
      'INSERT INTO jogadores (usuario, email, senha, pontos_totais, is_anonimo) VALUES ($1, $2, $3, 0, false)',
      [usuario, email, senha]
    );
    res.status(201).json({ message: "Conta criada com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, usuario, email, is_anonimo, pontos_totais FROM jogadores WHERE (email = $1 OR usuario = $1) AND senha = $2',
      [email, senha]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: "Credenciais inválidas!" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/usuario/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, usuario, email, is_anonimo, pontos_totais FROM jogadores WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/api/usuario/:id/anonimo', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_anonimo } = req.body;
  try {
    await pool.query('UPDATE jogadores SET is_anonimo = $1 WHERE id = $2', [is_anonimo, id]);
    res.json({ message: "Preferência de anonimato atualizada!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update-user', async (req: Request, res: Response) => {
  const { id, currentPassword, newPassword } = req.body;
  try {
    const user = await pool.query('SELECT senha FROM jogadores WHERE id = $1', [id]);
    if (user.rows.length === 0 || user.rows[0].senha !== currentPassword) {
      return res.status(401).json({ error: "Senha atual incorreta!" });
    }
    await pool.query('UPDATE jogadores SET senha = $1 WHERE id = $2', [newPassword, id]);
    res.json({ message: "Senha alterada com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM jogadores WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email não encontrado.' });

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `UPDATE jogadores SET reset_token = $1, reset_token_expira = NOW() + INTERVAL '1 hour' WHERE email = $2`,
      [token, email]
    );

    const link = `http://localhost:5173/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha - Pong AR',
      html: `
        <h2>Recuperação de Senha</h2>
        <p>Foi solicitada uma redefinição de senha para sua conta.</p>
        <p><a href="${link}">Clique aqui para redefinir sua senha</a></p>
        <p>Este link expira em 1 hora.</p>
      `
    });

    res.json({ message: 'Email enviado com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, senha } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM jogadores WHERE reset_token = $1 AND reset_token_expira > NOW()',
      [token]
    );

    if (result.rows.length === 0) return res.status(400).json({ error: 'Token inválido ou expirado.' });

    await pool.query(
      'UPDATE jogadores SET senha = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2',
      [senha, result.rows[0].id]
    );

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;