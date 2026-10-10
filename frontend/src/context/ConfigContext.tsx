import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://projetopongar-tcc.onrender.com';

interface UserData {
  id: string;
  usuario: string;
  email: string;
  senha?: string;
  currentPassword?: string;
  foto?: string; // Adicionado suporte para o avatar / foto do usuário
}

interface ConfigContextData {
  isDark: boolean;
  isAnonimo: boolean;
  userData: UserData | null;
  toggleTheme: () => void;
  toggleAnonimo: () => void;
  updateUserData: (newData: UserData) => Promise<void>;
  loginUser: (user: string, senha: string) => Promise<boolean>;
  logoutUser: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isDark') !== 'false');
  const [isAnonimo, setIsAnonimo] = useState(() => localStorage.getItem('isAnonimo') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  
  const [userData, setUserData] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('usuario') || localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => { localStorage.setItem('isDark', String(isDark)); }, [isDark]);
  useEffect(() => { localStorage.setItem('isAnonimo', String(isAnonimo)); }, [isAnonimo]);
  
  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('usuario', JSON.stringify(userData)); // Alimenta as telas do jogo e ranking
    } else {
      localStorage.removeItem('userData');
      localStorage.removeItem('usuario');
    }
  }, [userData]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleAnonimo = () => setIsAnonimo(!isAnonimo);

  const loginUser = async (email: string, senha: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        localStorage.setItem('usuario', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erro no login:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    setUserData(null);
  };

  const updateUserData = async (newData: UserData) => {
    try {
      // Se houver alteração de foto, atualiza também no banco de dados via rota específica se necessário,
      // ou envia no update geral. Aqui mantemos a chamada de atualização de senha/dados:
      await fetch(`${API_URL}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });

      // Se a foto foi alterada, envia para a rota dedicada de foto no backend
      if (newData.foto !== undefined && userData?.id) {
        await fetch(`${API_URL}/api/usuario/${userData.id}/foto`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: newData.foto })
        });
      }

      setUserData(newData);
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      throw err;
    }
  };

  return (
    <ConfigContext.Provider value={{ 
      isDark, isAnonimo, userData, toggleTheme, 
      toggleAnonimo, updateUserData, loginUser, logoutUser,
      isLoading, setIsLoading 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);