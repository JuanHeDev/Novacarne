import { createContext, useContext, useState, type ReactNode } from 'react';

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
  const [nuevoLoteActivo, setNuevoLoteActivo] = useState(false);
  const [canalCompletado, setCanalCompletado] = useState(false);
  const [despieceHabilitado, setDespieceHabilitado] = useState(false);
  const [despieceCompletado, setDespieceCompletado] = useState(false);
  const [despieceConDatos, setDespieceConDatos] = useState(false);

  function finalizarLote() {
    setNuevoLoteActivo(false);
    setCanalCompletado(false);
    setDespieceHabilitado(false);
    setDespieceCompletado(false);
    setDespieceConDatos(false);
  }

  function reiniciar() {
    setNuevoLoteActivo(true);
    setCanalCompletado(false);
    setDespieceHabilitado(false);
    setDespieceCompletado(false);
    setDespieceConDatos(false);
  }

  return (
    <EntradasContext.Provider value={{
      nuevoLoteActivo, canalCompletado, despieceHabilitado, despieceCompletado, despieceConDatos,
      setNuevoLoteActivo, setCanalCompletado, setDespieceHabilitado, setDespieceCompletado, setDespieceConDatos,
      finalizarLote, reiniciar,
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
