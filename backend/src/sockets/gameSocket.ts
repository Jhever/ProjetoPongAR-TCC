import { Server, Socket } from 'socket.io';

interface Jogador {
  socketId: string;
  jogadorId: number | string;
  nome: string;
  lado: 'esquerda' | 'direita' | 'espectador';
  y: number;
}

// O estado que o servidor vai processar a 30 FPS
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

// Sorteia um saque para o servidor rodar
function lancarBola(direcaoX: number) {
  const angulo = (Math.random() * 0.8 - 0.4) * Math.PI; 
  const velInicial = 14;
  return {
    x: 400,
    y: 225,
    dx: direcaoX * velInicial * Math.cos(angulo),
    dy: velInicial * Math.sin(angulo)
  };
}

export function setupGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado ao socket: ${socket.id}`);

    // Estado inicial zerado aguardando o "Começou!"
    const estadoInicial = (): EstadoJogo => ({
      ball: { x: 400, y: 225, dx: 0, dy: 0 },
      p1Y: 175,
      p2Y: 175,
      placar: { esquerda: 0, direita: 0 },
      rodando: false
    });

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
            { ...jogador1, lado: 'esquerda', y: 175 },
            { ...jogador2, lado: 'direita', y: 175 },
          ],
          espectadores: [],
          estadoJogo: estadoInicial()
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
        jogadores: [{ socketId: socket.id, jogadorId, nome, lado: 'esquerda', y: 175 }],
        espectadores: [],
        estadoJogo: estadoInicial()
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
      sala.jogadores.push({ socketId: socket.id, jogadorId, nome, lado: 'direita', y: 175 });
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

    // ------------------------------------------------------------------
    // MÁGICA DO SERVIDOR AUTORITATIVO: FÍSICA RODANDO NO NODE.JS
    // ------------------------------------------------------------------
    socket.on('iniciarFisica', (dados: { salaId: string }) => {
      const sala = salas[dados.salaId];
      if (!sala || !sala.estadoJogo || sala.estadoJogo.rodando) return;

      sala.estadoJogo.rodando = true;
      // Dá o primeiro saque aleatório
      sala.estadoJogo.ball = lancarBola(Math.random() > 0.5 ? 1 : -1);

      sala.estadoJogo.intervalId = setInterval(() => {
        const estado = sala.estadoJogo;
        if (!estado || !estado.rodando) return;

        // Movimentação da bola
        estado.ball.x += estado.ball.dx;
        estado.ball.y += estado.ball.dy;

        // Paredes Superior e Inferior
        if (estado.ball.y <= 10) {
          estado.ball.y = 10;
          estado.ball.dy = Math.abs(estado.ball.dy) * 1.02;
          estado.ball.dx += (Math.random() - 0.5) * 0.3;
        } else if (estado.ball.y >= 440) {
          estado.ball.y = 440;
          estado.ball.dy = -Math.abs(estado.ball.dy) * 1.02;
          estado.ball.dx += (Math.random() - 0.5) * 0.3;
        }

        // Colisão com as Raquetes (usando as posições Y guardadas no servidor)
        const hitP1 = estado.ball.x <= 75 && estado.ball.x >= 45 && estado.ball.y > estado.p1Y && estado.ball.y < estado.p1Y + 100;
        const hitP2 = estado.ball.x >= 725 && estado.ball.x <= 755 && estado.ball.y > estado.p2Y && estado.ball.y < estado.p2Y + 100;

        if (hitP1) {
          const impactOffset = (estado.ball.y - (estado.p1Y + 50)) / 50;
          const bounceAngle = (impactOffset * (Math.PI / 3)) + ((Math.random() - 0.5) * 0.25);
          const currentSpeed = Math.hypot(estado.ball.dx, estado.ball.dy);
          const newSpeed = Math.min(currentSpeed * 1.12, 35);
          estado.ball.dx = Math.abs(Math.cos(bounceAngle) * newSpeed);
          estado.ball.dy = Math.sin(bounceAngle) * newSpeed;
          estado.ball.x = 76;
        } else if (hitP2) {
          const impactOffset = (estado.ball.y - (estado.p2Y + 50)) / 50;
          const bounceAngle = (impactOffset * (Math.PI / 3)) + ((Math.random() - 0.5) * 0.25);
          const currentSpeed = Math.hypot(estado.ball.dx, estado.ball.dy);
          const newSpeed = Math.min(currentSpeed * 1.12, 35);
          estado.ball.dx = -Math.abs(Math.cos(bounceAngle) * newSpeed);
          estado.ball.dy = Math.sin(bounceAngle) * newSpeed;
          estado.ball.x = 724;
        }

        // Marcação de Pontos
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

        // Se alguém marcou ponto, avisa os navegadores
        if (pontoMarcado) {
          io.to(dados.salaId).emit('placarAtualizado', estado.placar);
          if (estado.placar.esquerda >= 10 || estado.placar.direita >= 10) {
            estado.rodando = false;
            if (estado.intervalId) clearInterval(estado.intervalId); // Fim de jogo
          }
        }

        // Envia as coordenadas da bola a 30 FPS para ambos os navegadores desenharem
        io.to(dados.salaId).emit('bolaAtualizada', estado.ball);
      }, 1000 / 30);
    });

    // Sincronização contínua do movimento da raquete
    socket.on('moverRaquete', (dados: { salaId: string; y: number }) => {
      const sala = salas[dados.salaId];
      if (sala && sala.estadoJogo) {
        // Atualiza a posição Y da raquete no servidor para calcular a colisão com precisão
        const jogador = sala.jogadores.find(j => j.socketId === socket.id);
        if (jogador) {
          if (jogador.lado === 'esquerda') sala.estadoJogo.p1Y = dados.y;
          if (jogador.lado === 'direita') sala.estadoJogo.p2Y = dados.y;
        }
      }
      // Repassa visualmente para o adversário
      socket.to(dados.salaId).emit('adversarioMoveu', { y: dados.y });
    });

    // Sincronização de Vídeo WebRTC (Câmeras P2P + Rádio do "Ready")
    socket.on('webrtc_signal', (dados: { salaId: string; signal: any }) => {
      // Repassa o sinal de vídeo diretamente para o adversário na sala
      socket.to(dados.salaId).emit('webrtc_signal', dados.signal);
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
          if (sala.estadoJogo?.intervalId) clearInterval(sala.estadoJogo.intervalId); // Para a física do servidor
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