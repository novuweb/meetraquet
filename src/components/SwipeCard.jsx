import { useRef, useState } from 'react';
import { getRango } from '../lib/ranks';
import { getLogrosDestacados } from '../lib/achievements';
import { ubicacionLabel } from '../lib/provincias';

// Carta estilo Tinder con soporte de gestos táctiles (swipe) y botones.
export default function SwipeCard({ jugador, onPasar, onDesafiar, esTop }) {
  const [drag, setDrag] = useState({ x: 0, active: false });
  const startX = useRef(0);

  const rango = getRango(jugador.puntos);
  const logros = getLogrosDestacados(jugador, 3);

  function handleStart(clientX) {
    if (!esTop) return;
    startX.current = clientX;
    setDrag({ x: 0, active: true });
  }
  function handleMove(clientX) {
    if (!drag.active) return;
    setDrag({ x: clientX - startX.current, active: true });
  }
  function handleEnd() {
    if (!drag.active) return;
    if (drag.x > 110) onDesafiar();
    else if (drag.x < -110) onPasar();
    setDrag({ x: 0, active: false });
  }

  const rotacion = drag.x / 18;
  const opacidadLike = Math.min(Math.max(drag.x / 110, 0), 1);
  const opacidadNope = Math.min(Math.max(-drag.x / 110, 0), 1);

  return (
    <div
      className="card"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={() => drag.active && handleEnd()}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      style={{
        position: 'absolute',
        inset: 0,
        padding: 0,
        overflow: 'hidden',
        transform: `translateX(${drag.x}px) rotate(${rotacion}deg)`,
        transition: drag.active ? 'none' : 'transform .3s ease',
        userSelect: 'none',
        cursor: esTop ? 'grab' : 'default',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: jugador.avatar_url ? `url(${jugador.avatar_url})` : 'none',
        backgroundColor: 'var(--bg-elev)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
      }}>
        {!jugador.avatar_url && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 64, fontWeight: 800, color: 'var(--text-muted)' }}>
            {jugador.nombre?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.2) 45%, transparent 70%)' }} />

      <div style={{ position: 'absolute', top: 18, left: 18, fontSize: 60, fontWeight: 800, color: '#22C55E', opacity: opacidadLike, transform: 'rotate(-12deg)', border: '4px solid #22C55E', borderRadius: 12, padding: '0 10px' }}>
        RETO
      </div>
      <div style={{ position: 'absolute', top: 18, right: 18, fontSize: 60, fontWeight: 800, color: '#EF4444', opacity: opacidadNope, transform: 'rotate(12deg)', border: '4px solid #EF4444', borderRadius: 12, padding: '0 10px' }}>
        PASO
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {logros.map((l) => (
            <span key={l.id} className="badge" style={{ background: 'rgba(255,255,255,.15)', borderColor: 'rgba(255,255,255,.25)', color: '#fff' }}>
              {l.icono} {l.nombre}
            </span>
          ))}
        </div>

        <h2 style={{ fontSize: 30, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          {jugador.nombre}, {jugador.edad}
          <span className="badge" style={{ background: 'rgba(255,255,255,.15)', borderColor: 'rgba(255,255,255,.25)', color: '#fff', fontSize: 11 }}>
            {rango.nombre}
          </span>
        </h2>
        <p style={{ fontSize: 14, opacity: .9, marginTop: 4 }}>
          {jugador.deporte} · {jugador.nivel} · {ubicacionLabel(jugador.provincia, jugador.isla)}
        </p>
        {jugador.descripcion && (
          <p style={{ fontSize: 14, marginTop: 10, opacity: .85, lineHeight: 1.5 }}>{jugador.descripcion}</p>
        )}
      </div>
    </div>
  );
}
