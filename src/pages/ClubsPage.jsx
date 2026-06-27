import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const FILTERS = ['Todos', 'Pádel', 'Tenis'];

function getSportBadge(tags) {
  const sport = (tags?.sport || '').toLowerCase();
  const name = (tags?.name || '').toLowerCase();
  const isPadel = sport.includes('padel') || sport.includes('pádel') || name.includes('padel') || name.includes('pádel');
  const isTenis = sport.includes('tennis') || sport.includes('tenis') || name.includes('tenis') || name.includes('tennis');
  if (isPadel && isTenis) return 'Ambos';
  if (isPadel) return 'Pádel';
  if (isTenis) return 'Tenis';
  return 'Deportivo';
}

function sportColor(sport) {
  if (sport === 'Pádel')    return { bg: 'rgba(37,99,235,.15)',   color: '#2563EB' };
  if (sport === 'Tenis')    return { bg: 'rgba(34,197,94,.15)',   color: '#22C55E' };
  if (sport === 'Ambos')    return { bg: 'rgba(147,51,234,.15)',  color: '#9333EA' };
  return                           { bg: 'rgba(107,114,128,.15)', color: '#6B7280' };
}

async function fetchClubs(provincia) {
  const query = `
    [out:json][timeout:25];
    area["name"="${provincia}"]["admin_level"~"4|6"]->.searchArea;
    (
      nwr["leisure"="sports_centre"]["sport"~"padel|tennis|pádel|tenis",i](area.searchArea);
      nwr["amenity"="sports_centre"]["sport"~"padel|tennis|pádel|tenis",i](area.searchArea);
      nwr["sport"~"padel|pádel",i](area.searchArea);
      nwr["sport"~"tennis|tenis",i](area.searchArea);
    );
    out body;
  `.trim();
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
  });
  const data = await res.json();
  return (data.elements || []).filter((e) => e.tags?.name);
}

export default function ClubsPage() {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const provincia = profile?.provincia || 'Madrid';

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchClubs(provincia)
      .then((data) => { setClubs(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [provincia]);

  const filtered = clubs.filter((c) => {
    if (filter === 'Todos') return true;
    const sport = getSportBadge(c.tags);
    return sport === filter || sport === 'Ambos';
  });

  return (
    <div className="page">
      <div className="page-header" style={{ padding: 0, marginBottom: 16 }}>
        <h1>Clubs cerca de ti</h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{provincia}</span>
      </div>

      {/* Filtros */}
      <div className="chip-row" style={{ marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'selected' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 92 }} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>⚠️</p>
          <p style={{ color: 'var(--text-muted)' }}>Error al cargar clubs. Inténtalo de nuevo.</p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎾</p>
          <p style={{ color: 'var(--text-muted)' }}>No encontramos clubs registrados en tu zona todavía</p>
        </div>
      )}

      {/* Lista de clubs */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((club, i) => {
            const sport = getSportBadge(club.tags);
            const { bg, color } = sportColor(sport);
            const nombre = club.tags.name || 'Club sin nombre';
            const dir = [
              club.tags['addr:street'],
              club.tags['addr:housenumber'],
              club.tags['addr:city'],
            ].filter(Boolean).join(', ') || 'Dirección no disponible';
            const lat = club.lat || club.center?.lat;
            const lon = club.lon || club.center?.lon;
            const mapsUrl = lat && lon
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
              : `https://www.google.com/maps/search/${encodeURIComponent(nombre + ' ' + provincia)}`;

            return (
              <div key={club.id || i} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8 }}>{nombre}</span>
                  <span style={{
                    background: bg, color,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {sport}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{dir}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                    background: 'rgba(34,197,94,0.10)', padding: '7px 14px',
                    borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  Ver en Google Maps →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
