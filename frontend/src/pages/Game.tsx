import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Vision from "@mediapipe/tasks-vision";
import { socket } from '../services/socket';
import { auditoriaGlobal } from '../services/Denuncia';
import Denuncia from '../components/Denuncia';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

type Landmark = { x: number; y: number; z?: number; visibility?: number; presence?: number; };
type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
type FingerInfo = { name: FingerName; mcp: number; pip: number; dip: number; tip: number; hide: number[]; isThumb?: boolean; };

interface PlayerStats {
  nome: string;
  avatar: string;
  pontos: number;
  vitorias: number;
}

const FINGERS: FingerInfo[] = [
  { name: 'thumb', mcp: 1, pip: 2, dip: 3, tip: 4, hide: [2, 3, 4], isThumb: true },
  { name: 'index', mcp: 5, pip: 6, dip: 7, tip: 8, hide: [6, 7, 8] },
  { name: 'middle', mcp: 9, pip: 10, dip: 11, tip: 12, hide: [10, 11, 12] },
  { name: 'ring', mcp: 13, pip: 14, dip: 15, tip: 16, hide: [14, 15, 16] },
  { name: 'pinky', mcp: 17, pip: 18, dip: 19, tip: 20, hide: [18, 19, 20] },
];

const INITIAL_HIDDEN_COUNTERS: Record<FingerName, number> = {
  thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0,
};

function dist2D(a: Landmark, b: Landmark): number { return Math.hypot(a.x - b.x, a.y - b.y); }

function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const abLen = Math.hypot(abx, aby), cbLen = Math.hypot(cbx, cby);
  if (abLen === 0 || cbLen === 0) return 180;
  const cos = dot / (abLen * cbLen);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function pointInPolygon(point: Landmark, polygon: Landmark[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function detectHiddenFingers(landmarks: Landmark[]): Record<FingerName, boolean> {
  const result: Record<FingerName, boolean> = { thumb: false, index: false, middle: false, ring: false, pinky: false };
  const palmPolygon = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  const palmSize = Math.max(dist2D(landmarks[0], landmarks[9]), dist2D(landmarks[5], landmarks[17]), 0.0001);

  for (const finger of FINGERS) {
    const mcp = landmarks[finger.mcp], pip = landmarks[finger.pip], dip = landmarks[finger.dip], tip = landmarks[finger.tip];
    const fingerLength = dist2D(mcp, pip) + dist2D(pip, dip) + dist2D(dip, tip);
    const curlRatio = dist2D(mcp, tip) / Math.max(fingerLength, 0.0001);
    const pipAngle = angleDeg(mcp, pip, dip), dipAngle = angleDeg(pip, dip, tip);
    const isBent = pipAngle < 145 || dipAngle < 145;
    const tipInsidePalm = pointInPolygon(tip, palmPolygon);
    const dipInsidePalm = pointInPolygon(dip, palmPolygon);
    const closeToPalmCenter = dist2D(tip, landmarks[9]) < palmSize * 0.9;

    if (finger.isThumb) {
      result[finger.name] = tipInsidePalm || dipInsidePalm || (curlRatio < 0.55 && closeToPalmCenter);
    } else {
      result[finger.name] = (tipInsidePalm && curlRatio < 0.85) || (dipInsidePalm && curlRatio < 0.85) || curlRatio < 0.52 || (isBent && closeToPalmCenter);
    }
  }
  return result;
}

function buildHiddenMask(landmarks: Landmark[], counters: Record<FingerName, number>): boolean[] {
  const rawHidden = detectHiddenFingers(landmarks);
  const hiddenMask = new Array<boolean>(21).fill(false);

  for (const finger of FINGERS) {
    if (rawHidden[finger.name]) counters[finger.name] = Math.min(counters[finger.name] + 1, 4);
    else counters[finger.name] = Math.max(counters[finger.name] - 1, 0);

    if (counters[finger.name] >= 2) {
      for (const index of finger.hide) hiddenMask[index] = true;
    }
  }
  return hiddenMask;
}

const getDefaultAvatar = (nome: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nome || 'Player')}`;

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    salaId: string;
    lado: 'esquerda' | 'direita';
    adversario: string;
    adversarioId: number | string;
    tipoPartida?: string;
  } | null;

  const salaId = state?.salaId || 'OFFLINE';
  const lado = state?.lado || 'esquerda';
  const adversarioNome = state?.adversario || 'Jogador 2';
  const adversarioId = state?.adversarioId;
  const isHost = lado === 'esquerda';
  const tipoPartida = state?.tipoPartida || 'ONLINE';

  const usuarioSalvo = JSON.parse(localStorage.getItem('usuario') || '{}');
  const nomeLocal = usuarioSalvo.usuario || usuarioSalvo.nome || 'Jogador 1';
  const isLocalAnonimo = usuarioSalvo.is_anonimo === true || nomeLocal.toUpperCase() === 'ANÔNIMO';
  const isAdversarioAnonimo = adversarioNome.toUpperCase() === 'ANÔNIMO';
  const ocultarCameraAdversario = isLocalAnonimo || isAdversarioAnonimo;

  // Exibir tela de VS apenas quando NÃO for partida local/offline no mesmo PC
  const isPartidaLocalMesmoPC = tipoPartida.toUpperCase() === 'OFFLINE' || tipoPartida.toUpperCase() === 'LOCAL';
  const [showVersus, setShowVersus] = useState(!isPartidaLocalMesmoPC);
  const [versusCountdown, setVersusCountdown] = useState(4);

  const [meusDados, setMeusDados] = useState<PlayerStats>({
    nome: nomeLocal,
    avatar: usuarioSalvo.avatar || usuarioSalvo.foto || getDefaultAvatar(nomeLocal),
    pontos: Number(usuarioSalvo.pontos ?? usuarioSalvo.pontuacao ?? 0),
    vitorias: Number(usuarioSalvo.vitorias ?? 0),
  });

  const [dadosAdversario, setDadosAdversario] = useState<PlayerStats>({
    nome: adversarioNome,
    avatar: getDefaultAvatar(adversarioNome),
    pontos: 0,
    vitorias: 0,
  });

  const meusDadosRef = useRef(meusDados);
  useEffect(() => {
    meusDadosRef.current = meusDados;
  }, [meusDados]);

  const hiddenFingerCountersRef = useRef<Record<FingerName, number>>({ ...INITIAL_HIDDEN_COUNTERS });
  const [placar, setPlacar] = useState({ p1: 0, p2: 0 });
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showDenunciaModal, setShowDenunciaModal] = useState(false);
  const [vencedor, setVencedor] = useState<string | null>(null);
  const [latency, setLatency] = useState(15);
  const [fps, setFps] = useState(30);

  const [isReady, setIsReady] = useState(false);
  const [isAdversarioReady, setIsAdversarioReady] = useState(false);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const isReadyRef = useRef(false);
  const gameStartedRef = useRef(false);
  const placarRef = useRef({ p1: 0, p2: 0 });
  const partidaFinalizadaRef = useRef(false);

  const [gameLogs, setGameLogs] = useState<string[]>([
    '[Socket] Connected to server',
    `[Room] Joined ${salaId}`,
    `[Match] Player 1 (${isHost ? nomeLocal : adversarioNome}) vs Player 2 (${!isHost ? nomeLocal : adversarioNome})`
  ]);

  const game = useRef({
    ball: { x: 400, y: 225, dx: 7, dy: (Math.random() > 0.5 ? 4 : -4) },
    p1Y: 175,
    p2Y: 175
  });

  // Busca os pontos e vitórias reais dos 2 jogadores no Ranking
  useEffect(() => {
    if (isPartidaLocalMesmoPC) return;

    fetch(`${API_URL}/api/ranking`)
      .then(res => (res.ok ? res.json() : []))
      .then((lista: any[]) => {
        if (!Array.isArray(lista)) return;

        // Atualiza dados do jogador local
        const meuReg = lista.find(
          (u: any) =>
            (usuarioSalvo?.id && Number(u.id) === Number(usuarioSalvo.id)) ||
            (u.nome && u.nome.toLowerCase() === nomeLocal.toLowerCase()) ||
            (u.usuario && u.usuario.toLowerCase() === nomeLocal.toLowerCase())
        );

        if (meuReg) {
          const novosMeusDados: PlayerStats = {
            nome: nomeLocal,
            avatar: meuReg.avatar || meuReg.foto || meusDadosRef.current.avatar,
            pontos: Number(meuReg.pontos ?? meuReg.pontuacao ?? 0),
            vitorias: Number(meuReg.vitorias ?? 0),
          };
          setMeusDados(novosMeusDados);
          socket.emit('webrtc_signal', {
            salaId,
            signal: { type: 'player_stats', stats: novosMeusDados }
          });
        }

        // Atualiza dados do adversário
        const advReg = lista.find(
          (u: any) =>
            (adversarioId && Number(u.id) === Number(adversarioId)) ||
            (u.nome && u.nome.toLowerCase() === adversarioNome.toLowerCase()) ||
            (u.usuario && u.usuario.toLowerCase() === adversarioNome.toLowerCase())
        );

        if (advReg) {
          setDadosAdversario(prev => ({
            nome: adversarioNome,
            avatar: advReg.avatar || advReg.foto || prev.avatar,
            pontos: Number(advReg.pontos ?? advReg.pontuacao ?? prev.pontos),
            vitorias: Number(advReg.vitorias ?? prev.vitorias),
          }));
        }
      })
      .catch(() => {});
  }, [adversarioId, adversarioNome, isPartidaLocalMesmoPC, nomeLocal, salaId, usuarioSalvo?.id]);

  // Temporizador de 4 segundos da tela inicial de VS
  useEffect(() => {
    if (!showVersus) return;

    const timer = setInterval(() => {
      setVersusCountdown(prev => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const hideTimeout = setTimeout(() => {
      setShowVersus(false);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(hideTimeout);
    };
  }, [showVersus]);

  const addLog = (msg: string) => {
    setGameLogs(prev => [...prev.slice(-4), msg]);
  };

  const lancarBola = (direcaoX: number) => {
    const angulo = (Math.random() * 0.8 - 0.4) * Math.PI;
    const velInicial = 8;
    return {
      x: 400,
      y: 225,
      dx: direcaoX * velInicial * Math.cos(angulo),
      dy: velInicial * Math.sin(angulo)
    };
  };

  const handleReady = () => {
    setIsReady(true);
    isReadyRef.current = true;
    if (tipoPartida !== 'OFFLINE') {
      socket.emit('webrtc_signal', {
        salaId,
        signal: { type: 'game_ready', stats: meusDadosRef.current }
      });
    }
  };

  useEffect(() => {
    const bothReady = tipoPartida === 'OFFLINE' ? isReady : (isReady && isAdversarioReady);

    if (bothReady && !gameStartedRef.current && countdown === null) {
      setShowVersus(false);
      setCountdown(3);
      let cont = 3;
      const interval = setInterval(() => {
        cont -= 1;
        if (cont > 0) {
          setCountdown(cont);
        } else if (cont === 0) {
          setCountdown('COMEÇOU!');
          if (isHost && tipoPartida !== 'OFFLINE') {
            socket.emit('iniciarFisica', { salaId });
          }
        } else {
          setCountdown(null);
          setGameStarted(true);
          gameStartedRef.current = true;
          clearInterval(interval);
        }
      }, 1000);
    }
  }, [isReady, isAdversarioReady, tipoPartida, countdown, isHost, salaId]);

  const finalizarPartidaOnline = (vencedorMsg: string, p1Score: number, p2Score: number, abandonoLocal: boolean = false) => {
    if (partidaFinalizadaRef.current) return;
    partidaFinalizadaRef.current = true;
    setVencedor(vencedorMsg);

    const meuPlacar = isHost ? p1Score : p2Score;
    const adversarioPlacar = isHost ? p2Score : p1Score;

    let isVitoria = meuPlacar > adversarioPlacar;
    let resultadoFinal = isVitoria ? 'VITORIA' : (meuPlacar === adversarioPlacar ? 'EMPATE' : 'DERROTA');

    if (abandonoLocal) {
      resultadoFinal = 'ABANDONO';
      isVitoria = false;
    }

    let pontos = 0;
    if (resultadoFinal === 'VITORIA') pontos = 30;
    else if (resultadoFinal === 'EMPATE') pontos = 15;
    else if (resultadoFinal === 'DERROTA') pontos = 5;
    else if (resultadoFinal === 'ABANDONO') pontos = -15;

    const historicoAtual = JSON.parse(localStorage.getItem('pong_historico') || '[]');
    const novaEntrada = {
      data: new Date().toLocaleDateString('pt-BR'),
      resultado: resultadoFinal,
      placar: `${meuPlacar} x ${adversarioPlacar} (${tipoPartida})`
    };
    localStorage.setItem('pong_historico', JSON.stringify([novaEntrada, ...historicoAtual].slice(0, 15)));

    if (usuarioSalvo?.id) {
      fetch(`${API_URL}/api/ranking/registrar-partida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogador_id: usuarioSalvo.id,
          adversario_nome: adversarioNome,
          pontuacao_jogador: meuPlacar,
          pontuacao_adversario: adversarioPlacar,
          resultado: resultadoFinal,
          tipo_partida: tipoPartida,
          pontos_ganhos: pontos
        })
      }).catch(err => console.error("Erro ao registrar partida online:", err));

      fetch(`${API_URL}/api/desafios/sincronizar-partida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogador_id: usuarioSalvo.id,
          vitoria: isVitoria,
          pontos: meuPlacar,
          tipo_partida: tipoPartida
        })
      }).catch(err => console.error("Erro ao sincronizar desafios:", err));
    }
  };

  const handleSair = () => {
    if (partidaFinalizadaRef.current) {
      navigate('/home');
      return;
    }

    const confirmacao = window.confirm("ATENÇÃO: Deseja realmente sair? Você perderá a partida e sofrerá penalidade nos seus pontos de ranking.");

    if (confirmacao) {
      socket.disconnect();
      finalizarPartidaOnline('VOCÊ DESISTIU (DERROTA)', isHost ? 0 : 10, isHost ? 10 : 0, true);
    }
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit('entrarSala', { salaId });

    // Envia as estatísticas locais para o oponente assim que entra na sala
    if (!isPartidaLocalMesmoPC) {
      setTimeout(() => {
        socket.emit('webrtc_signal', {
          salaId,
          signal: { type: 'player_stats', stats: meusDadosRef.current }
        });
      }, 600);
    }

    socket.on('adversarioMoveu', (dados: { y: number }) => {
      if (isHost) {
        game.current.p2Y = dados.y;
      } else {
        game.current.p1Y = dados.y;
      }
    });

    socket.on('bolaAtualizada', (novaBola: { x: number; y: number; dx: number; dy: number }) => {
      game.current.ball = novaBola;
    });

    socket.on('placarAtualizado', (novoPlacar: { esquerda: number; direita: number }) => {
      placarRef.current = { p1: novoPlacar.esquerda, p2: novoPlacar.direita };
      setPlacar({ p1: novoPlacar.esquerda, p2: novoPlacar.direita });
      addLog(`[Score] P1: ${novoPlacar.esquerda} | P2: ${novoPlacar.direita}`);

      if (novoPlacar.esquerda >= 10 || novoPlacar.direita >= 10) {
        const venceuP1 = novoPlacar.esquerda >= 10;
        const msg = venceuP1 ? 'PLAYER 1 VENCEU!' : 'PLAYER 2 VENCEU!';
        finalizarPartidaOnline(msg, novoPlacar.esquerda, novoPlacar.direita);
      }
    });

    socket.on('adversarioDesconectou', () => {
      addLog('[Socket] Opponent disconnected');
      if (!partidaFinalizadaRef.current) {
        alert('O oponente desconectou-se da partida.');
        finalizarPartidaOnline('VITÓRIA POR W.O. (OPONENTE DESISTIU)', isHost ? 10 : 0, isHost ? 0 : 10);
      }
    });

    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('pingCheck', () => {
        setLatency(Date.now() - start);
      });
    }, 2000);

    return () => {
      clearInterval(pingInterval);
      socket.off('adversarioMoveu');
      socket.off('bolaAtualizada');
      socket.off('placarAtualizado');
      socket.off('adversarioDesconectou');
    };
  }, [isHost, navigate, salaId, adversarioNome, tipoPartida, isPartidaLocalMesmoPC]);

  useEffect(() => {
    let landmarker: Vision.HandLandmarker;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let activeStream: MediaStream | null = null;

    // Listener de sinais para sincronizar "game_ready" e "player_stats" mesmo se a câmera estiver oculta
    const handleCustomSignals = (data: any) => {
      if (data?.type === 'player_stats' && data.stats) {
        setDadosAdversario(prev => ({
          nome: adversarioNome || data.stats.nome || prev.nome,
          avatar: data.stats.avatar || prev.avatar,
          pontos: Number(data.stats.pontos ?? prev.pontos),
          vitorias: Number(data.stats.vitorias ?? prev.vitorias),
        }));
      }
      if (data?.type === 'game_ready') {
        if (data.stats) {
          setDadosAdversario(prev => ({
            nome: adversarioNome || data.stats.nome || prev.nome,
            avatar: data.stats.avatar || prev.avatar,
            pontos: Number(data.stats.pontos ?? prev.pontos),
            vitorias: Number(data.stats.vitorias ?? prev.vitorias),
          }));
        }
        setIsAdversarioReady(true);
      }
    };

    socket.on('webrtc_signal', handleCustomSignals);

    const initVisionAndWebRTC = async () => {
      const vision = await Vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      landmarker = await Vision.HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480, max: 480 }, height: { ideal: 360, max: 360 }, frameRate: { ideal: 30, max: 30 } },
        audio: false
      });
      activeStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;

        if (tipoPartida !== 'OFFLINE' && !ocultarCameraAdversario) {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ]
          });
          peerConnectionRef.current = pc;

          stream.getTracks().forEach(track => {
            const sender = pc.addTrack(track, stream);
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            params.encodings[0].maxBitrate = 400000;
            params.degradationPreference = 'maintain-framerate';
            sender.setParameters(params).catch(e => console.error("Erro nos parâmetros WebRTC:", e));
          });

          pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch(e => console.error("Erro no play remoto:", e));
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('webrtc_signal', { salaId, signal: { type: 'ice', candidate: event.candidate } });
            }
          };

          socket.on('webrtc_signal', async (data) => {
            try {
              if (data.type === 'request_offer' && isHost) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtc_signal', { salaId, signal: { type: 'offer', offer } });
                return;
              }

              if (data.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc_signal', { salaId, signal: { type: 'answer', answer } });

                if (isReadyRef.current) {
                  socket.emit('webrtc_signal', {
                    salaId,
                    signal: { type: 'game_ready', stats: meusDadosRef.current }
                  });
                }
              } else if (data.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                if (isReadyRef.current) {
                  socket.emit('webrtc_signal', {
                    salaId,
                    signal: { type: 'game_ready', stats: meusDadosRef.current }
                  });
                }
              } else if (data.type === 'ice') {
                if (pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
              }
            } catch (err) {
              console.error("Erro no WebRTC:", err);
            }
          });

          if (!isHost) {
            setTimeout(() => {
              socket.emit('webrtc_signal', { salaId, signal: { type: 'request_offer' } });
            }, 1500);
          }
        }

        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current!.play();
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const drawingUtils = new Vision.DrawingUtils(ctx);

          const renderLoop = () => {
            const now = performance.now();
            frameCount++;
            if (now - lastTime >= 1000) {
              setFps(frameCount);
              frameCount = 0;
              lastTime = now;
            }

            if (localVideoRef.current && localVideoRef.current.readyState >= 2) {
              const results = landmarker.detectForVideo(localVideoRef.current, now);

              let handDetected = false;
              if (results.landmarks && results.landmarks.length > 0) {
                auditoriaGlobal.registrarFrame(results.landmarks[0]);

                const hand = results.landmarks[0];
                const palmY = hand[9] ? hand[9].y : hand[0].y;
                const sensibilidade = 1.6;
                let adjustedY = (palmY - 0.5) * sensibilidade + 0.5;
                adjustedY = Math.max(0.1, Math.min(0.9, adjustedY));

                const paddleY = adjustedY * 450 - 50;
                if (isHost) {
                  game.current.p1Y = paddleY;
                } else {
                  game.current.p2Y = paddleY;
                }
                handDetected = true;
                socket.emit('moverRaquete', { salaId, y: paddleY });
              }

              if (tipoPartida === 'OFFLINE' && !partidaFinalizadaRef.current && gameStartedRef.current) {
                game.current.ball.x += game.current.ball.dx;
                game.current.ball.y += game.current.ball.dy;

                if (game.current.ball.y <= 10) {
                  game.current.ball.y = 10;
                  game.current.ball.dy = Math.abs(game.current.ball.dy) * 1.02;
                  game.current.ball.dx += (Math.random() - 0.5) * 0.3;
                } else if (game.current.ball.y >= 440) {
                  game.current.ball.y = 440;
                  game.current.ball.dy = -Math.abs(game.current.ball.dy) * 1.02;
                  game.current.ball.dx += (Math.random() - 0.5) * 0.3;
                }

                const hitP1 = game.current.ball.x <= 75 && game.current.ball.x >= 45 && game.current.ball.y > game.current.p1Y && game.current.ball.y < game.current.p1Y + 100;
                const hitP2 = game.current.ball.x >= 725 && game.current.ball.x <= 755 && game.current.ball.y > game.current.p2Y && game.current.ball.y < game.current.p2Y + 100;

                if (hitP1) {
                  const bounceAngle = (Math.random() - 0.5) * (Math.PI / 2);
                  const currentSpeed = Math.min(Math.hypot(game.current.ball.dx, game.current.ball.dy) * 1.05, 30);
                  game.current.ball.dx = Math.abs(Math.cos(bounceAngle) * currentSpeed);
                  game.current.ball.dy = Math.sin(bounceAngle) * currentSpeed;
                  game.current.ball.x = 76;
                } else if (hitP2) {
                  const bounceAngle = (Math.random() - 0.5) * (Math.PI / 2);
                  const currentSpeed = Math.min(Math.hypot(game.current.ball.dx, game.current.ball.dy) * 1.05, 30);
                  game.current.ball.dx = -Math.abs(Math.cos(bounceAngle) * currentSpeed);
                  game.current.ball.dy = Math.sin(bounceAngle) * currentSpeed;
                  game.current.ball.x = 724;
                }

                if (game.current.ball.x < 0) {
                  const novoPlacar = { p1: placarRef.current.p1, p2: placarRef.current.p2 + 1 };
                  placarRef.current = novoPlacar;
                  setPlacar(novoPlacar);

                  if (novoPlacar.p2 >= 10) {
                    finalizarPartidaOnline('PLAYER 2 VENCEU!', novoPlacar.p1, novoPlacar.p2);
                  } else {
                    game.current.ball = lancarBola(1);
                  }
                } else if (game.current.ball.x > 800) {
                  const novoPlacar = { p1: placarRef.current.p1 + 1, p2: placarRef.current.p2 };
                  placarRef.current = novoPlacar;
                  setPlacar(novoPlacar);

                  if (novoPlacar.p1 >= 10) {
                    finalizarPartidaOnline('PLAYER 1 VENCEU!', novoPlacar.p1, novoPlacar.p2);
                  } else {
                    game.current.ball = lancarBola(-1);
                  }
                }
              }

              ctx.clearRect(0, 0, 800, 450);

              ctx.strokeStyle = "rgba(70, 130, 180, 0.45)";
              ctx.lineWidth = 2;
              ctx.setLineDash([8, 8]);
              ctx.beginPath();
              ctx.moveTo(400, 0);
              ctx.lineTo(400, 450);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(400, 225, 55, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = "rgba(70, 130, 180, 0.6)";
              ctx.beginPath();
              ctx.arc(400, 225, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.setLineDash([]);

              ctx.fillStyle = "rgba(0, 180, 255, 0.9)";
              ctx.font = "bold 16px 'Courier New', monospace";
              ctx.fillText(`PLAYER 1: ${placarRef.current.p1}`, 260, 40);
              ctx.fillStyle = "#fff";
              ctx.fillText("|", 395, 40);
              ctx.fillStyle = "rgba(46, 204, 113, 0.9)";
              ctx.fillText(`PLAYER 2: ${placarRef.current.p2}`, 420, 40);

              ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
              ctx.font = "11px 'Courier New', monospace";
              ctx.fillText("GOAL (P1)", 50, 405);
              ctx.fillText("GOAL (P2)", 690, 405);
              ctx.fillText("FIELD", 430, 370);

              ctx.strokeStyle = "#00d4ff";
              ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
              ctx.lineWidth = 3;
              ctx.strokeRect(55, game.current.p1Y, 20, 100);
              ctx.fillRect(55, game.current.p1Y, 20, 100);

              ctx.strokeStyle = "#2ecc71";
              ctx.fillStyle = "rgba(46, 204, 113, 0.25)";
              ctx.lineWidth = 3;
              ctx.strokeRect(725, game.current.p2Y, 20, 100);
              ctx.fillRect(725, game.current.p2Y, 20, 100);

              if (!partidaFinalizadaRef.current) {
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 15;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(game.current.ball.x, game.current.ball.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
              }

              if (showLandmarks && handDetected && results.landmarks) {
                for (const landmarksOriginal of results.landmarks) {
                  const landmarks = landmarksOriginal as Landmark[];
                  const hiddenMask = buildHiddenMask(landmarks, hiddenFingerCountersRef.current);

                  const mirroredLandmarks = landmarksOriginal.map(pt => {
                    const xEspelhado = 1 - pt.x;
                    const posX = isHost ? (xEspelhado * 0.5) : (0.5 + xEspelhado * 0.5);
                    return { ...pt, x: posX };
                  });

                  const conexoesValidas = Vision.HandLandmarker.HAND_CONNECTIONS.filter((connection) => {
                    const { start, end } = connection as { start: number; end: number };
                    return !hiddenMask[start] && !hiddenMask[end];
                  });

                  const pontosVisiveis = mirroredLandmarks.filter((_, index) => !hiddenMask[index]);

                  drawingUtils.drawConnectors(mirroredLandmarks as any, conexoesValidas as any, {
                    color: isHost ? '#00d4ff' : '#2ecc71',
                    lineWidth: 4
                  });
                  drawingUtils.drawLandmarks(pontosVisiveis as any, {
                    color: '#ffffff',
                    lineWidth: 1,
                    radius: 6
                  });
                }
              }
            }
            animationFrameId = requestAnimationFrame(renderLoop);
          };
          renderLoop();
        };
      }
    };

    initVisionAndWebRTC();

    return () => {
      cancelAnimationFrame(animationFrameId);
      landmarker?.close();

      socket.off('webrtc_signal');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const currentStream = localVideoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
        remoteStream.getTracks().forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [isHost, salaId, showLandmarks, tipoPartida, adversarioNome, ocultarCameraAdversario]);

  // Define quem aparece na Esquerda (Jogador 1 - Vermelho) e na Direita (Jogador 2 - Azul)
  const player1Stats: PlayerStats = isHost ? meusDados : dadosAdversario;
  const player2Stats: PlayerStats = isHost ? dadosAdversario : meusDados;

  const tituloModoVS =
    tipoPartida.toUpperCase() === 'AMISTOSO'
      ? 'AMISTOSO 1 vs 1'
      : '1 vs 1 ONLINE';

  const renderCameraOculta = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', borderRight: isHost ? '2px solid rgba(59, 130, 246, 0.5)' : 'none' }}>
      <span style={{ fontSize: '24px', marginBottom: '10px' }}>🕵️</span>
      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Câmera Oculta</div>
      <div style={{ fontSize: '11px', marginTop: '4px' }}>(Modo Anônimo Ativo)</div>
    </div>
  );

  return (
    <div style={{
      background: '#0a0d14',
      minHeight: '100vh',
      color: '#e2e8f0',
      fontFamily: "'Courier New', monospace, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#94a3b8', marginBottom: '8px' }}>
        {isHost ? 'PLAYER 1 (LOCAL)' : 'PLAYER 2 (LOCAL)'} | PARTIDA: {tipoPartida}
      </div>

      <div style={{
        position: 'relative',
        width: '900px',
        height: '450px',
        border: '2px solid #3b82f6',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#111',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
      }}>
        {/* ====================================================
            TELA DE CONFRONTO "VS" (ONLINE E AMISTOSO)
           ==================================================== */}
        {showVersus && !isPartidaLocalMesmoPC && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            userSelect: 'none'
          }}>
            {/* Lado Vermelho (Jogador 1) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 25% 50%, #ef4444 0%, #991b1b 65%, #450a0a 100%)',
              clipPath: 'polygon(0 0, 57% 0, 43% 100%, 0% 100%)',
              zIndex: 1
            }} />

            {/* Lado Azul (Jogador 2) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 75% 50%, #2563eb 0%, #1e3a8a 65%, #090d16 100%)',
              clipPath: 'polygon(57% 0, 100% 0, 100% 100%, 43% 100%)',
              zIndex: 1
            }} />

            {/* Feixe Diagonal Central */}
            <div style={{
              position: 'absolute',
              top: '-15%',
              bottom: '-15%',
              left: '50%',
              width: '5px',
              background: 'linear-gradient(to bottom, transparent, #fff, #f87171, #60a5fa, transparent)',
              transform: 'translateX(-50%) rotate(14deg)',
              boxShadow: '0 0 25px 6px rgba(255, 255, 255, 0.9)',
              zIndex: 2
            }} />

            {/* Topo: Modo da Partida */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              background: 'rgba(0, 0, 0, 0.72)',
              padding: '6px 24px',
              borderRadius: '999px',
              border: '2px solid rgba(251, 191, 36, 0.65)',
              marginBottom: '16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)'
            }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '3px', color: '#fbbf24' }}>
                {tituloModoVS}
              </span>
            </div>

            {/* Arena dos Cards */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '88%',
              maxWidth: '800px',
              gap: '16px'
            }}>
              {/* CARD JOGADOR 1 (ESQUERDA - VERMELHO) */}
              <div style={{
                flex: 1,
                maxWidth: '245px',
                background: 'rgba(69, 10, 10, 0.8)',
                border: '2px solid rgba(248, 113, 113, 0.6)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.65)'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1.5px', color: '#fca5a5', marginBottom: '8px' }}>
                  JOGADOR 1 {isHost ? '(VOCÊ)' : ''}
                </span>
                <div style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '3px solid #f87171',
                  boxShadow: '0 0 18px rgba(239, 68, 68, 0.6)',
                  marginBottom: '10px',
                  backgroundColor: '#1f2937'
                }}>
                  <img
                    src={player1Stats.avatar}
                    alt={player1Stats.nome}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 12px 0', color: '#fff', textAlign: 'center' }}>
                  {player1Stats.nome}
                </h3>
                <div style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>🏆 Pontos:</span>
                    <strong style={{ color: '#fbbf24' }}>{player1Stats.pontos}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>⚔️ Vitórias:</span>
                    <strong style={{ color: '#4ade80' }}>{player1Stats.vitorias}</strong>
                  </div>
                </div>
              </div>

              {/* CENTRO: VS */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '4.2rem',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: '#fff',
                  textShadow: '0 0 20px #ef4444, 0 0 40px #3b82f6, 0 5px 10px rgba(0,0,0,0.9)',
                  lineHeight: 1
                }}>
                  VS
                </div>
                <div style={{
                  marginTop: '10px',
                  background: 'rgba(0,0,0,0.85)',
                  padding: '5px 18px',
                  borderRadius: '8px',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  letterSpacing: '3px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  0 - 0
                </div>
                <div style={{
                  marginTop: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#fde047',
                  background: 'rgba(0,0,0,0.65)',
                  padding: '4px 12px',
                  borderRadius: '999px'
                }}>
                  Arena em {versusCountdown}s...
                </div>
              </div>

              {/* CARD JOGADOR 2 (DIREITA - AZUL) */}
              <div style={{
                flex: 1,
                maxWidth: '245px',
                background: 'rgba(15, 23, 42, 0.82)',
                border: '2px solid rgba(96, 165, 250, 0.6)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.65)'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1.5px', color: '#93c5fd', marginBottom: '8px' }}>
                  JOGADOR 2 {!isHost ? '(VOCÊ)' : ''}
                </span>
                <div style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '3px solid #60a5fa',
                  boxShadow: '0 0 18px rgba(59, 130, 246, 0.6)',
                  marginBottom: '10px',
                  backgroundColor: '#0f172a'
                }}>
                  <img
                    src={player2Stats.avatar}
                    alt={player2Stats.nome}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 12px 0', color: '#fff', textAlign: 'center' }}>
                  {player2Stats.nome}
                </h3>
                <div style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>🏆 Pontos:</span>
                    <strong style={{ color: '#fbbf24' }}>{player2Stats.pontos}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>⚔️ Vitórias:</span>
                    <strong style={{ color: '#4ade80' }}>{player2Stats.vitorias}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', top: 12, left: 15, zIndex: 10, border: '1px solid #00d4ff', padding: '3px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)', color: '#00d4ff' }}>
          {isHost ? `${nomeLocal} (P1)` : adversarioNome}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 15, zIndex: 10, border: '1px solid #2ecc71', padding: '3px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.6)', color: '#2ecc71' }}>
          {!isHost ? `${nomeLocal} (P2)` : adversarioNome}
        </div>

        {tipoPartida === 'ONLINE' && !ocultarCameraAdversario && (
          <button
            onClick={() => setShowDenunciaModal(true)}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 15,
              zIndex: 15,
              background: 'rgba(220, 38, 38, 0.85)',
              border: '1px solid #ef4444',
              color: '#fff',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚨 DENUNCIAR
          </button>
        )}

        <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', zIndex: 1 }}>
          <div style={{ width: '50%', height: '100%', borderRight: '2px solid rgba(59, 130, 246, 0.5)', position: 'relative' }}>
            {isHost ? (
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            ) : (
              ocultarCameraAdversario ? renderCameraOculta() : (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  {!remoteVideoRef.current?.srcObject && <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center', color: '#666', fontSize: '12px' }}>Aguardando P1...</div>}
                </>
              )
            )}
          </div>

          <div style={{ width: '50%', height: '100%', position: 'relative' }}>
            {!isHost ? (
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            ) : (
              ocultarCameraAdversario ? renderCameraOculta() : (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  {!remoteVideoRef.current?.srcObject && <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center', color: '#666', fontSize: '12px' }}>Aguardando P2...</div>}
                </>
              )
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}
        />

        {!gameStarted && !vencedor && !showVersus && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}>
            {countdown !== null ? (
              <h1 style={{ fontSize: '6rem', color: '#4ade80', textShadow: '0 0 20px #4ade80', margin: 0 }}>
                {countdown}
              </h1>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#fff', marginBottom: '20px', letterSpacing: '2px' }}>PREPARE-SE PARA A PARTIDA!</h2>
                <button
                  onClick={handleReady}
                  disabled={isReady}
                  style={{
                    background: isReady ? '#475569' : '#22c55e',
                    color: '#fff',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: isReady ? 'not-allowed' : 'pointer',
                    boxShadow: isReady ? 'none' : '0 0 15px rgba(34, 197, 94, 0.5)'
                  }}
                >
                  {isReady ? 'AGUARDANDO ADVERSÁRIO...' : 'ESTOU PRONTO!'}
                </button>
                {isAdversarioReady && !isReady && (
                  <p style={{ color: '#38bdf8', marginTop: '15px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                    O adversário já está pronto!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {vencedor && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30
          }}>
            <h2 style={{ fontSize: '2.2rem', color: '#38bdf8', marginBottom: '10px' }}>FIM DE PARTIDA!</h2>
            <p style={{ fontSize: '1.4rem', color: '#4ade80', fontWeight: 'bold', marginBottom: '25px', textAlign: 'center', padding: '0 20px' }}>
              {vencedor}
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              {tipoPartida === 'ONLINE' && (
                <button
                  onClick={() => navigate('/ranking')}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  VER RANKING
                </button>
              )}
              <button
                onClick={() => navigate('/home')}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                MENU PRINCIPAL
              </button>
            </div>
          </div>
        )}
      </div>

      {showDenunciaModal && (
        <Denuncia
          partidaId={salaId}
          denunciadoNome={adversarioNome}
          denunciadoId={adversarioId}
          onClose={() => setShowDenunciaModal(false)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', width: '900px', marginTop: '15px' }}>
        <div style={{ border: '1px solid #334155', borderRadius: '4px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            SOCKET.IO & STATE
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div>CONEXÃO: <span style={{ color: '#4ade80' }}>[ONLINE]</span> (Sala #{salaId})</div>
            <div>STATUS: <span style={{ color: '#4ade80' }}>[SINCRONIZADO]</span> ({fps} FPS, {latency}ms)</div>
            <div>VOCÊ: {isHost ? 'Player 1' : 'Player 2'}</div>
            <div>MODO: <span style={{ color: tipoPartida === 'ONLINE' ? '#38bdf8' : '#a855f7' }}>{tipoPartida}</span></div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
            <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>GAME EVENT LOG</div>
            {gameLogs.map((log, index) => (
              <div key={index} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log}</div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #334155', borderRadius: '4px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
            AR CONTROLS & SECURITY
          </div>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showLandmarks} onChange={(e) => setShowLandmarks(e.target.checked)} />
              <span>SHOW LANDMARKS (HAND TRACKING)</span>
            </label>
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#94a3b8' }}>
              <div>MODERAÇÃO AUTOMATIZADA:</div>
              <div>Telemetria Ativa {ocultarCameraAdversario && '(Vídeo P2P Bloqueado)'}</div>
              <div>{tipoPartida === 'ONLINE' && !ocultarCameraAdversario ? 'Denúncia Habilitada' : 'Denúncia Oculta (Modo Privado)'}</div>
            </div>

            <button
              onClick={handleSair}
              style={{
                marginTop: '6px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 'bold'
              }}
            >
              Sair da Partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;