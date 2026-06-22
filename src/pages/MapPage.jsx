import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const CENTRO_ESPANA = [40.4168, -3.7038];

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

export default function MapPage() {
  const [centro, setCentro] = useState(CENTRO_ESPANA);
  const [pistas, setPistas] = useState([]);
  const [filtro, setFiltro] = useState('ambos'); // 'padel' | 'tenis' | 'ambos'
  const [cargando, setCargando] = useState(true);

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
    const radio = 20000; // 20km
    const query = `
      [out:json][timeout:25];
      (
        nwr["sport"~"tennis|padel"](around:${radio},${lat},${lon});
        nwr["leisure"="sports_centre"]["sport"~"tennis|padel"](around:${radio},${lat},${lon});
      );
      out center 80;
    `;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
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
    } catch {
      setPistas([]);
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
      </div>

      <div style={{ height: '60vh', width: '100%', position: 'relative' }}>
        {cargando && <div className="spinner" style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 500 }} />}
        <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
          <Recentrar centro={centro} />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
