import { createContext, useContext, useState } from 'react';

const ModoCtx = createContext(null);

export const MODO_LABELS = {
  tenis_individual: 'Tenis Individual',
  tenis_dobles_pareja: 'Tenis Dobles — Busco pareja',
  tenis_dobles_rival: 'Tenis Dobles — Tengo pareja',
  padel_individual: 'Padel Individual',
  padel_dobles_pareja: 'Padel — Busco pareja',
  padel_dobles_rival: 'Padel — Tengo pareja',
};

export function esModoTengoPareja(modo) {
  return typeof modo === 'string' && modo.endsWith('_rival');
}

export function ModoProvider({ children }) {
  const [modo, setModo] = useState(() => localStorage.getItem('mr_modo') || null);

  function cambiarModo(m) {
    setModo(m);
    if (m) localStorage.setItem('mr_modo', m);
    else localStorage.removeItem('mr_modo');
  }

  return (
    <ModoCtx.Provider value={{ modo, cambiarModo }}>
      {children}
    </ModoCtx.Provider>
  );
}

export function useModo() {
  return useContext(ModoCtx);
}
