import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import desafioRoutes from './routes/desafioRoutes';
import partidaRoutes from './routes/partidaRoutes';
import rankingRoutes from './routes/rankingRoutes';
// 1. IMPORTAMOS A NOVA ROTA AQUI 👇
import denunciaRoutes from './routes/denunciaRoutes'; 

import { setupGameSocket } from './sockets/gameSocket';

dotenv.config();

const app = express();
app.use(cors());

// 2. AUMENTAMOS O LIMITE DO JSON PARA A IA NÃO RECLAMAR DO TAMANHO DOS FRAMES 👇
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rota raiz para teste direto no navegador / Render health check
app.get('/', (req, res) => {
  res.send('⚡ Servidor Pong AR rodando com sucesso no Render!');
});

app.use(authRoutes);
app.use(desafioRoutes);
app.use(partidaRoutes);
app.use(rankingRoutes);

// 3. LIGAMOS A ROTA NO SERVIDOR EXPRESS 👇
// Note que passamos '/api/denuncias' como prefixo!
app.use('/api/denuncias', denunciaRoutes);

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