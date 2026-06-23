import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const CENTRO_ESPANA = [40.4168, -3.7038];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = MAPBOX_TOKEN
  ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; OpenStreetMap contributors'
  : '&copy; OpenStreetMap contributors';

// Varios espejos públicos de Overpass: si el primero falla o está saturado,
// se prueba con el siguiente automáticamente.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const icono = (emoji) => L.divIcon({
  html: `<div style="font-size:26px;line-height:1;">${emoji}</div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 24],
});

function Recentrar({ centro }) {
  const map = useMap();
  useEffect(() => { map.setView(centro, 13); }, [centro]);
  return null;
}

async function consultarOverpass(query) {
  let ultimoError = null;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      ultimoError = err;
    }
  }
  throw ultimoError || new Error('No se pudo contactar con ningún servidor de Overpass');
}

export default function MapPage() {
  const [centro, setCentro] = useState(CENTRO_ESPANA);
  const [pistas, setPistas] = useState([]);
  const [filtro, setFiltro] = useState('ambos'); // 'padel' | 'tenis' | 'ambos'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCentro([pos.coords.latitude, pos.coords.longitude]),
      () => {} // si el usuario no da permiso, se queda el centro de España
    );
  }, []);

  useEffect(() => {
    cargarPistas(centro);
  }, [centro[0], centro[1]]);

  async function cargarPistas([lat, lon]) {
    setCargando(true);
    setError(null);
    const radio = 20000; // 20km
    const query = `
      [out:json][timeout:25];
      (
        node["sport"~"tennis|padel"](around:${radio},${lat},${lon});
        way["sport"~"tennis|padel"](around:${radio},${lat},${lon});
        relation["sport"~"tennis|padel"](around:${radio},${lat},${lon});
      );
      out center 100;
    `;
    try {
      const data = await consultarOverpass(query);
      const procesadas = (data.elements || [])
        .map((el) => {
          const latlng = el.type === 'node' ? [el.lat, el.lon] : [el.center?.lat, el.center?.lon];
          if (!latlng[0]) return null;
          const sport = el.tags?.sport || '';
          const deporte = sport.includes('padel') ? 'Pádel' : sport.includes('tennis') ? 'Tenis' : 'Pádel/Tenis';
          return {
            id: el.id,
            lat: latlng[0],
            lon: latlng[1],
            nombre: el.tags?.name || 'Pista sin nombre',
            direccion: el.tags?.['addr:street']
              ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim()
              : 'Dirección no disponible',
            deporte,
          };
        })
        .filter(Boolean);
      setPistas(procesadas);
    } catch (err) {
      setPistas([]);
      setError('No se han podido cargar las pistas. Comprueba tu conexión e inténtalo de nuevo.');
    }
    setCargando(false);
  }

  const pistasFiltradas = pistas.filter((p) => {
    if (filtro === 'ambos') return true;
    if (filtro === 'padel') return p.deporte.includes('Pádel');
    if (filtro === 'tenis') return p.deporte.includes('Tenis');
    return true;
  });

  return (
    <div className="page" style={{ padding: '20px 0 0' }}>
      <div style={{ padding: '0 18px' }}>
        <h1 className="page-title">Pistas cerca de ti</h1>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          <button className={`chip ${filtro === 'ambos' ? 'selected' : ''}`} onClick={() => setFiltro('ambos')}>Ambos</button>
          <button className={`chip ${filtro === 'padel' ? 'selected' : ''}`} onClick={() => setFiltro('padel')}>Pádel</button>
          <button className={`chip ${filtro === 'tenis' ? 'selected' : ''}`} onClick={() => setFiltro('tenis')}>Tenis</button>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error}</p>
            <button className="chip" onClick={() => cargarPistas(centro)}>Reintentar</button>
          </div>
        )}

        {!error && !cargando && pistasFiltradas.length === 0 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No se han encontrado pistas registradas en OpenStreetMap cerca de tu ubicación. Puede que falten por mapear en tu zona.</p>
          </div>
        )}
      </div>

      <div style={{ height: '60vh', width: '100%', position: 'relative' }}>
        {cargando && <div className="spinner" style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 500 }} />}
        <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
          <Recentrar centro={centro} />
          <TileLayer
            attribution={TILE_ATTRIBUTION}
            url={TILE_URL}
            tileSize={MAPBOX_TOKEN ? 512 : 256}
            zoomOffset={MAPBOX_TOKEN ? -1 : 0}
          />
          <Marker position={centro} icon={icono('📍')}>
            <Popup>Tu ubicación</Popup>
          </Marker>
          {pistasFiltradas.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lon]} icon={icono(p.deporte.includes('Tenis') ? '🎾' : '🏓')}>
              <Popup>
                <strong>{p.nombre}</strong><br />
                {p.direccion}<br />
                {p.deporte}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
