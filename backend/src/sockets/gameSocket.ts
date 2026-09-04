import { Server, Socket } from 'socket.io';

interface Sala {
  id: string;
  jogadores: {
    socketId: string;
    jogadorId: number | string;
    nome: string;
    lado: 'esquerda' | 'direita';
    y: number;
  }[];
}

const salas: Record<string, Sala> = {};
let filaEspera: { socketId: string; jogadorId: number | string; nome: string } | null = null;

export function setupGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado ao socket: ${socket.id}`);

    // Entrar na fila de Matchmaking (Procurar Partida)
    socket.on('entrarFila', (dados: { jogadorId: number | string; nome: string }) => {
      if (filaEspera && filaEspera.socketId !== socket.id) {
        // Encontrou adversário: cria uma nova sala
        const salaId = `sala_${Date.now()}`;
        const jogador1 = filaEspera;
        const jogador2 = { socketId: socket.id, ...dados };
        filaEspera = null;

        salas[salaId] = {
          id: salaId,
          jogadores: [
            { ...jogador1, lado: 'esquerda', y: 0.5 },
            { ...jogador2, lado: 'direita', y: 0.5 },
          ]
        };

        // Adiciona os dois sockets na sala
        socket.join(salaId);
        io.sockets.sockets.get(jogador1.socketId)?.join(salaId);

        // Notifica o início da partida para ambos
        io.to(jogador1.socketId).emit('partidaEncontrada', {
          salaId,
          lado: 'esquerda',
          adversario: jogador2.nome,
          adversarioId: jogador2.jogadorId
        });

        io.to(jogador2.socketId).emit('partidaEncontrada', {
          salaId,
          lado: 'direita',
          adversario: jogador1.nome,
          adversarioId: jogador1.jogadorId
        });
      } else {
        // Ninguém na fila, aguarda
        filaEspera = { socketId: socket.id, ...dados };
        socket.emit('aguardandoAdversario');
      }
    });

    // Criar sala privada com código (Iniciar com Amigo)
    socket.on('criarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      salas[codigo] = {
        id: codigo,
        jogadores: [{ socketId: socket.id, jogadorId, nome, lado: 'esquerda', y: 0.5 }]
      };
      socket.join(codigo);
      socket.emit('salaCriada', { codigo });
    });

    // Entrar na sala privada do amigo
    socket.on('entrarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      const sala = salas[codigo];

      if (!sala) {
        return socket.emit('erroSala', 'Sala não encontrada!');
      }

      if (sala.jogadores.length >= 2) {
        return socket.emit('erroSala', 'Esta sala já está cheia!');
      }

      sala.jogadores.push({ socketId: socket.id, jogadorId, nome, lado: 'direita', y: 0.5 });
      socket.join(codigo);

      const j1 = sala.jogadores[0];
      const j2 = sala.jogadores[1];

      io.to(j1.socketId).emit('partidaEncontrada', {
        salaId: codigo,
        lado: 'esquerda',
        adversario: j2.nome,
        adversarioId: j2.jogadorId
      });

      io.to(j2.socketId).emit('partidaEncontrada', {
        salaId: codigo,
        lado: 'direita',
        adversario: j1.nome,
        adversarioId: j1.jogadorId
      });
    });

    // Sincronização contínua do movimento da mão/raquete
    socket.on('moverRaquete', (dados: { salaId: string; y: number }) => {
      // Reencaminha a posição para o oponente na mesma sala
      socket.to(dados.salaId).emit('adversarioMoveu', { y: dados.y });
    });

    // Sincronização de colisão/bola (o host 'esquerda' calcula a física para evitar conflitos)
    socket.on('atualizarBola', (dados: { salaId: string; bola: { x: number; y: number; vx: number; vy: number } }) => {
      socket.to(dados.salaId).emit('bolaAtualizada', dados.bola);
    });

    // Atualização de pontuação e encerramento
    socket.on('pontoMarcado', (dados: { salaId: string; placar: { esquerda: number; direita: number } }) => {
      io.to(dados.salaId).emit('placarAtualizado', dados.placar);
    });

    // Desconexão
    socket.on('disconnect', () => {
      if (filaEspera?.socketId === socket.id) {
        filaEspera = null;
      }
      for (const [salaId, sala] of Object.entries(salas)) {
        if (sala.jogadores.some(j => j.socketId === socket.id)) {
          socket.to(salaId).emit('adversarioDesconectou');
          delete salas[salaId];
        }
      }
    });
  });
}