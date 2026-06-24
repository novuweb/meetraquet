import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getRango } from '../lib/ranks';
import { LOGROS_DEF, getLogrosConseguidos } from '../lib/achievements';
import { ubicacionLabel } from '../lib/provincias';
import { DEMO_MODE } from '../lib/demo';
import { demoJugadores, demoRanking } from '../lib/demoData';
import { PERFILES_FALSOS } from '../lib/perfilesFalsos';
import LogroModal from '../components/LogroModal.jsx';

// Perfil público de otro jugador (solo lectura), accesible desde el chat o el ranking.
export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jugador, setJugador] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [logroSeleccionado, setLogroSeleccionado] = useState(null);

  useEffect(() => {
    cargar();
  }, [id]);

  async function cargar() {
    setCargando(true);
    if (DEMO_MODE) {
      const encontrado = demoJugadores.find((j) => j.id === id) || demoRanking.find((j) => j.id === id);
      setJugador(encontrado || null);
      setCargando(false);
      return;
    }
    if (typeof id === 'string' && id.startsWith('fake-')) {
      setJugador(PERFILES_FALSOS.find((f) => f.id === id) || null);
      setCargando(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setJugador(data);
    setCargando(false);
  }

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  if (!jugador) {
    return (
      <div className="page">
        <button onClick={() => navigate(-1)} style={{ fontSize: 20, marginBottom: 16 }}>←</button>
        <p style={{ color: 'var(--text-muted)' }}>No se ha encontrado este perfil.</p>
      </div>
    );
  }

  const rango = getRango(jugador.puntos || 0);
  const logrosConseguidos = getLogrosConseguidos(jugador);
  const idsConseguidos = logrosConseguidos.map((l) => l.id);

  return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{ fontSize: 20, marginBottom: 10 }}>←</button>

      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <div
          className="avatar"
          style={{
            width: 100, height: 100, margin: '0 auto 10px',
            backgroundImage: jugador.avatar_url ? `url(${jugador.avatar_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800,
          }}
        >
          {!jugador.avatar_url && jugador.nombre?.[0]?.toUpperCase()}
        </div>
        <h2 style={{ fontSize: 22 }}>{jugador.nombre}{jugador.edad ? `, ${jugador.edad}` : ''}</h2>
        {(jugador.provincia || jugador.isla) && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ubicacionLabel(jugador.provincia, jugador.isla)}</p>
        )}
        <p style={{ marginTop: 6, fontSize: 14 }}><strong>{rango.nombre}</strong> · {jugador.puntos || 0} pts</p>
      </div>

      {(jugador.deporte || jugador.nivel || jugador.descripcion) && (
        <div className="card" style={{ marginBottom: 18 }}>
          {jugador.deporte && <p style={{ marginBottom: 8 }}><strong>Deporte:</strong> {jugador.deporte}</p>}
          {jugador.nivel && <p style={{ marginBottom: 8 }}><strong>Nivel:</strong> {jugador.nivel}</p>}
          {jugador.descripcion && <p><strong>Descripción:</strong> {jugador.descripcion}</p>}
        </div>
      )}

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center', marginBottom: 18 }}>
        <Stat label="Partidos" value={jugador.partidos_jugados || 0} />
        <Stat label="Victorias" value={jugador.victorias || 0} />
        <Stat label="Derrotas" value={jugador.derrotas || 0} />
        <Stat label="Racha" value={jugador.racha_actual || 0} />
      </div>

      {(jugador.valoraciones_recibidas || 0) > 0 && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', textAlign: 'center', marginBottom: 18 }}>
          <Stat label="⭐ Deportividad" value={jugador.deportividad_media} />
          <Stat label="⏱️ Puntualidad" value={jugador.puntualidad_media} />
        </div>
      )}

      <h3 style={{ fontSize: 16, marginBottom: 10 }}>Logros</h3>
      <div className="chip-row">
        {LOGROS_DEF.map((l) => (
          <button key={l.id} className={`badge ${idsConseguidos.includes(l.id) ? '' : 'locked'}`} onClick={() => setLogroSeleccionado(l)}>
            {l.icono} {l.nombre}
          </button>
        ))}
      </div>

      <LogroModal
        logro={logroSeleccionado}
        conseguido={logroSeleccionado ? idsConseguidos.includes(logroSeleccionado.id) : false}
        onClose={() => setLogroSeleccionado(null)}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 800 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}
