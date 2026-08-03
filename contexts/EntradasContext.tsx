import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cargarEstado, guardarEstado } from '../lib/persistencia';
import { supabase } from '../lib/supabase';

export type PersonaCarga = {
  nombre: string;
  peso: number;
};

type EntradasState = {
  nuevoLoteActivo: boolean;
  canalCompletado: boolean;
  despieceHabilitado: boolean;
  despieceCompletado: boolean;
  despieceConDatos: boolean;
  cantidadCanales: number;
  personasCarga: PersonaCarga[];
};

const estadoInicial: EntradasState = {
  nuevoLoteActivo: false,
  canalCompletado: false,
  despieceHabilitado: false,
  despieceCompletado: false,
  despieceConDatos: false,
  cantidadCanales: 0,
  personasCarga: [],
};

type EntradasContextType = {
  nuevoLoteActivo: boolean;
  canalCompletado: boolean;
  despieceHabilitado: boolean;
  despieceCompletado: boolean;
  despieceConDatos: boolean;
  cantidadCanales: number;
  personasCarga: PersonaCarga[];
  setNuevoLoteActivo: (v: boolean) => void;
  setCanalCompletado: (v: boolean) => void;
  setDespieceHabilitado: (v: boolean) => void;
  setDespieceCompletado: (v: boolean) => void;
  setDespieceConDatos: (v: boolean) => void;
  setCantidadCanales: (v: number) => void;
  setPersonasCarga: (v: PersonaCarga[]) => void;
  finalizarLote: () => void;
  reiniciar: () => void;
};

const EntradasContext = createContext<EntradasContextType | undefined>(undefined);

const CLAVE_PREFIJO = 'novacarne_entradas_';

export function EntradasProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, EntradasState>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setListo(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let activo = true;
    cargarEstado<EntradasState>(CLAVE_PREFIJO + userId).then(persistido => {
      if (!activo || !persistido) return;
      setSessions(prev => ({ ...prev, [userId]: persistido }));
    });
    return () => {
      activo = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !listo) return;
    const estadoActual = sessions[userId];
    if (!estadoActual) return;
    guardarEstado(CLAVE_PREFIJO + userId, estadoActual);
  }, [sessions, userId, listo]);

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
    update({ nuevoLoteActivo: true, canalCompletado: false, despieceHabilitado: false, despieceCompletado: false, despieceConDatos: false, cantidadCanales: 0, personasCarga: [] });
  }

  return (
    <EntradasContext.Provider value={{
      nuevoLoteActivo: state.nuevoLoteActivo,
      canalCompletado: state.canalCompletado,
      despieceHabilitado: state.despieceHabilitado,
      despieceCompletado: state.despieceCompletado,
      despieceConDatos: state.despieceConDatos,
      cantidadCanales: state.cantidadCanales,
      personasCarga: state.personasCarga,
      setNuevoLoteActivo: (v) => update({ nuevoLoteActivo: v }),
      setCanalCompletado: (v) => update({ canalCompletado: v }),
      setDespieceHabilitado: (v) => update({ despieceHabilitado: v }),
      setDespieceCompletado: (v) => update({ despieceCompletado: v }),
      setDespieceConDatos: (v) => update({ despieceConDatos: v }),
      setCantidadCanales: (v) => update({ cantidadCanales: v }),
      setPersonasCarga: (v) => update({ personasCarga: v }),
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
