import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

interface UserData {
  id: string;
  usuario: string;
  email: string;
  senha?: string;
  currentPassword?: string;
}

interface ConfigContextData {
  isDark: boolean;
  isAnonimo: boolean;
  userData: UserData | null;
  toggleTheme: () => void;
  toggleAnonimo: () => void;
  updateUserData: (newData: UserData) => Promise<void>;
  loginUser: (user: string, senha: string) => Promise<boolean>;
  logoutUser: () => void; // Adicionado para limpar a sessão
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  // Inicializa estados lendo do localStorage
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isDark') !== 'false');
  const [isAnonimo, setIsAnonimo] = useState(() => localStorage.getItem('isAnonimo') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  
  const [userData, setUserData] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  // Efeitos para sincronizar com localStorage quando os estados mudarem
  useEffect(() => { localStorage.setItem('isDark', String(isDark)); }, [isDark]);
  useEffect(() => { localStorage.setItem('isAnonimo', String(isAnonimo)); }, [isAnonimo]);
  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('userData');
    }
  }, [userData]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleAnonimo = () => setIsAnonimo(!isAnonimo);

  const loginUser = async (email: string, senha: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data); // O useEffect acima salvará no localStorage automaticamente
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
      await fetch('http://localhost:3001/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      setUserData(newData);
    } catch (err) {
      console.error("Erro ao atualizar:", err);
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