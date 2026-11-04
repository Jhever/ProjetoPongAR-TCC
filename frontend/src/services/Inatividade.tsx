import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInactivityProps {
  onTimeout: () => void;
  timeoutMs?: number; // Tempo total para derrota (ex: 15000ms)
  warningMs?: number; // Tempo para mostrar aviso (ex: 10000ms)
}

export const useInactivity = ({ 
  onTimeout, 
  timeoutMs = 15000, 
  warningMs = 10000 
}: UseInactivityProps) => {
  const [isWarning, setIsWarning] = useState(false);
  
  // Alterado de NodeJS.Timeout para ReturnType<typeof setTimeout> (funciona perfeitamente no navegador)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função que deve ser chamada sempre que o jogador se mover ou a câmera detectar ação
  const resetTimer = useCallback(() => {
    setIsWarning(false);

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Dispara o aviso de que está parado
    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
    }, warningMs);

    // Dispara a derrota por inatividade
    inactivityTimerRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [onTimeout, timeoutMs, warningMs]);

  // Inicia o timer assim que o componente monta
  useEffect(() => {
    resetTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [resetTimer]);

  return { isWarning, resetTimer };
};