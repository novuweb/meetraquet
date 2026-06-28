import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import { DISPONIBILIDAD_OPCIONES } from '../lib/disponibilidad';

const MODOS_DEF = [
  { id: 'tenis_individual', titulo: 'Tenis Individual', desc: 'Busco rival para jugar uno contra uno' },
  { id: 'tenis_dobles_pareja', titulo: 'Tenis Dobles — Busco pareja', desc: 'Quiero encontrar un companero de dobles' },
  { id: 'tenis_dobles_rival', titulo: 'Tenis Dobles — Tengo pareja', desc: 'Ya jugamos en pareja, buscamos rivales' },
  { id: 'padel_individual', titulo: 'Padel Individual', desc: 'Busco rival para jugar uno contra uno' },
  { id: 'padel_dobles_pareja', titulo: 'Padel — Busco pareja', desc: 'Quiero encontrar un companero de padel' },
  { id: 'padel_dobles_rival', titulo: 'Padel — Tengo pareja', desc: 'Ya jugamos en pareja, buscamos rivales' },
];

const PASOS = ['modo', 'foto', 'nombre', 'edad', 'ubicacion', 'disponibilidad'];

function Barra({ paso, total }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 99,
          background: i <= paso ? 'var(--accent)' : 'var(--bg-elev)',
          transition: 'background .25s',
        }} />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [modo, setModo] = useState(null);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [isla, setIsla] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);

  const pantallaActual = PASOS[paso];

  function puedeAvanzar() {
    if (pantallaActual === 'modo') return !!modo;
    if (pantallaActual === 'foto') return true;
    if (pantallaActual === 'nombre') return nombre.trim().length > 0;
    if (pantallaActual === 'edad') return edad && Number(edad) >= 12 && Number(edad) <= 99;
    if (pantallaActual === 'ubicacion') {
      if (!provincia) return false;
      if (esProvinciaCanaria(provincia) && !isla) return false;
      return true;
    }
    if (pantallaActual === 'disponibilidad') return true;
    return true;
  }

  function handleFoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setFoto(f); setPreview(URL.createObjectURL(f));
  }

  function avanzar() {
    setError('');
    if (!puedeAvanzar()) { setError('Rellena este campo para continuar.'); return; }
    if (paso < PASOS.length - 1) { setPaso(p => p + 1); return; }
    guardarComunes();
  }
  function retroceder() { setError(''); setPaso(p => Math.max(p - 1, 0)); }

  async function guardarComunes() {
    setCargando(true);
    try {
      let avatar_url = null;
      if (foto) {
        const ext = foto.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from('avatars').upload(path, foto, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
      await supabase.from('profiles').update({
        nombre: nombre.trim(),
        edad: Number(edad),
        provincia,
        isla: esProvinciaCanaria(provincia) ? isla : null,
        disponibilidad,
        avatar_url,
        modo_activo: modo,
        modos_configurados: [],
        puntos: 0,
      }).eq('id', user.id);

      await refreshProfile();
      navigate('/onboarding-modo', { state: { modo } });
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 40 }} />
      </div>
      <Barra paso={paso} total={PASOS.length} />

      {pantallaActual === 'modo' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Como quieres jugar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
            Elige tu modo. Podras cambiarlo mas adelante.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODOS_DEF.map(({ id, titulo, desc }) => {
              const sel = modo === id;
              return (
                <button
                  key={id} type="button"
                  onClick={() => setModo(id)}
                  style={{
                    textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
                    transition: 'all .18s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: sel ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{titulo}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'var(--accent)' : 'transparent',
                  }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pantallaActual === 'foto' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu foto de perfil</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Opcional. Si no subes foto se usaran tus iniciales.
          </p>
          <label htmlFor="foto-ob" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 10px',
              border: '2px dashed var(--border)', overflow: 'hidden',
              background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, color: 'var(--text-muted)',
            }}>
              {!preview && '+'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              {preview ? 'Cambiar foto' : 'Subir foto'}
            </p>
            <input id="foto-ob" type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {pantallaActual === 'nombre' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu nombre</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>El nombre que veran los demas jugadores.</p>
          <div className="form-group">
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              onKeyDown={(e) => e.key === 'Enter' && avanzar()}
            />
          </div>
        </div>
      )}

      {pantallaActual === 'edad' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu edad</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Solo el numero, sin mas.</p>
          <div className="form-group">
            <input
              autoFocus type="number" min={12} max={99}
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej. 28"
              onKeyDown={(e) => e.key === 'Enter' && avanzar()}
            />
          </div>
        </div>
      )}

      {pantallaActual === 'ubicacion' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Donde juegas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Para mostrarte jugadores cerca de ti.</p>
          <SelectorUbicacion
            provincia={provincia} isla={isla}
            onChangeProvincia={(p) => { setProvincia(p); setIsla(''); }}
            onChangeIsla={setIsla}
          />
        </div>
      )}

      {pantallaActual === 'disponibilidad' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Cuando puedes jugar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Selecciona todos los que apliquen.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DISPONIBILIDAD_OPCIONES.map((o) => {
              const sel = disponibilidad.includes(o.id);
              return (
                <button key={o.id} type="button"
                  onClick={() => setDisponibilidad(p => sel ? p.filter(d => d !== o.id) : [...p, o.id])}
                  style={{
                    textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
                    fontWeight: 600, fontSize: 15,
                    color: sel ? 'var(--accent)' : 'var(--text)',
                  }}
                >{o.label}</button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {paso > 0 && (
          <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={retroceder}>Atras</button>
        )}
        <button
          type="button" className="btn-primary"
          style={{ flex: 2, opacity: puedeAvanzar() ? 1 : .4 }}
          onClick={avanzar}
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : paso === PASOS.length - 1 ? 'Continuar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
