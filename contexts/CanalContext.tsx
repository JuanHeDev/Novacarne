import { createContext, useContext, useState, type ReactNode } from 'react';

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
  const [registros, setRegistros] = useState<PesoRegistro[]>([]);

  function agregarRegistros(nuevos: PesoRegistro[]) {
    setRegistros(prev => [...prev, ...nuevos]);
  }

  function resetRegistros() {
    setRegistros([]);
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
