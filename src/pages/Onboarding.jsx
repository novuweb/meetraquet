import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import { DISPONIBILIDAD_OPCIONES } from '../lib/disponibilidad';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competicion'];
const ESTILOS = ['Agresivo', 'Defensivo', 'Equilibrado', 'Completo'];

function Barra({ paso, total }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 99,
          background: i < paso ? 'var(--accent)' : 'var(--bg-elev)',
          transition: 'background .25s',
        }} />
      ))}
    </div>
  );
}

function CheckCard({ titulo, desc, sel, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '15px 18px', borderRadius: 14,
      border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
      background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
      cursor: 'pointer', transition: 'all .2s',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: sel ? 'var(--accent)' : 'var(--text)', marginBottom: desc ? 2 : 0 }}>{titulo}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginLeft: 12,
        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
        background: sel ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>v</span>}
      </div>
    </button>
  );
}

function Chips({ opciones, value, onChange, multi }) {
  function toggle(o) {
    if (multi) {
      onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    } else {
      onChange(o);
    }
  }
  const arr = multi ? value : [value];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((o) => (
        <button key={o} type="button"
          className={`chip ${arr.includes(o) ? 'selected' : ''}`}
          onClick={() => toggle(o)}
        >{o}</button>
      ))}
    </div>
  );
}

function Nav({ onAtras, onContinuar, label, cargando }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
      {onAtras && <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onAtras}>Atras</button>}
      <button type={onContinuar ? 'button' : 'submit'} className="btn-primary" style={{ flex: 2 }}
        onClick={onContinuar} disabled={cargando}>
        {cargando ? 'Guardando...' : (label || 'Continuar')}
      </button>
    </div>
  );
}

function DeporteHeader({ deporte }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
      <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>
        Configurando perfil de {deporte}
      </p>
    </div>
  );
}

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // ── comunes ───────────────────────────────────────────────────────────────
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [isla, setIsla] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);

  // ── deportes ──────────────────────────────────────────────────────────────
  const [deportesSel, setDeportesSel] = useState([]); // ['tenis','padel']

  // ── tenis ─────────────────────────────────────────────────────────────────
  const [nivelTenis, setNivelTenis] = useState('');
  const [estiloTenis, setEstiloTenis] = useState('');
  const [descTenis, setDescTenis] = useState('');
  // modalidades tenis: 'individual' | 'dobles_pareja' | 'dobles_busco'
  const [modosTenis, setModosTenis] = useState([]);

  // ── padel ─────────────────────────────────────────────────────────────────
  const [nivelPadel, setNivelPadel] = useState('');
  const [estiloPadel, setEstiloPadel] = useState('');
  const [descPadel, setDescPadel] = useState('');
  // modalidades padel: 'pareja' | 'busco'
  const [modosPadel, setModosPadel] = useState([]);

  // ── pareja ────────────────────────────────────────────────────────────────
  const [parejaNombre, setParejaNombre] = useState('');
  const [parejaNivel, setParejaNivel] = useState('');
  const [codigoReferido, setCodigoReferido] = useState('');

  const tieneTenis = deportesSel.includes('tenis');
  const tienePadel = deportesSel.includes('padel');
  const tieneDobles = modosTenis.includes('dobles_pareja') || modosPadel.includes('pareja');

  function handleFoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto(f); setPreview(URL.createObjectURL(f));
  }
  function toggleDeporte(d) {
    setDeportesSel((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  }

  // ── construcción de pasos ─────────────────────────────────────────────────
  function buildPasos() {
    const p = ['comunes', 'ubicacion', 'deportes'];
    if (tieneTenis) p.push('tenis');
    if (tienePadel) p.push('padel');
    if (tieneDobles) p.push('pareja');
    p.push('final');
    return p;
  }
  const pasos = buildPasos();
  const pantallaActual = pasos[paso] || 'comunes';
  const total = pasos.length;

  function validar(p) {
    if (p === 'comunes') {
      if (!nombre.trim()) { setError('Escribe tu nombre.'); return false; }
      if (!edad || Number(edad) < 12) { setError('Edad no valida.'); return false; }
    }
    if (p === 'ubicacion') {
      if (!provincia) { setError('Selecciona tu provincia.'); return false; }
      if (esProvinciaCanaria(provincia) && !isla) { setError('Selecciona tu isla.'); return false; }
    }
    if (p === 'deportes') {
      if (!deportesSel.length) { setError('Selecciona al menos un deporte.'); return false; }
    }
    if (p === 'tenis') {
      if (!nivelTenis) { setError('Selecciona tu nivel de tenis.'); return false; }
      if (!modosTenis.length) { setError('Selecciona como juegas al tenis.'); return false; }
    }
    if (p === 'padel') {
      if (!nivelPadel) { setError('Selecciona tu nivel de padel.'); return false; }
      if (!modosPadel.length) { setError('Selecciona como juegas al padel.'); return false; }
    }
    if (p === 'pareja') {
      if (!parejaNombre.trim()) { setError('Escribe el nombre de tu pareja.'); return false; }
      if (!parejaNivel) { setError('Selecciona el nivel de tu pareja.'); return false; }
    }
    return true;
  }

  function avanzar() {
    setError('');
    if (!validar(pantallaActual)) return;
    setPaso((p) => Math.min(p + 1, total - 1));
  }
  function retroceder() {
    setError('');
    setPaso((p) => Math.max(p - 1, 0));
  }

  async function guardar(e) {
    e.preventDefault();
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

      const tieneParejaTenis = modosTenis.includes('dobles_pareja');
      const tieneParejaPadel = modosPadel.includes('pareja');
      const tienePareja = tieneParejaTenis || tieneParejaPadel;
      const buscaPareja = modosTenis.includes('dobles_busco') || modosPadel.includes('busco');

      let dobles_busca = null;
      if (tienePareja) dobles_busca = 'rival';
      else if (buscaPareja) dobles_busca = 'pareja';

      let deporteDB = 'Tenis';
      if (tieneTenis && tienePadel) deporteDB = 'Ambos';
      else if (tienePadel) deporteDB = 'Padel';

      await supabase.from('profiles').update({
        nombre: nombre.trim(),
        edad: Number(edad),
        provincia,
        isla: esProvinciaCanaria(provincia) ? isla : null,
        disponibilidad,
        avatar_url,
        perfil_completo: true,
        puntos: profile?.puntos || 0,
        deporte: deporteDB,
        nivel: nivelTenis || nivelPadel || '',
        descripcion: descTenis || descPadel || '',
        juega_tenis: tieneTenis,
        juega_padel: tienePadel,
        nivel_tenis: nivelTenis || null,
        estilo_tenis: estiloTenis || null,
        descripcion_tenis: descTenis || null,
        nivel_padel: nivelPadel || null,
        estilo_padel: estiloPadel || null,
        descripcion_padel: descPadel || null,
        pareja_nombre: tienePareja ? (parejaNombre || null) : null,
        pareja_nivel: tienePareja ? (parejaNivel || null) : null,
        dobles_busca,
      }).eq('id', user.id);

      if (codigoReferido.trim()) {
        await supabase.rpc('usar_codigo_referido', { p_codigo: codigoReferido.trim() });
      }

      await refreshProfile();
      navigate('/modo');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 42 }} />
      </div>
      {paso > 0 && <Barra paso={paso} total={total - 1} />}

      {/* COMUNES: foto, nombre, edad */}
      {pantallaActual === 'comunes' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Crea tu perfil</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
            Datos basicos que verán todos los jugadores.
          </p>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <label htmlFor="foto-input" style={{ cursor: 'pointer' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', margin: '0 auto 8px',
                border: '2px dashed var(--border)', overflow: 'hidden',
                background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'var(--text-muted)',
              }}>{!preview && 'Foto'}</div>
              <p style={{ fontSize: 12, color: 'var(--accent)' }}>Subir foto (opcional)</p>
            </label>
            <input id="foto-input" type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
          </div>

          <div className="form-group">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" min={12} max={99} value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Ej. 28" />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onContinuar={avanzar} />
        </div>
      )}

      {/* UBICACION */}
      {pantallaActual === 'ubicacion' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Donde juegas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
            Para mostrarte jugadores cerca de ti.
          </p>
          <SelectorUbicacion
            provincia={provincia}
            isla={isla}
            onChangeProvincia={(p) => { setProvincia(p); setIsla(''); }}
            onChangeIsla={setIsla}
          />
          <div className="form-group">
            <label>Cuando puedes jugar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISPONIBILIDAD_OPCIONES.map((o) => (
                <button key={o.id} type="button"
                  className={`chip ${disponibilidad.includes(o.id) ? 'selected' : ''}`}
                  onClick={() => setDisponibilidad((p) => p.includes(o.id) ? p.filter((d) => d !== o.id) : [...p, o.id])}
                >{o.label}</button>
              ))}
            </div>
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onAtras={retroceder} onContinuar={avanzar} />
        </div>
      )}

      {/* DEPORTES */}
      {pantallaActual === 'deportes' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Que practicas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
            Puedes elegir los dos. Configuraremos cada uno por separado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CheckCard titulo="Tenis" desc="Individual o dobles" sel={deportesSel.includes('tenis')} onClick={() => toggleDeporte('tenis')} />
            <CheckCard titulo="Padel" desc="Siempre en pareja, pista cerrada" sel={deportesSel.includes('padel')} onClick={() => toggleDeporte('padel')} />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <Nav onAtras={retroceder} onContinuar={avanzar} />
        </div>
      )}

      {/* TENIS */}
      {pantallaActual === 'tenis' && (
        <div>
          <DeporteHeader deporte="Tenis" />
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>Tu perfil de tenis</h1>

          <div className="form-group">
            <label>Nivel</label>
            <Chips opciones={NIVELES} value={nivelTenis} onChange={setNivelTenis} multi={false} />
          </div>
          <div className="form-group">
            <label>Estilo de juego</label>
            <Chips opciones={ESTILOS} value={estiloTenis} onChange={setEstiloTenis} multi={false} />
          </div>
          <div className="form-group">
            <label>Descripcion (opcional)</label>
            <textarea maxLength={150} rows={2} value={descTenis} onChange={(e) => setDescTenis(e.target.value)} placeholder="Algo sobre tu juego de tenis..." />
          </div>
          <div className="form-group">
            <label>Como juegas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CheckCard titulo="Individual" desc="Partidos de 1 contra 1" sel={modosTenis.includes('individual')} onClick={() => setModosTenis((p) => p.includes('individual') ? p.filter((x) => x !== 'individual') : [...p, 'individual'])} />
              <CheckCard titulo="Dobles — tenemos pareja" desc="Ya teneis pareja formada, buscais rival" sel={modosTenis.includes('dobles_pareja')} onClick={() => setModosTenis((p) => p.includes('dobles_pareja') ? p.filter((x) => x !== 'dobles_pareja') : [...p, 'dobles_pareja'])} />
              <CheckCard titulo="Dobles — busco pareja" desc="Buscas compañero de dobles" sel={modosTenis.includes('dobles_busco')} onClick={() => setModosTenis((p) => p.includes('dobles_busco') ? p.filter((x) => x !== 'dobles_busco') : [...p, 'dobles_busco'])} />
            </div>
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onAtras={retroceder} onContinuar={avanzar} />
        </div>
      )}

      {/* PADEL */}
      {pantallaActual === 'padel' && (
        <div>
          <DeporteHeader deporte="Padel" />
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>Tu perfil de padel</h1>

          <div className="form-group">
            <label>Nivel</label>
            <Chips opciones={NIVELES} value={nivelPadel} onChange={setNivelPadel} multi={false} />
          </div>
          <div className="form-group">
            <label>Estilo de juego</label>
            <Chips opciones={ESTILOS} value={estiloPadel} onChange={setEstiloPadel} multi={false} />
          </div>
          <div className="form-group">
            <label>Descripcion (opcional)</label>
            <textarea maxLength={150} rows={2} value={descPadel} onChange={(e) => setDescPadel(e.target.value)} placeholder="Algo sobre tu juego de padel..." />
          </div>
          <div className="form-group">
            <label>Como juegas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CheckCard titulo="Tenemos pareja" desc="Ya teneis pareja formada, buscais rival" sel={modosPadel.includes('pareja')} onClick={() => setModosPadel((p) => p.includes('pareja') ? p.filter((x) => x !== 'pareja') : [...p, 'pareja'])} />
              <CheckCard titulo="Busco pareja" desc="Buscas compañero de padel" sel={modosPadel.includes('busco')} onClick={() => setModosPadel((p) => p.includes('busco') ? p.filter((x) => x !== 'busco') : [...p, 'busco'])} />
            </div>
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onAtras={retroceder} onContinuar={avanzar} />
        </div>
      )}

      {/* PAREJA */}
      {pantallaActual === 'pareja' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Datos de tu compañero o compañera de pareja.
          </p>
          <div className="form-group">
            <label>Nombre</label>
            <input value={parejaNombre} onChange={(e) => setParejaNombre(e.target.value)} placeholder="Nombre de tu pareja" />
          </div>
          <div className="form-group">
            <label>Nivel</label>
            <Chips opciones={NIVELES} value={parejaNivel} onChange={setParejaNivel} multi={false} />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onAtras={retroceder} onContinuar={avanzar} />
        </div>
      )}

      {/* FINAL */}
      {pantallaActual === 'final' && (
        <form onSubmit={guardar}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Casi listo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
            Codigo de referido si tienes uno.
          </p>
          <div className="form-group">
            <label>Codigo de referido (opcional)</label>
            <input value={codigoReferido} onChange={(e) => setCodigoReferido(e.target.value)} placeholder="Ej. AB12CD3" />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <Nav onAtras={retroceder} label="Entrar a MeetRacquet" cargando={cargando} />
        </form>
      )}
    </div>
  );
}
