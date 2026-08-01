import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type EntradasState = {
  nuevoLoteActivo: boolean;
  canalCompletado: boolean;
  despieceHabilitado: boolean;
  despieceCompletado: boolean;
  despieceConDatos: boolean;
};

const estadoInicial: EntradasState = {
  nuevoLoteActivo: false,
  canalCompletado: false,
  despieceHabilitado: false,
  despieceCompletado: false,
  despieceConDatos: false,
};

type EntradasContextType = {
  nuevoLoteActivo: boolean;
  canalCompletado: boolean;
  despieceHabilitado: boolean;
  despieceCompletado: boolean;
  despieceConDatos: boolean;
  setNuevoLoteActivo: (v: boolean) => void;
  setCanalCompletado: (v: boolean) => void;
  setDespieceHabilitado: (v: boolean) => void;
  setDespieceCompletado: (v: boolean) => void;
  setDespieceConDatos: (v: boolean) => void;
  finalizarLote: () => void;
  reiniciar: () => void;
};

const EntradasContext = createContext<EntradasContextType | undefined>(undefined);

export function EntradasProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, EntradasState>>({});
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

  const state: EntradasState = userId ? sessions[userId] ?? estadoInicial : estadoInicial;

  const update = (patch: Partial<EntradasState>) => {
    if (!userId) return;
    setSessions(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? estadoInicial), ...patch },
    }));
  };

  function finalizarLote() {
    if (!userId) return;
    setSessions(prev => ({ ...prev, [userId]: { ...estadoInicial } }));
  }

  function reiniciar() {
    update({ nuevoLoteActivo: true, canalCompletado: false, despieceHabilitado: false, despieceCompletado: false, despieceConDatos: false });
  }

  return (
    <EntradasContext.Provider value={{
      nuevoLoteActivo: state.nuevoLoteActivo,
      canalCompletado: state.canalCompletado,
      despieceHabilitado: state.despieceHabilitado,
      despieceCompletado: state.despieceCompletado,
      despieceConDatos: state.despieceConDatos,
      setNuevoLoteActivo: (v) => update({ nuevoLoteActivo: v }),
      setCanalCompletado: (v) => update({ canalCompletado: v }),
      setDespieceHabilitado: (v) => update({ despieceHabilitado: v }),
      setDespieceCompletado: (v) => update({ despieceCompletado: v }),
      setDespieceConDatos: (v) => update({ despieceConDatos: v }),
      finalizarLote,
      reiniciar,
    }}>
      {children}
    </EntradasContext.Provider>
  );
}

export function useEntradas() {
  const ctx = useContext(EntradasContext);
  if (!ctx) throw new Error('useEntradas must be used within an EntradasProvider');
  return ctx;
}
