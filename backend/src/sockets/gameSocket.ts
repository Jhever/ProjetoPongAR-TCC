import { Server, Socket } from 'socket.io';

interface Jogador {
  socketId: string;
  jogadorId: number | string;
  nome: string;
  lado: 'esquerda' | 'direita' | 'espectador';
  y: number;
}

interface Sala {
  id: string;
  jogadores: Jogador[];
  espectadores: { socketId: string; jogadorId: number | string; nome: string }[];
}

const salas: Record<string, Sala> = {};
let filaEspera: { socketId: string; jogadorId: number | string; nome: string } | null = null;

export function setupGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado ao socket: ${socket.id}`);

    // Entrar na fila de Matchmaking (Procurar Partida)
    socket.on('entrarFila', (dados: { jogadorId: number | string; nome: string }) => {
      if (filaEspera && filaEspera.socketId !== socket.id) {
        const salaId = `sala_${Date.now()}`;
        const jogador1 = filaEspera;
        const jogador2 = { socketId: socket.id, ...dados };
        filaEspera = null;

        salas[salaId] = {
          id: salaId,
          jogadores: [
            { ...jogador1, lado: 'esquerda', y: 0.5 },
            { ...jogador2, lado: 'direita', y: 0.5 },
          ],
          espectadores: []
        };

        socket.join(salaId);
        io.sockets.sockets.get(jogador1.socketId)?.join(salaId);

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
        filaEspera = { socketId: socket.id, ...dados };
        socket.emit('aguardandoAdversario');
      }
    });

    // Criar sala privada com código (Iniciar com Amigo)
    socket.on('criarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      salas[codigo] = {
        id: codigo,
        jogadores: [{ socketId: socket.id, jogadorId, nome, lado: 'esquerda', y: 0.5 }],
        espectadores: []
      };
      socket.join(codigo);
      socket.emit('salaCriada', { codigo });
    });

    // Entrar na sala privada (2º joga como Player 2, 3º em diante vira espectador)
    socket.on('entrarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      const sala = salas[codigo];

      if (!sala) {
        return socket.emit('erroSala', 'Sala não encontrada!');
      }

      // 1. Bloqueia o host de entrar no próprio jogo
      const host = sala.jogadores[0];
      if (host.socketId === socket.id || (host.jogadorId && host.jogadorId === jogadorId)) {
        return socket.emit('erroSala', 'Você já é o anfitrião desta sala!');
      }

      // 2. Se já tem 2 competidores, entra como ESPECTADOR
      if (sala.jogadores.length >= 2) {
        sala.espectadores.push({ socketId: socket.id, jogadorId, nome });
        socket.join(codigo);

        const j1 = sala.jogadores[0];
        const j2 = sala.jogadores[1];

        // Redireciona o 3º usuário para o Game.tsx como espectador
        return socket.emit('partidaEncontrada', {
          salaId: codigo,
          lado: 'espectador',
          adversario: `${j1.nome} vs ${j2.nome}`,
          adversarioId: null
        });
      }

      // 3. Segundo jogador entra normalmente (Player 2)
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

    // Garante que o socket permaneça na sala caso precise reingressar
    socket.on('entrarSala', (dados: { salaId: string }) => {
      socket.join(dados.salaId);
    });

    // Sincronização contínua do movimento da raquete
    socket.on('moverRaquete', (dados: { salaId: string; y: number }) => {
      socket.to(dados.salaId).emit('adversarioMoveu', { y: dados.y });
    });

    // Sincronização da bola (Host calcula e retransmite para P2 e espectadores)
    socket.on('atualizarBola', (dados: { salaId: string; bola: { x: number; y: number; dx: number; dy: number } }) => {
      socket.to(dados.salaId).emit('bolaAtualizada', dados.bola);
    });

    // Atualização de pontuação
    socket.on('pontoMarcado', (dados: { salaId: string; placar: { esquerda: number; direita: number } }) => {
      io.to(dados.salaId).emit('placarAtualizado', dados.placar);
    });

    // Ping / Latência
    socket.on('pingCheck', (callback: () => void) => {
      if (typeof callback === 'function') callback();
    });

    // Desconexão
    socket.on('disconnect', () => {
      if (filaEspera?.socketId === socket.id) {
        filaEspera = null;
      }

      for (const [salaId, sala] of Object.entries(salas)) {
        // Se um dos 2 jogadores ativos desconectar, encerra a partida
        if (sala.jogadores.some(j => j.socketId === socket.id)) {
          socket.to(salaId).emit('adversarioDesconectou');
          delete salas[salaId];
        } else {
          // Se for apenas um espectador saindo, remove apenas ele da lista
          sala.espectadores = sala.espectadores.filter(e => e.socketId !== socket.id);
        }
      }
    });
  });
}