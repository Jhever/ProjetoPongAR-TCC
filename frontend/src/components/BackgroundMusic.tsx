import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PLAYLIST = [
  '/musicas/Musica1.mp3',
  '/musicas/Musica2.mp3',
  '/musicas/Musica3.mp3',
  '/musicas/Musica4.mp3',
  '/musicas/Musica5.mp3',
  '/musicas/Musica6.mp3',
  '/musicas/Musica7.mp3',
  '/musicas/Musica8.mp3',
];

const VOLUME_MENU = 0.35; // 35% nos menus
const VOLUME_JOGO = 0.12; // 12% durante a partida
const ROTAS_JOGO = ['/game', '/game-treino', '/game-local'];

const sortearIndice = (atual?: number) => {
  if (PLAYLIST.length <= 1) return 0;
  let proximo = Math.floor(Math.random() * PLAYLIST.length);
  while (proximo === atual) {
    proximo = Math.floor(Math.random() * PLAYLIST.length);
  }
  return proximo;
};

const BackgroundMusic: React.FC = () => {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const trackIndexRef = useRef<number>(sortearIndice());

  const [mutado, setMutado] = useState<boolean>(
    () => localStorage.getItem('pong_musica_mutada') === 'true'
  );
  const [iniciado, setIniciado] = useState(false);

  const estaJogando = ROTAS_JOGO.includes(location.pathname);

  useEffect(() => {
    if (PLAYLIST.length === 0) return;

    const audio = new Audio(PLAYLIST[trackIndexRef.current]);
    audio.volume = estaJogando ? VOLUME_JOGO : VOLUME_MENU;
    audio.muted = mutado;
    audioRef.current = audio;

    // Quando uma música termina, sorteia a próxima sem repetir a atual
    const handleEnded = () => {
      const proximo = sortearIndice(trackIndexRef.current);
      trackIndexRef.current = proximo;
      audio.src = PLAYLIST[proximo];
      audio.play().catch(() => {});
    };

    audio.addEventListener('ended', handleEnded);

    // Inicia na primeira interação do usuário (regra de autoplay dos navegadores)
    const tentarIniciar = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          setIniciado(true);
          window.removeEventListener('click', tentarIniciar);
          window.removeEventListener('keydown', tentarIniciar);
          window.removeEventListener('touchstart', tentarIniciar);
        })
        .catch(() => {});
    };

    window.addEventListener('click', tentarIniciar);
    window.addEventListener('keydown', tentarIniciar);
    window.addEventListener('touchstart', tentarIniciar);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('click', tentarIniciar);
      window.removeEventListener('keydown', tentarIniciar);
      window.removeEventListener('touchstart', tentarIniciar);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Transição suave de volume ao entrar/sair da partida
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const alvo = estaJogando ? VOLUME_JOGO : VOLUME_MENU;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = window.setInterval(() => {
      if (!audioRef.current) return;
      const atual = audioRef.current.volume;
      const diff = alvo - atual;

      if (Math.abs(diff) < 0.01) {
        audioRef.current.volume = alvo;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      } else {
        audioRef.current.volume = Math.max(0, Math.min(1, atual + diff * 0.15));
      }
    }, 50);

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [estaJogando]);

  // Atualiza estado de mudo
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = mutado;
    }
    localStorage.setItem('pong_musica_mutada', String(mutado));
  }, [mutado]);

  const toggleMute = () => {
    const novoEstado = !mutado;
    setMutado(novoEstado);
    if (!novoEstado && audioRef.current && !iniciado) {
      audioRef.current
        .play()
        .then(() => setIniciado(true))
        .catch(() => {});
    }
  };

  return (
    <button
      onClick={toggleMute}
      title={mutado ? 'Ativar música de fundo' : 'Silenciar música de fundo'}
      aria-label={mutado ? 'Ativar música de fundo' : 'Silenciar música de fundo'}
      style={{
        position: 'fixed',
        bottom: '18px',
        right: '18px',
        zIndex: 9990,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        color: mutado ? '#94a3b8' : '#38bdf8',
        fontSize: '1.15rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        transition: 'transform 0.15s ease, border-color 0.2s ease',
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {mutado ? '🔇' : '🔊'}
    </button>
  );
};

export default BackgroundMusic;