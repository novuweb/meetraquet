import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DEMO_MODE } from '../lib/demo';
import { getModo } from '../lib/modos';

export default function HistorialPartidos({ profile, userId }) {
  const [partidos, setPartidos] = useState([]);
  const [rivales, setRivales] = useState({});
  const [cargando, setCargando] = useState(true);
  const [rivalAbierto, setRivalAbierto] = useState(null);

  useEffect(() => {
    if (DEMO_MODE || !userId) {
      setCargando(false);
      return;
    }
    cargar();
  }, [userId]);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from('partidos')
      .select('*')
      .or(`ganador_id.eq.${userId},perdedor_id.eq.${userId}`)
      .eq('estado', 'confirmado')
      .order('created_at', { ascending: false });

    const lista = data || [];
    setPartidos(lista);

    const rivalIds = [...new Set(lista.map((p) => (p.ganador_id === userId ? p.perdedor_id : p.ganador_id)))];
    if (rivalIds.length > 0) {
      const { data: perfiles } = await supabase.from('profiles').select('id, nombre, avatar_url').in('id', rivalIds);
      const dict = {};
      (perfiles || []).forEach((p) => { dict[p.id] = p; });
      setRivales(dict);
    }
    setCargando(false);
  }

  if (DEMO_MODE) return null;
  if (cargando) return null;
  if (partidos.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 18, textAlign: 'center' }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Historial de partidos</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Todavía no tienes partidos confirmados.</p>
      </div>
    );
  }

  const pct = profile.partidos_jugados > 0 ? Math.round((profile.victorias / profile.partidos_jugados) * 100) : 0;

  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 16, marginBottom: 10 }}>Historial de partidos</h3>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center', marginBottom: 12 }}>
        <div><p style={{ fontSize: 18, fontWeight: 800 }}>{profile.partidos_jugados}</p><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jugados</p></div>
        <div><p style={{ fontSize: 18, fontWeight: 800 }}>{pct}%</p><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Victorias</p></div>
        <div><p style={{ fontSize: 18, fontWeight: 800 }}>{profile.racha_actual}</p><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Racha actual</p></div>
      </div>

      {partidos.map((p) => {
        const ganeYo = p.ganador_id === userId;
        const rivalId = ganeYo ? p.perdedor_id : p.ganador_id;
        const rival = rivales[rivalId];
        const h2h = partidos.filter((x) => (x.ganador_id === rivalId || x.perdedor_id === rivalId) && (x.ganador_id === userId || x.perdedor_id === userId) && [x.ganador_id, x.perdedor_id].includes(rivalId));
        const victoriasH2H = h2h.filter((x) => x.ganador_id === userId).length;
        const abierto = rivalAbierto === rivalId;

        return (
          <div key={p.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="avatar"
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  backgroundImage: rival?.avatar_url ? `url(${rival.avatar_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                }}
              >
                {!rival?.avatar_url && rival?.nombre?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{rival?.nombre || 'Jugador'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {getModo(p.modo).icono} {getModo(p.modo).label} · {new Date(p.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              <span style={{ fontWeight: 800, color: ganeYo ? 'var(--accent)' : '#EF4444' }}>
                {ganeYo ? 'Victoria' : 'Derrota'}
              </span>
            </div>
            <p style={{ fontSize: 14, marginTop: 8 }}><strong>Marcador:</strong> {p.resultado}</p>

            {h2h.length > 1 && (
              <button
                style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}
                onClick={() => setRivalAbierto(abierto ? null : rivalId)}
              >
                {abierto ? 'Ocultar' : 'Ver'} historial contra {rival?.nombre || 'este rival'} ({victoriasH2H}-{h2h.length - victoriasH2H})
              </button>
            )}
            {abierto && (
              <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {h2h.map((x) => (
                  <p key={x.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(x.created_at).toLocaleDateString('es-ES')} — {x.ganador_id === userId ? '✅ Ganaste' : '❌ Perdiste'} ({x.resultado})
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
