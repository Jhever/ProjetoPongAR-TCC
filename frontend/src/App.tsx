import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider } from './context/ConfigContext';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ModoJogo from './pages/ModoJogo';
import ProcurarPartida from './pages/ProcurarPartida';
import Informacoes from './pages/Informacoes';
import IniciarComAmigo from './pages/IniciarComAmigo';
import EsperarPartida from './pages/EsperarPartida';
import Ranking from './pages/Ranking';
import Suporte from './pages/Suporte';
import Configuracao from './pages/Configuracao';
import TestarCamera from './pages/TestarCamera';
import Game from './pages/Game';
import GameLocal from './pages/GameLocal';
import GameTreino from './pages/GameTreino';
import Desafios from './pages/Desafios';
import EsqueciSenha from './pages/EsqueciSenha';
import ResetPassword from './pages/ResetPassword';

// Componente auxiliar para monitorar a navegação e o tempo do F5
const RouteTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const agora = Date.now();
    
    // Rotas que não devem ser restauradas (ex: tela de login/registro)
    const rotasIgnoradas = ['/', '/register', '/esqueci-senha'];

    if (rotasIgnoradas.includes(location.pathname)) {
      // Se o usuário foi para o login ou registro, limpa o rastreamento anterior de vez!
      sessionStorage.removeItem('ultima_rota');
      sessionStorage.removeItem('rota_timestamp');
    } else {
      // Salva a rota atual e o timestamp atual nas outras telas
      sessionStorage.setItem('ultima_rota', location.pathname);
      sessionStorage.setItem('rota_timestamp', agora.toString());
    }
  }, [location]);

  useEffect(() => {
    // Executado apenas na primeira carga (F5 ou reabertura)
    const ultimaRota = sessionStorage.getItem('ultima_rota');
    const timestampSalvo = sessionStorage.getItem('rota_timestamp');

    if (ultimaRota && timestampSalvo) {
      const agora = Date.now();
      const tempoDecorrido = agora - parseInt(timestampSalvo, 10);
      const TEMPO_LIMITE = 5 * 60 * 1000; // 5 minutos

      if (tempoDecorrido < TEMPO_LIMITE) {
        // Se passou menos de 5 minutos e está na raiz, redireciona de volta para onde ele estava
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          navigate(ultimaRota);
        }
      } else {
        // Passou de 5 minutos, limpa o cache
        sessionStorage.removeItem('ultima_rota');
        sessionStorage.removeItem('rota_timestamp');
      }
    }
  }, [navigate]);

  return null;
};

function App() {
  return (
    <ConfigProvider>
      <Router>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          
          {/* MODOS DE JOGO */}
          <Route path="/modo-jogo" element={<ModoJogo />} />
          <Route path="/game-local" element={<GameLocal />} />
          <Route path="/procurar-partida" element={<ProcurarPartida />} />
          <Route path="/iniciar-com-amigo" element={<IniciarComAmigo />} />
          <Route path="/esperar-partida" element={<EsperarPartida />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game-treino" element={<GameTreino />} />
          
          {/* MENUS E UTILITÁRIOS */}
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/desafios" element={<Desafios />} />
          <Route path="/informacoes" element={<Informacoes />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/configuracao" element={<Configuracao />} />
          <Route path="/testar-camera" element={<TestarCamera />} />
          
          {/* AUTENTICAÇÃO */}
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;