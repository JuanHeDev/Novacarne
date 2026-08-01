import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type PesoRegistro = {
  numCanal: number;
  peso: number;
  fecha: Date;
};

type CanalContextType = {
  registros: PesoRegistro[];
  agregarRegistros: (nuevos: PesoRegistro[]) => void;
  resetRegistros: () => void;
};

const CanalContext = createContext<CanalContextType | undefined>(undefined);

export function CanalProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, PesoRegistro[]>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const registros: PesoRegistro[] = userId ? sessions[userId] ?? [] : [];

  function agregarRegistros(nuevos: PesoRegistro[]) {
    if (!userId) return;
    setSessions(prev => ({
      ...prev,
      [userId]: [...(prev[userId] ?? []), ...nuevos],
    }));
  }

  function resetRegistros() {
    if (!userId) return;
    setSessions(prev => ({ ...prev, [userId]: [] }));
  }

  return (
    <CanalContext.Provider value={{ registros, agregarRegistros, resetRegistros }}>
      {children}
    </CanalContext.Provider>
  );
}

export function useCanal() {
  const ctx = useContext(CanalContext);
  if (!ctx) throw new Error('useCanal must be used within a CanalProvider');
  return ctx;
}
