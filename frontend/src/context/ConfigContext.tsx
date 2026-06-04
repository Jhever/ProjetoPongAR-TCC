import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
interface ConfigContextData {
  isDark: boolean;
  isAnonimo: boolean;
  userData: { id: string; usuario: string; email: string };
  toggleTheme: () => void;
  toggleAnonimo: () => void;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  // 1. O segredo está aqui: ao carregar, ele busca se existe algo salvo no "disco" do navegador
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('@PongAR:isDark');
    return savedTheme !== null ? JSON.parse(savedTheme) : true; // Se não tiver nada, começa no Dark (true)
  });

  const [isAnonimo, setIsAnonimo] = useState(() => {
    const savedAnonimo = localStorage.getItem('@PongAR:isAnonimo');
    return savedAnonimo !== null ? JSON.parse(savedAnonimo) : false;
  });

  // Dados fixos do seu perfil (conforme as imagens que você mandou)
  const userData = {
    id: "1234567",
    usuario: "ANONIMO",
    email: "alvesdasilvajheverson@gmail.com",
  };

  // 2. Sempre que você mudar o tema, esse código salva a nova escolha automaticamente
  useEffect(() => {
    localStorage.setItem('@PongAR:isDark', JSON.stringify(isDark));
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('@PongAR:isAnonimo', JSON.stringify(isAnonimo));
  }, [isAnonimo]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleAnonimo = () => setIsAnonimo(!isAnonimo);

  return (
    <ConfigContext.Provider value={{ isDark, isAnonimo, userData, toggleTheme, toggleAnonimo }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);