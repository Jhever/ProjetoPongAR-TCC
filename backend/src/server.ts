import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import desafioRoutes from './routes/desafioRoutes';
import partidaRoutes from './routes/partidaRoutes';
import rankingRoutes from './routes/rankingRoutes';
import denunciaRoutes from './routes/denunciaRoutes'; 

import { setupGameSocket } from './sockets/gameSocket';

dotenv.config();

const app = express();
app.use(cors());

// Aumenta o limite do JSON para suportar avatares em Base64 e frames da IA
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rota raiz para teste direto / Render health check
app.get('/', (req, res) => {
  res.send('⚡ Servidor Pong AR rodando com sucesso no Render!');
});

// Registra as rotas principais diretamente. 
// Como os arquivos de rotas possuem os caminhos completos (/api/...), 
// registrá-los na raiz evita duplicação de prefixos (como /api/api).
app.use(authRoutes);
app.use(desafioRoutes);
app.use(partidaRoutes);
app.use(rankingRoutes);
app.use(denunciaRoutes);

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`⚡ Backend & WebSockets rodando na porta ${PORT}`));