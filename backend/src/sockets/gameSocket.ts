import { Server, Socket } from 'socket.io';

interface Jogador {
  socketId: string;
  jogadorId: number | string;
  nome: string;
  lado: 'esquerda' | 'direita' | 'espectador';
  y: number;
}

interface EstadoJogo {
  ball: { x: number; y: number; dx: number; dy: number };
  p1Y: number;
  p2Y: number;
  placar: { esquerda: number; direita: number };
  rodando: boolean;
  intervalId?: NodeJS.Timeout;
}

interface Sala {
  id: string;
  jogadores: Jogador[];
  espectadores: { socketId: string; jogadorId: number | string; nome: string }[];
  estadoJogo?: EstadoJogo;
}

const salas: Record<string, Sala> = {};
let filaEspera: { socketId: string; jogadorId: number | string; nome: string } | null = null;

// Lança a bola com um ângulo aberto para cima ou para baixo (evita a bola reta morta)
function lancarBola(direcaoX: number) {
  const isCima = Math.random() > 0.5 ? 1 : -1;
  const angulo = (Math.PI / 4) * isCima + (Math.random() * 0.2 - 0.1); 
  const velInicial = 18; // Velocidade maior para não parecer travada
  return {
    x: 400,
    y: 225,
    dx: direcaoX * velInicial * Math.cos(angulo),
    dy: velInicial * Math.sin(angulo)
  };
}

export function setupGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    const estadoInicial = (): EstadoJogo => ({
      ball: { x: 400, y: 225, dx: 0, dy: 0 },
      p1Y: 175,
      p2Y: 175,
      placar: { esquerda: 0, direita: 0 },
      rodando: false
    });

    socket.on('entrarFila', (dados: { jogadorId: number | string; nome: string }) => {
      if (filaEspera && filaEspera.socketId !== socket.id) {
        const salaId = `sala_${Date.now()}`;
        const jogador1 = filaEspera;
        const jogador2 = { socketId: socket.id, ...dados };
        filaEspera = null;

        salas[salaId] = {
          id: salaId,
          jogadores: [
            { ...jogador1, lado: 'esquerda', y: 175 },
            { ...jogador2, lado: 'direita', y: 175 },
          ],
          espectadores: [],
          estadoJogo: estadoInicial()
        };

        socket.join(salaId);
        io.sockets.sockets.get(jogador1.socketId)?.join(salaId);

        io.to(jogador1.socketId).emit('partidaEncontrada', {
          salaId, lado: 'esquerda', adversario: jogador2.nome, adversarioId: jogador2.jogadorId
        });
        io.to(jogador2.socketId).emit('partidaEncontrada', {
          salaId, lado: 'direita', adversario: jogador1.nome, adversarioId: jogador1.jogadorId
        });
      } else {
        filaEspera = { socketId: socket.id, ...dados };
        socket.emit('aguardandoAdversario');
      }
    });

    socket.on('criarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      salas[codigo] = {
        id: codigo,
        jogadores: [{ socketId: socket.id, jogadorId, nome, lado: 'esquerda', y: 175 }],
        espectadores: [],
        estadoJogo: estadoInicial()
      };
      socket.join(codigo);
      socket.emit('salaCriada', { codigo });
    });

    socket.on('entrarSalaAmigo', (dados: { codigo: string; jogadorId: number | string; nome: string }) => {
      const { codigo, jogadorId, nome } = dados;
      const sala = salas[codigo];

      if (!sala) return socket.emit('erroSala', 'Sala não encontrada!');

      const host = sala.jogadores[0];
      if (host.socketId === socket.id || (host.jogadorId && host.jogadorId === jogadorId)) {
        return socket.emit('erroSala', 'Você já é o anfitrião desta sala!');
      }

      if (sala.jogadores.length >= 2) {
        sala.espectadores.push({ socketId: socket.id, jogadorId, nome });
        socket.join(codigo);
        return socket.emit('partidaEncontrada', {
          salaId: codigo, lado: 'espectador', adversario: `${sala.jogadores[0].nome} vs ${sala.jogadores[1].nome}`, adversarioId: null
        });
      }

      sala.jogadores.push({ socketId: socket.id, jogadorId, nome, lado: 'direita', y: 175 });
      socket.join(codigo);

      io.to(sala.jogadores[0].socketId).emit('partidaEncontrada', {
        salaId: codigo, lado: 'esquerda', adversario: sala.jogadores[1].nome, adversarioId: sala.jogadores[1].jogadorId
      });
      io.to(sala.jogadores[1].socketId).emit('partidaEncontrada', {
        salaId: codigo, lado: 'direita', adversario: sala.jogadores[0].nome, adversarioId: sala.jogadores[0].jogadorId
      });
    });

    socket.on('entrarSala', (dados: { salaId: string }) => {
      socket.join(dados.salaId);
    });

    // ------------------------------------------------------------------
    // MOTOR DE FÍSICA NO NODE.JS A 60 FPS (~16ms)
    // ------------------------------------------------------------------
    socket.on('iniciarFisica', (dados: { salaId: string }) => {
      const sala = salas[dados.salaId];
      if (!sala || !sala.estadoJogo || sala.estadoJogo.rodando) return;

      sala.estadoJogo.rodando = true;
      sala.estadoJogo.ball = lancarBola(Math.random() > 0.5 ? 1 : -1);

      sala.estadoJogo.intervalId = setInterval(() => {
        const estado = sala.estadoJogo;
        if (!estado || !estado.rodando) return;

        estado.ball.x += estado.ball.dx;
        estado.ball.y += estado.ball.dy;

        // Paredes Superior e Inferior
        if (estado.ball.y <= 10) {
          estado.ball.y = 10;
          estado.ball.dy = Math.abs(estado.ball.dy);
        } else if (estado.ball.y >= 440) {
          estado.ball.y = 440;
          estado.ball.dy = -Math.abs(estado.ball.dy);
        }

        // Colisões corrigidas com as raquetes
        const p1Front = 75;  // Linha da raquete esquerda
        const p2Front = 725; // Linha da raquete direita

        const hitP1 = estado.ball.x - 10 <= p1Front && estado.ball.x > 40 && estado.ball.y > estado.p1Y && estado.ball.y < estado.p1Y + 100;
        const hitP2 = estado.ball.x + 10 >= p2Front && estado.ball.x < 760 && estado.ball.y > estado.p2Y && estado.ball.y < estado.p2Y + 100;

        if (hitP1) {
          // 🎲 Sorteia um ângulo entre -45 e +45 graus (totalmente aleatório, ignora onde bateu)
          const bounceAngle = (Math.random() - 0.5) * (Math.PI / 2); 
          const currentSpeed = Math.min(Math.hypot(estado.ball.dx, estado.ball.dy) * 1.05, 30);
          
          estado.ball.dx = Math.abs(Math.cos(bounceAngle) * currentSpeed);
          estado.ball.dy = Math.sin(bounceAngle) * currentSpeed;
          estado.ball.x = p1Front + 11; // Joga a bola p/ fora da raquete
        } 
        else if (hitP2) {
          // 🎲 Sorteia um ângulo entre -45 e +45 graus (totalmente aleatório, ignora onde bateu)
          const bounceAngle = (Math.random() - 0.5) * (Math.PI / 2);
          const currentSpeed = Math.min(Math.hypot(estado.ball.dx, estado.ball.dy) * 1.05, 30);
          
          estado.ball.dx = -Math.abs(Math.cos(bounceAngle) * currentSpeed);
          estado.ball.dy = Math.sin(bounceAngle) * currentSpeed;
          estado.ball.x = p2Front - 11; 
        }

        // Marcar pontos
        let pontoMarcado = false;
        if (estado.ball.x < 0) {
          estado.placar.direita += 1;
          pontoMarcado = true;
          if (estado.placar.direita < 10) estado.ball = lancarBola(1);
        } else if (estado.ball.x > 800) {
          estado.placar.esquerda += 1;
          pontoMarcado = true;
          if (estado.placar.esquerda < 10) estado.ball = lancarBola(-1);
        }

        if (pontoMarcado) {
          io.to(dados.salaId).emit('placarAtualizado', estado.placar);
          if (estado.placar.esquerda >= 10 || estado.placar.direita >= 10) {
            estado.rodando = false;
            if (estado.intervalId) clearInterval(estado.intervalId);
          }
        }

        io.to(dados.salaId).emit('bolaAtualizada', estado.ball);
      }, 1000 / 60); // <-- Mudamos para 60 FPS lisinho
    });

    socket.on('moverRaquete', (dados: { salaId: string; y: number }) => {
      const sala = salas[dados.salaId];
      if (sala && sala.estadoJogo) {
        const jogador = sala.jogadores.find(j => j.socketId === socket.id);
        if (jogador) {
          if (jogador.lado === 'esquerda') sala.estadoJogo.p1Y = dados.y;
          if (jogador.lado === 'direita') sala.estadoJogo.p2Y = dados.y;
        }
      }
      socket.to(dados.salaId).emit('adversarioMoveu', { y: dados.y });
    });

    socket.on('webrtc_signal', (dados: { salaId: string; signal: any }) => {
      socket.to(dados.salaId).emit('webrtc_signal', dados.signal);
    });
    
    socket.on('pingCheck', (callback: () => void) => {
      if (typeof callback === 'function') callback();
    });

    socket.on('disconnect', () => {
      if (filaEspera?.socketId === socket.id) filaEspera = null;

      for (const [salaId, sala] of Object.entries(salas)) {
        if (sala.jogadores.some(j => j.socketId === socket.id)) {
          if (sala.estadoJogo?.intervalId) clearInterval(sala.estadoJogo.intervalId);
          socket.to(salaId).emit('adversarioDesconectou');
          delete salas[salaId];
        } else {
          sala.espectadores = sala.espectadores.filter(e => e.socketId !== socket.id);
        }
      }
    });
  });
}