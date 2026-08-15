import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cargarEstado, guardarEstado } from '../lib/persistencia';
import { supabase } from '../lib/supabase';

export type CorteTara = {
  nombre: string;
  peso: number;
  cantidad: number;
};

export type Registro = {
  id: string;
  numCanal: number;
  categoria: string;
  corte: string;
  peso: number;
  tara?: CorteTara;
  pesoReal: number;
};

type DespieceContextType = {
  registros: Registro[];
  agregarRegistro: (registro: Registro) => void;
  actualizarRegistro: (id: string, registro: Registro) => void;
  eliminarRegistro: (id: string) => void;
  resetRegistros: () => void;
};

const DespieceContext = createContext<DespieceContextType | undefined>(undefined);

const CLAVE_PREFIJO = 'novacarne_despiece_';

export function DespieceProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, Registro[]>>({});
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
    cargarEstado<Registro[]>(CLAVE_PREFIJO + userId).then(persistido => {
      if (!activo || !persistido) return;
      setSessions(prev => ({ ...prev, [userId]: persistido }));
    });
    return () => {
      activo = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !listo) return;
    const actuales = sessions[userId];
    if (!actuales) return;
    guardarEstado(CLAVE_PREFIJO + userId, actuales);
  }, [sessions, userId, listo]);

  const registros: Registro[] = userId ? sessions[userId] ?? [] : [];

  function agregarRegistro(registro: Registro) {
    if (!userId) return;
    setSessions(prev => ({
      ...prev,
      [userId]: [...(prev[userId] ?? []), registro],
    }));
  }

  function actualizarRegistro(id: string, registro: Registro) {
    if (!userId) return;
    setSessions(prev => ({
      ...prev,
      [userId]: (prev[userId] ?? []).map(r => r.id === id ? { ...registro, id } : r),
    }));
  }

  function eliminarRegistro(id: string) {
    if (!userId) return;
    setSessions(prev => ({
      ...prev,
      [userId]: (prev[userId] ?? []).filter(r => r.id !== id),
    }));
  }

  function resetRegistros() {
    if (!userId) return;
    setSessions(prev => ({ ...prev, [userId]: [] }));
  }

  return (
    <DespieceContext.Provider value={{ registros, agregarRegistro, actualizarRegistro, eliminarRegistro, resetRegistros }}>
      {children}
    </DespieceContext.Provider>
  );
}

export function useDespiece() {
  const ctx = useContext(DespieceContext);
  if (!ctx) throw new Error('useDespiece must be used within a DespieceProvider');
  return ctx;
}
