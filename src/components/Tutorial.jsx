import { useState } from 'react';

const STORAGE_KEY = 'meetraquet_tutorial_visto';

const PASOS = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="5" /><circle cx="16" cy="16" r="5" />
      </svg>
    ),
    titulo: 'Partidos',
    texto: 'Aquí aparecen jugadores cerca de ti. Deslízalos a la derecha (o pulsa el botón verde) para desafiarlos, o a la izquierda para pasar.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    titulo: 'Mensajes',
    texto: 'Cuando desafíes a alguien se abre un chat aquí. Cuando termines un partido, pulsa "Finalizar" en el chat para reportar el resultado: tu rival deberá confirmarlo para que se sumen los puntos.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h16M7 19V11M12 19V5M17 19v-7" />
      </svg>
    ),
    titulo: 'Ranking',
    texto: 'Consulta tu posición global o en tu zona, y filtra por pádel o tenis. Toca cualquier jugador para ver su perfil completo.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
    titulo: 'Mapa',
    texto: 'Encuentra pistas de pádel y tenis cerca de ti, con filtro por deporte.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
      </svg>
    ),
    titulo: 'Tu perfil',
    texto: 'Edita tus datos, cambia tu ubicación, consulta tus logros y tu progreso de rango, y cambia el tema oscuro/claro cuando quieras.',
  },
];

export function tutorialYaVisto() {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export default function Tutorial({ onFinish }) {
  const [paso, setPaso] = useState(0);
  const ultimo = paso === PASOS.length - 1;
  const actual = PASOS[paso];

  function cerrar() {
    localStorage.setItem(STORAGE_KEY, '1');
    onFinish();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
        <div style={{ color: 'var(--accent)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{actual.icon}</div>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>{actual.titulo}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 22 }}>{actual.texto}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {PASOS.map((_, i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i === paso ? 'var(--accent)' : 'var(--border)',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={cerrar}>Saltar</button>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => (ultimo ? cerrar() : setPaso((p) => p + 1))}
          >
            {ultimo ? 'Empezar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
