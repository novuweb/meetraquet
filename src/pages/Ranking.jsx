import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { getRango } from '../lib/ranks';
import { ubicacionKey } from '../lib/provincias';
import { DEMO_MODE } from '../lib/demo';
import { demoRanking } from '../lib/demoData';

export default function Ranking() {
  const { profile, user } = useAuth();
  const [filtro, setFiltro] = useState('global'); // 'global' | 'zona'
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, [filtro]);

  async function cargar() {
    setCargando(true);
    if (DEMO_MODE) {
      setLista(demoRanking);
      setCargando(false);
      return;
    }
    if (filtro === 'global') {
      const { data } = await supabase.from('ranking_global').select('*').order('posicion', { ascending: true });
      setLista(data || []);
    } else {
      const zona = ubicacionKey(profile.provincia, profile.isla);
      const { data } = await supabase.from('ranking_zona').select('*').eq('zona', zona).order('posicion_zona', { ascending: true });
      setLista((data || []).map((d) => ({ ...d, posicion: d.posicion_zona })));
    }
    setCargando(false);
  }

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Ranking</h1>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        <button className={`chip ${filtro === 'global' ? 'selected' : ''}`} onClick={() => setFiltro('global')}>Global</button>
        <button className={`chip ${filtro === 'zona' ? 'selected' : ''}`} onClick={() => setFiltro('zona')}>
          Mi zona ({ubicacionKey(profile.provincia, profile.isla)})
        </button>
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
    </div>
  );
}
