import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cargarEstado, guardarEstado } from '../lib/persistencia';
import { supabase } from '../lib/supabase';

export type PesoRegistro = {
  numCanal: number;
  peso: number;
  fecha: Date;
};

type PesoRegistroSerializable = Omit<PesoRegistro, 'fecha'> & { fecha: string };

type CanalContextType = {
  registros: PesoRegistro[];
  agregarRegistros: (nuevos: PesoRegistro[]) => void;
  resetRegistros: () => void;
};

const CanalContext = createContext<CanalContextType | undefined>(undefined);

const CLAVE_PREFIJO = 'novacarne_canal_';

function serializar(registros: PesoRegistro[]): PesoRegistroSerializable[] {
  return registros.map(r => ({ numCanal: r.numCanal, peso: r.peso, fecha: r.fecha.toISOString() }));
}

function deserializar(registros: PesoRegistroSerializable[]): PesoRegistro[] {
  return registros.map(r => ({ numCanal: r.numCanal, peso: r.peso, fecha: new Date(r.fecha) }));
}

export function CanalProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, PesoRegistro[]>>({});
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
    cargarEstado<PesoRegistroSerializable[]>(CLAVE_PREFIJO + userId).then(persistido => {
      if (!activo || !persistido) return;
      setSessions(prev => ({ ...prev, [userId]: deserializar(persistido) }));
    });
    return () => {
      activo = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !listo) return;
    const actuales = sessions[userId];
    if (!actuales) return;
    guardarEstado(CLAVE_PREFIJO + userId, serializar(actuales));
  }, [sessions, userId, listo]);

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
