import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const VOLUME_MENU = 0.25; // Volume nos menus
const VOLUME_JOGO = 0.08; // Volume reduzido durante a partida
const ROTAS_JOGO = ['/game', '/game-treino', '/game-local'];

// Progressão Synthwave (Am - F - C - G) em 32 passos (colcheias)
const ARP_NOTES = [
  // Am
  220.0, 261.63, 329.63, 440.0, 329.63, 261.63, 329.63, 440.0,
  // F
  174.61, 220.0, 261.63, 349.23, 261.63, 220.0, 261.63, 349.23,
  // C
  261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 392.0, 523.25,
  // G
  196.0, 246.94, 293.66, 392.0, 293.66, 246.94, 293.66, 392.0,
];

const BASS_NOTES = [
  110.0, // Am (passos 0..7)
  87.31, // F  (passos 8..15)
  130.81, // C (passos 16..23)
  98.0,  // G  (passos 24..31)
];

const BackgroundMusic: React.FC = () => {
  const location = useLocation();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);

  const [mutado, setMutado] = useState<boolean>(
    () => localStorage.getItem('pong_musica_mutada') === 'true'
  );
  const [iniciado, setIniciado] = useState(false);

  const estaJogando = ROTAS_JOGO.includes(location.pathname);

  const getTargetVolume = (isMuted: boolean, inGame: boolean) => {
    if (isMuted) return 0;
    return inGame ? VOLUME_JOGO : VOLUME_MENU;
  };

  // Toca um passo da melodia (arpejo + baixo + batida suave)
  const playStep = () => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const step = stepRef.current % 32;

    // 1. Arpejo Synthwave (onda triangle filtrada para ficar suave)
    const arpOsc = ctx.createOscillator();
    const arpGain = ctx.createGain();
    const arpFilter = ctx.createBiquadFilter();

    arpOsc.type = 'triangle';
    arpOsc.frequency.setValueAtTime(ARP_NOTES[step], now);

    arpFilter.type = 'lowpass';
    arpFilter.frequency.setValueAtTime(1400, now);

    arpGain.gain.setValueAtTime(0.001, now);
    arpGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    arpOsc.connect(arpFilter);
    arpFilter.connect(arpGain);
    arpGain.connect(master);

    arpOsc.start(now);
    arpOsc.stop(now + 0.26);

    // 2. Baixo quente a cada 2 passos
    if (step % 2 === 0) {
      const chordIdx = Math.floor(step / 8);
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(BASS_NOTES[chordIdx], now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(320, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);

      bassOsc.start(now);
      bassOsc.stop(now + 0.5);
    }

    // 3. Kick/pulso discreto a cada 4 passos
    if (step % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(120, now);
      kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      kickGain.gain.setValueAtTime(0.25, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      kickOsc.connect(kickGain);
      kickGain.connect(master);

      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    stepRef.current = (step + 1) % 32;
  };

  const iniciarAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const master = ctx.createGain();
      master.gain.setValueAtTime(getTargetVolume(mutado, estaJogando), ctx.currentTime);
      master.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (!timerRef.current) {
      // ~112 BPM (268ms por colcheia)
      timerRef.current = window.setInterval(playStep, 268);
    }

    setIniciado(true);
  };

  // Inicia automaticamente na primeira interação do usuário
  useEffect(() => {
    const handleFirstInteraction = () => {
      iniciarAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Transição suave de volume ao trocar de rota ou mutar/desmutar
  useEffect(() => {
    localStorage.setItem('pong_musica_mutada', String(mutado));

    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const alvo = getTargetVolume(mutado, estaJogando);
    master.gain.setTargetAtTime(alvo, ctx.currentTime, 0.25);
  }, [mutado, estaJogando]);

  const toggleMute = () => {
    const novoEstado = !mutado;
    setMutado(novoEstado);
    if (!novoEstado && !iniciado) {
      iniciarAudio();
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