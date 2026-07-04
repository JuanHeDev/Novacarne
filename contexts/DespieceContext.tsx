import { createContext, useContext, useState, type ReactNode } from 'react';

export type CorteTara = {
  nombre: string;
  peso: number;
  cantidad: number;
};

export type Registro = {
  id: string;
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

export function DespieceProvider({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<Registro[]>([]);

  function agregarRegistro(registro: Registro) {
    setRegistros(prev => [...prev, registro]);
  }

  function actualizarRegistro(id: string, registro: Registro) {
    setRegistros(prev => prev.map(r => r.id === id ? { ...registro, id } : r));
  }

  function eliminarRegistro(id: string) {
    setRegistros(prev => prev.filter(r => r.id !== id));
  }

  function resetRegistros() {
    setRegistros([]);
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
