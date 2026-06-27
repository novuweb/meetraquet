import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import { DISPONIBILIDAD_OPCIONES } from '../lib/disponibilidad';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competición'];

// ─── barra de progreso ────────────────────────────────────────────────────
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

// ─── card de opción (radio) ───────────────────────────────────────────────
function OpcionCard({ titulo, desc, seleccionada, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '16px 18px', borderRadius: 16,
      cursor: 'pointer', transition: 'all .2s',
      border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
      background: seleccionada ? 'rgba(34,197,94,.08)' : 'var(--bg-card)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: seleccionada ? 'var(--accent)' : 'var(--text)', marginBottom: desc ? 2 : 0 }}>{titulo}</p>
        {desc && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginLeft: 14,
        border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
        background: seleccionada ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {seleccionada && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

// ─── card de opción con checkbox (multi-select) ───────────────────────────
function CheckCard({ titulo, desc, seleccionada, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '16px 18px', borderRadius: 16,
      cursor: 'pointer', transition: 'all .2s',
      border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
      background: seleccionada ? 'rgba(34,197,94,.08)' : 'var(--bg-card)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: seleccionada ? 'var(--accent)' : 'var(--text)', marginBottom: desc ? 2 : 0 }}>{titulo}</p>
        {desc && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginLeft: 14,
        border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
        background: seleccionada ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {seleccionada && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>
    </button>
  );
}

// ─── chips de nivel ───────────────────────────────────────────────────────
function SelectorNivel({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {NIVELES.map((n) => (
        <button key={n} type="button"
          className={`chip ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >{n}</button>
      ))}
    </div>
  );
}

// ─── foto de perfil ───────────────────────────────────────────────────────
function FotoUpload({ preview, onChange }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <label htmlFor="foto-input" style={{ cursor: 'pointer' }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%', margin: '0 auto 8px',
          border: '2px dashed var(--border)', overflow: 'hidden',
          background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'var(--text-muted)',
        }}>{!preview && 'Foto'}</div>
        <p style={{ fontSize: 12, color: 'var(--accent)' }}>Subir foto (opcional)</p>
      </label>
      <input id="foto-input" type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </div>
  );
}

// ─── botones de navegación ────────────────────────────────────────────────
function NavBotones({ onAtras, onContinuar, label, cargando }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
      {onAtras && (
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onAtras}>Atras</button>
      )}
      <button
        type={onContinuar ? 'button' : 'submit'}
        className="btn-primary"
        style={{ flex: 2 }}
        onClick={onContinuar}
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : (label || 'Continuar')}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // ── deportes seleccionados (multi-select) ────────────────────────────────
  const [deportes, setDeportes] = useState([]); // ['tenis', 'padel']

  // ── configuración de tenis ────────────────────────────────────────────────
  const [tenisModalidad, setTenisModalidad] = useState(null); // 'individual' | 'dobles'
  const [tenisSituacion, setTenisSituacion] = useState(null); // 'tengo_pareja' | 'busco_pareja'

  // ── configuración de padel ────────────────────────────────────────────────
  const [padelSituacion, setPadelSituacion] = useState(null); // 'tengo_pareja' | 'busco_pareja'

  // ── datos jugador 1 ───────────────────────────────────────────────────────
  const [foto1, setFoto1] = useState(null);
  const [preview1, setPreview1] = useState(profile?.avatar_url || null);
  const [nombre1, setNombre1] = useState(profile?.nombre || '');
  const [edad1, setEdad1] = useState(profile?.edad || '');
  const [nivel1, setNivel1] = useState(profile?.nivel || '');

  // ── datos jugador 2 (solo si hay pareja) ─────────────────────────────────
  const [nombre2, setNombre2] = useState('');
  const [edad2, setEdad2] = useState('');
  const [nivel2, setNivel2] = useState('');

  // ── ubicación ─────────────────────────────────────────────────────────────
  const [provincia, setProvincia] = useState(profile?.provincia || '');
  const [isla, setIsla] = useState(profile?.isla || '');
  const [disponibilidad, setDisponibilidad] = useState(profile?.disponibilidad || []);
  const [descripcion, setDescripcion] = useState(profile?.descripcion || '');
  const [codigoReferido, setCodigoReferido] = useState('');

  // ── helpers ───────────────────────────────────────────────────────────────
  const tieneTenis = deportes.includes('tenis');
  const tienePadel = deportes.includes('padel');
  const tenisDobles = tieneTenis && tenisModalidad === 'dobles';
  const hayParejaTenis = tenisDobles && tenisSituacion === 'tengo_pareja';
  const hayParejaPadel = tienePadel && padelSituacion === 'tengo_pareja';
  const necesitaJugador2 = hayParejaTenis || hayParejaPadel;

  function toggleDeporte(d) {
    setDeportes((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }
  function handleFoto1(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto1(f); setPreview1(URL.createObjectURL(f));
  }
  function toggleDisponibilidad(id) {
    setDisponibilidad((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  // ── construcción dinámica de pantallas ────────────────────────────────────
  function buildPantallas() {
    const p = ['deportes'];
    if (tieneTenis) p.push('tenis_modalidad');
    if (tenisDobles) p.push('tenis_situacion');
    if (tienePadel) p.push('padel_situacion');
    p.push('jugador1');
    if (necesitaJugador2) p.push('jugador2');
    p.push('ubicacion');
    return p;
  }

  const [paso, setPaso] = useState(0);
  const pantallas = buildPantallas();
  const pantallaActual = pantallas[paso] || 'deportes';
  const totalPasos = pantallas.length;

  function avanzar() {
    setError('');
    if (!validar(pantallaActual)) return;
    setPaso((p) => Math.min(p + 1, totalPasos - 1));
  }
  function anterior() {
    setError('');
    setPaso((p) => Math.max(p - 1, 0));
  }

  function validar(pantalla) {
    if (pantalla === 'deportes') {
      if (deportes.length === 0) { setError('Selecciona al menos un deporte.'); return false; }
    }
    if (pantalla === 'tenis_modalidad') {
      if (!tenisModalidad) { setError('Elige cómo juegas al tenis.'); return false; }
    }
    if (pantalla === 'tenis_situacion') {
      if (!tenisSituacion) { setError('Indica si tienes pareja o buscas una.'); return false; }
    }
    if (pantalla === 'padel_situacion') {
      if (!padelSituacion) { setError('Indica si tienes pareja o buscas una.'); return false; }
    }
    if (pantalla === 'jugador1') {
      if (!nombre1.trim()) { setError('Escribe tu nombre.'); return false; }
      if (!edad1 || Number(edad1) < 12 || Number(edad1) > 99) { setError('Edad no válida.'); return false; }
      if (!nivel1) { setError('Selecciona tu nivel.'); return false; }
    }
    if (pantalla === 'jugador2') {
      if (!nombre2.trim()) { setError('Escribe el nombre de tu compañero/a.'); return false; }
      if (!edad2 || Number(edad2) < 12 || Number(edad2) > 99) { setError('Edad no válida.'); return false; }
      if (!nivel2) { setError('Selecciona el nivel de tu compañero/a.'); return false; }
    }
    return true;
  }

  // ── guardar ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!provincia) { setError('Selecciona tu provincia.'); return; }
    if (esProvinciaCanaria(provincia) && !isla) { setError('Selecciona tu isla.'); return; }

    setCargando(true);
    try {
      let avatar_url = profile?.avatar_url || null;
      if (foto1) {
        const ext = foto1.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, foto1, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }

      // deporte en DB
      let deporteDB;
      if (tieneTenis && tienePadel) deporteDB = 'Ambos';
      else if (tieneTenis) deporteDB = 'Tenis';
      else deporteDB = 'Pádel';

      // nombre y nivel
      const nombreDB = necesitaJugador2 ? `${nombre1.trim()} & ${nombre2.trim()}` : nombre1.trim();
      const nivelDB = necesitaJugador2 ? `${nivel1} / ${nivel2}` : nivel1;

      // dobles_busca: prioriza padel si hay padel, si no tenis dobles
      let dobles_busca = null;
      if (hayParejaPadel || hayParejaTenis) dobles_busca = 'rival';
      else if (padelSituacion === 'busco_pareja' || tenisSituacion === 'busco_pareja') dobles_busca = 'pareja';

      const { error: updateErr } = await supabase.from('profiles').update({
        nombre: nombreDB,
        edad: Number(edad1),
        deporte: deporteDB,
        nivel: nivelDB,
        descripcion,
        provincia,
        isla: esProvinciaCanaria(provincia) ? isla : null,
        disponibilidad,
        avatar_url,
        perfil_completo: true,
        puntos: profile?.puntos || 0,
        dobles_busca,
      }).eq('id', user.id);

      if (updateErr) throw updateErr;

      if (codigoReferido.trim()) {
        await supabase.rpc('aplicar_codigo_referido', { p_codigo: codigoReferido.trim() });
      }

      await refreshProfile();
      navigate('/');
    } catch (err2) {
      setError(err2.message);
    } finally {
      setCargando(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 44 }} />
      </div>

      {paso > 0 && <Barra paso={paso} total={totalPasos - 1} />}

      {/* DEPORTES */}
      {pantallaActual === 'deportes' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>¿Qué practicas?</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Puedes elegir más de uno. Configuraremos cada deporte por separado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CheckCard
              titulo="Tenis"
              desc="Individual o dobles, en distintas superficies."
              seleccionada={deportes.includes('tenis')}
              onClick={() => toggleDeporte('tenis')}
            />
            <CheckCard
              titulo="Padel"
              desc="Siempre en pareja, pista cerrada con cristales."
              seleccionada={deportes.includes('padel')}
              onClick={() => toggleDeporte('padel')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onContinuar={avanzar} />
        </div>
      )}

      {/* TENIS: INDIVIDUAL O DOBLES */}
      {pantallaActual === 'tenis_modalidad' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Tenis</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>¿Cómo juegas?</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Tipo de partido que buscas en tenis.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Individual"
              desc="Partidos de 1 contra 1."
              seleccionada={tenisModalidad === 'individual'}
              onClick={() => setTenisModalidad('individual')}
            />
            <OpcionCard
              titulo="Dobles"
              desc="Partidos de 2 contra 2."
              seleccionada={tenisModalidad === 'dobles'}
              onClick={() => setTenisModalidad('dobles')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* TENIS DOBLES: ¿TIENE PAREJA? */}
      {pantallaActual === 'tenis_situacion' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Tenis dobles</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>¿Ya tenéis pareja formada o estás buscando compañero?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Tenemos pareja"
              desc="Ya jugáis juntos y buscáis rivales."
              seleccionada={tenisSituacion === 'tengo_pareja'}
              onClick={() => setTenisSituacion('tengo_pareja')}
            />
            <OpcionCard
              titulo="Busco pareja"
              desc="Juegas solo y quieres encontrar compañero/a de dobles."
              seleccionada={tenisSituacion === 'busco_pareja'}
              onClick={() => setTenisSituacion('busco_pareja')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* PADEL: ¿TIENE PAREJA? */}
      {pantallaActual === 'padel_situacion' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Padel</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>¿Ya tenéis pareja formada o estás buscando compañero?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Tenemos pareja"
              desc="Ya jugáis juntos y buscáis rivales."
              seleccionada={padelSituacion === 'tengo_pareja'}
              onClick={() => setPadelSituacion('tengo_pareja')}
            />
            <OpcionCard
              titulo="Busco pareja"
              desc="Juegas solo y quieres encontrar compañero/a de padel."
              seleccionada={padelSituacion === 'busco_pareja'}
              onClick={() => setPadelSituacion('busco_pareja')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* JUGADOR 1 */}
      {pantallaActual === 'jugador1' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            {necesitaJugador2 ? 'Jugador 1 — tus datos' : 'Tus datos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Esto es lo que verán los demás jugadores.
          </p>
          <FotoUpload preview={preview1} onChange={handleFoto1} />
          <div className="form-group">
            <label>Nombre</label>
            <input value={nombre1} onChange={(e) => setNombre1(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" min={12} max={99} value={edad1} onChange={(e) => setEdad1(e.target.value)} placeholder="Ej. 28" />
          </div>
          <div className="form-group">
            <label>Nivel de juego</label>
            <SelectorNivel value={nivel1} onChange={setNivel1} />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* JUGADOR 2 */}
      {pantallaActual === 'jugador2' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Jugador 2</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Datos de tu compañero/a de pareja.
          </p>
          <div className="form-group">
            <label>Nombre</label>
            <input value={nombre2} onChange={(e) => setNombre2(e.target.value)} placeholder="Nombre del jugador 2" />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" min={12} max={99} value={edad2} onChange={(e) => setEdad2(e.target.value)} placeholder="Ej. 30" />
          </div>
          <div className="form-group">
            <label>Nivel de juego</label>
            <SelectorNivel value={nivel2} onChange={setNivel2} />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* UBICACIÓN Y DISPONIBILIDAD */}
      {pantallaActual === 'ubicacion' && (
        <form onSubmit={handleSubmit}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Ubicación y horarios</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Para mostrarte jugadores cerca de ti.
          </p>
          <SelectorUbicacion
            provincia={provincia}
            isla={isla}
            onChangeProvincia={(p) => { setProvincia(p); setIsla(''); }}
            onChangeIsla={setIsla}
          />
          <div className="form-group">
            <label>¿Cuándo podéis jugar?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISPONIBILIDAD_OPCIONES.map((o) => (
                <button
                  type="button" key={o.id}
                  className={`chip ${disponibilidad.includes(o.id) ? 'selected' : ''}`}
                  onClick={() => toggleDisponibilidad(o.id)}
                >{o.label}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Descripcion (opcional)</label>
            <textarea maxLength={150} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Algo sobre tu juego..." />
          </div>
          <div className="form-group">
            <label>Codigo de referido (opcional)</label>
            <input value={codigoReferido} onChange={(e) => setCodigoReferido(e.target.value)} placeholder="Ej. AB12CD3" />
          </div>
          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <NavBotones onAtras={anterior} label="Entrar a MeetRacquet" cargando={cargando} />
        </form>
      )}
    </div>
  );
}
