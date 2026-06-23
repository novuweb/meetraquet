import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { getRango } from '../lib/ranks';
import { ubicacionKey } from '../lib/provincias';
import { DEMO_MODE } from '../lib/demo';
import { demoRanking } from '../lib/demoData';
import { PERFILES_FALSOS } from '../lib/perfilesFalsos';

export default function Ranking() {
  const { profile, user } = useAuth();
  const [filtroZona, setFiltroZona] = useState('global'); // 'global' | 'zona'
  const [filtroDeporte, setFiltroDeporte] = useState('todos'); // 'todos' | 'Pádel' | 'Tenis'
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, [filtroZona]);

  async function cargar() {
    setCargando(true);
    if (DEMO_MODE) {
      setTodos(demoRanking);
      setCargando(false);
      return;
    }

    let query = supabase.from('profiles').select('id, nombre, avatar_url, provincia, isla, puntos, deporte').eq('perfil_completo', true);

    if (filtroZona === 'zona') {
      const zona = ubicacionKey(profile.provincia, profile.isla);
      if (profile.isla) query = query.eq('isla', zona);
      else query = query.eq('provincia', zona).is('isla', null);
    }

    const { data } = await query;

    const falsosFiltrados = PERFILES_FALSOS.filter((f) => {
      if (filtroZona !== 'zona') return true;
      const zona = ubicacionKey(profile.provincia, profile.isla);
      return ubicacionKey(f.provincia, f.isla) === zona;
    });

    setTodos([...(data || []), ...falsosFiltrados]);
    setCargando(false);
  }

  const lista = todos
    .filter((j) => filtroDeporte === 'todos' || j.deporte === filtroDeporte || j.deporte === 'Ambos')
    .sort((a, b) => b.puntos - a.puntos)
    .map((j, i) => ({ ...j, posicion: i + 1 }));

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Ranking</h1>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        <button className={`chip ${filtroZona === 'global' ? 'selected' : ''}`} onClick={() => setFiltroZona('global')}>Global</button>
        <button className={`chip ${filtroZona === 'zona' ? 'selected' : ''}`} onClick={() => setFiltroZona('zona')}>
          Mi zona ({ubicacionKey(profile.provincia, profile.isla)})
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        <button className={`chip ${filtroDeporte === 'todos' ? 'selected' : ''}`} onClick={() => setFiltroDeporte('todos')}>Todos</button>
        <button className={`chip ${filtroDeporte === 'Pádel' ? 'selected' : ''}`} onClick={() => setFiltroDeporte('Pádel')}>Pádel</button>
        <button className={`chip ${filtroDeporte === 'Tenis' ? 'selected' : ''}`} onClick={() => setFiltroDeporte('Tenis')}>Tenis</button>
      </div>

      {lista.map((j) => {
        const rango = getRango(j.puntos);
        const esYo = j.id === user.id;
        return (
          <Link
            key={j.id}
            to={esYo ? '/perfil' : `/jugador/${j.id}`}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
              border: esYo ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              background: esYo ? 'var(--bg-elev)' : 'var(--bg-card)',
            }}
          >
            <span style={{ width: 28, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
              {j.posicion}
            </span>
            <div
              className="avatar"
              style={{
                width: 44, height: 44, flexShrink: 0,
                backgroundImage: j.avatar_url ? `url(${j.avatar_url})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}
            >
              {!j.avatar_url && j.nombre?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: esYo ? 800 : 600 }}>{j.nombre}{esYo && ' (tú)'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rango.nombre}</p>
            </div>
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{j.puntos} pts</span>
          </Link>
        );
      })}

      {lista.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay jugadores en esta categoría todavía.</p>
        </div>
      )}
    </div>
  );
}
