import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';  
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import desafioRoutes from './routes/desafioRoutes.js';
import partidaRoutes from './routes/partidaRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import denunciaRoutes from './routes/denunciaRoutes.js'; 

import { setupGameSocket } from './sockets/gameSocket.js';

dotenv.config();

const app = express();
app.use(cors());

// Aumenta o limite do JSON para suportar avatares em Base64 e frames da IA
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração de diretórios para ES Modules (__dirname equivalente)
//@ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registra as rotas principais da API
app.use(authRoutes);
app.use(desafioRoutes);
app.use(partidaRoutes);
app.use(rankingRoutes);
app.use(denunciaRoutes);

// =========================================================================
// SERVIR O FRONTEND COMPILADO (React/Vite) JUNTO NO MESMO SERVIDOR
// =========================================================================
// Aponta para a pasta public do backend onde o Docker vai injetar o build
const frontendPath = path.resolve(__dirname, '../public');
app.use(express.static(frontendPath));

// Rota coringa compatível com Express v5 (usando Regex pura sem aspas)
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Cria o servidor HTTP integrado para o Express + WebSockets
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Inicializa a escuta de eventos do jogo via WebSocket
setupGameSocket(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`⚡ Servidor unificado (API + WebSockets + Frontend) rodando na porta ${PORT}`));