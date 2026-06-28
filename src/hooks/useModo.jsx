import { createContext, useContext, useState } from 'react';

const ModoCtx = createContext(null);

export const MODO_LABELS = {
  tenis_1v1: 'Tenis Individual',
  tenis_dobles: 'Tenis Dobles',
  padel: 'Padel',
};

export function ModoProvider({ children }) {
  const [modo, setModo] = useState(() => localStorage.getItem('mr_modo') || null);
  const [subModo, setSubModo] = useState(() => localStorage.getItem('mr_submodo') || 'rival');

  function cambiarModo(m) {
    setModo(m);
    localStorage.setItem('mr_modo', m);
  }
  function cambiarSubModo(s) {
    setSubModo(s);
    localStorage.setItem('mr_submodo', s);
  }

  return (
    <ModoCtx.Provider value={{ modo, subModo, cambiarModo, cambiarSubModo }}>
      {children}
    </ModoCtx.Provider>
  );
}

export function useModo() {
  return useContext(ModoCtx);
}
