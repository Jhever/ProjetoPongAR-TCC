import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import desafioRoutes from './routes/desafioRoutes';
import partidaRoutes from './routes/partidaRoutes';
import rankingRoutes from './routes/rankingRoutes';
import { setupGameSocket } from './sockets/gameSocket';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(desafioRoutes);
app.use(partidaRoutes);
app.use(rankingRoutes);

// Cria o servidor HTTP integrado para o Express + WebSockets
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Inicializa a escuta de eventos do jogo
setupGameSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`⚡ Backend & WebSockets rodando na porta ${PORT}`));