import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { type ReactNode } from 'react';
import { ConfigProvider, useConfig } from './context/ConfigContext';
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

// Componente auxiliar para controle de tema (dark/light)
const AppContainer = ({ children }: { children: ReactNode }) => {
  const { isDark } = useConfig(); 
  
  return (
    <div style={{ 
      backgroundColor: isDark ? '#000' : '#F5F5F5',
      color: isDark ? '#FFF' : '#333',
      minHeight: '100vh', 
      width: '100vw',
      transition: 'background-color 0.3s ease'
    }}>
      {children}
    </div>
  );
};

function App() {
  return (
    <ConfigProvider>
      <Router>
        <AppContainer>
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
        </AppContainer>
      </Router>
    </ConfigProvider>
  );
}

export default App;