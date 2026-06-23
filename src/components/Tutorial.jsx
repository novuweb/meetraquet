import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const storageKey = (uid) => `meetraquet_tutorial_visto_${uid || 'anon'}`;

const PASOS = [
  {
    to: '/',
    titulo: 'Partidos',
    texto: 'Aquí aparecen jugadores cerca de ti. Deslízalos a la derecha (o pulsa el botón verde) para desafiarlos, o a la izquierda para pasar.',
  },
  {
    to: '/mensajes',
    titulo: 'Mensajes',
    texto: 'Cuando desafíes a alguien se abre un chat aquí. Cuando termines un partido, pulsa "Finalizar" para reportar el resultado: tu rival deberá confirmarlo para que se sumen los puntos.',
  },
  {
    to: '/ranking',
    titulo: 'Ranking',
    texto: 'Consulta tu posición global o en tu zona, y filtra por pádel o tenis. Toca cualquier jugador para ver su perfil completo.',
  },
  {
    to: '/mapa',
    titulo: 'Mapa',
    texto: 'Encuentra pistas de pádel y tenis cerca de ti, con filtro por deporte.',
  },
  {
    to: '/perfil',
    titulo: 'Tu perfil',
    texto: 'Edita tus datos, cambia tu ubicación, consulta tus logros y tu progreso de rango, y cambia el tema oscuro/claro cuando quieras.',
  },
];

export function tutorialYaVisto(uid) {
  return localStorage.getItem(storageKey(uid)) === '1';
}

export function marcarTutorialVisto(uid) {
  localStorage.setItem(storageKey(uid), '1');
}

export default function Tutorial({ uid, onFinish }) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState(null);
  const navigate = useNavigate();
  const ultimo = paso === PASOS.length - 1;
  const actual = PASOS[paso];

  useEffect(() => {
    navigate(actual.to);
  }, [paso]);

  useLayoutEffect(() => {
    const medir = () => {
      const el = document.querySelectorAll('.bottom-nav a')[paso];
      if (el) setRect(el.getBoundingClientRect());
    };
    const t = setTimeout(medir, 80);
    window.addEventListener('resize', medir);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', medir);
    };
  }, [paso]);

  function cerrar() {
    marcarTutorialVisto(uid);
    onFinish();
  }

  const tooltipArriba = rect && rect.top > window.innerHeight / 2;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000 }}>
      {rect && (
        <div
          style={{
            position: 'fixed',
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,.75)',
            border: '2px solid var(--accent)',
            pointerEvents: 'none',
            transition: 'left .35s ease, top .35s ease, width .35s ease, height .35s ease',
          }}
        />
      )}
      {!rect && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)' }} />}

      <div
        className="card"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          ...(rect
            ? tooltipArriba
              ? { bottom: window.innerHeight - rect.top + 16 }
              : { top: rect.bottom + 16 }
            : { top: '50%', marginTop: -90 }),
          maxWidth: 320,
          width: '88%',
          textAlign: 'center',
          transition: 'top .35s ease, bottom .35s ease',
        }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>{actual.titulo}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>{actual.texto}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
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
