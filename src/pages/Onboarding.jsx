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
    <div style={{ display: 'flex', gap: 5, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 99,
          background: i < paso ? 'var(--accent)' : 'var(--bg-elev)',
          transition: 'background .3s',
        }} />
      ))}
    </div>
  );
}

// ─── tarjeta de opción seleccionable ─────────────────────────────────────
function OpcionCard({ titulo, desc, seleccionada, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '18px 20px',
        borderRadius: 16, cursor: 'pointer', transition: 'all .2s',
        border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
        background: seleccionada ? 'rgba(34,197,94,.08)' : 'var(--bg-card)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: 16, color: seleccionada ? 'var(--accent)' : 'var(--text)', marginBottom: 3 }}>
          {titulo}
        </p>
        {desc && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>}
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginLeft: 14,
        border: `2px solid ${seleccionada ? 'var(--accent)' : 'var(--border)'}`,
        background: seleccionada ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {seleccionada && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}

// ─── foto de perfil ───────────────────────────────────────────────────────
function FotoUpload({ preview, onChange, label }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <label htmlFor="foto-input" style={{ cursor: 'pointer' }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%', margin: '0 auto 8px',
          border: '2px dashed var(--border)', overflow: 'hidden',
          background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          {!preview && 'Foto'}
        </div>
        <p style={{ fontSize: 12, color: 'var(--accent)' }}>{label || 'Subir foto (opcional)'}</p>
      </label>
      <input id="foto-input" type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </div>
  );
}

// ─── chips de nivel ───────────────────────────────────────────────────────
function SelectorNivel({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {NIVELES.map((n) => (
        <button
          key={n} type="button"
          className={`chip ${value === n ? 'selected' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── botones de navegación ────────────────────────────────────────────────
function NavBotones({ onAtras, onContinuar, labelContinuar, cargando }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
      {onAtras && (
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onAtras}>
          Atras
        </button>
      )}
      <button
        type={onContinuar ? 'button' : 'submit'}
        className="btn-primary"
        style={{ flex: 2 }}
        onClick={onContinuar}
        disabled={cargando}
      >
        {cargando ? 'Guardando...' : (labelContinuar || 'Continuar')}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ── estado del flujo ────────────────────────────────────────────────────
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // paso 0 — deporte
  const [deporte, setDeporte] = useState(null); // 'tenis' | 'padel'

  // paso 1 — modalidad (solo si tenis)
  const [modalidad, setModalidad] = useState(null); // 'individual' | 'dobles'

  // paso 2 — situación pareja (solo dobles o padel)
  const [situacion, setSituacion] = useState(null); // 'tengo_pareja' | 'busco_pareja'

  // datos jugador 1
  const [foto1, setFoto1] = useState(null);
  const [preview1, setPreview1] = useState(profile?.avatar_url || null);
  const [nombre1, setNombre1] = useState(profile?.nombre || '');
  const [edad1, setEdad1] = useState(profile?.edad || '');
  const [nivel1, setNivel1] = useState(profile?.nivel || '');

  // datos jugador 2 (solo si tengo_pareja)
  const [nombre2, setNombre2] = useState('');
  const [edad2, setEdad2] = useState('');
  const [nivel2, setNivel2] = useState('');

  // ubicación y disponibilidad
  const [provincia, setProvincia] = useState(profile?.provincia || '');
  const [isla, setIsla] = useState(profile?.isla || '');
  const [disponibilidad, setDisponibilidad] = useState(profile?.disponibilidad || []);
  const [descripcion, setDescripcion] = useState(profile?.descripcion || '');
  const [codigoReferido, setCodigoReferido] = useState('');

  // ── helpers ─────────────────────────────────────────────────────────────
  const esDobles = deporte === 'padel' || (deporte === 'tenis' && modalidad === 'dobles');
  const tienePareja = esDobles && situacion === 'tengo_pareja';

  function handleFoto1(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto1(f);
    setPreview1(URL.createObjectURL(f));
  }

  function toggleDisponibilidad(id) {
    setDisponibilidad((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  function err(msg) { setError(msg); return false; }
  function ok() { setError(''); return true; }

  // ── navegación entre pasos ───────────────────────────────────────────────
  // Pasos del flujo:
  //   0 → deporte
  //   1 → modalidad (si tenis) / situacion_pareja (si padel)
  //   2 → situacion_pareja (si tenis dobles) / datos jugador 1 (si padel)
  //   3 → datos jugador 1 (si tenis dobles) / datos jugador 2 o ubicacion
  //   etc.
  // Usamos un array de "pantallas" dinámico según las selecciones.

  const PANTALLAS = buildPantallas();

  function buildPantallas() {
    const p = ['deporte'];
    if (deporte === 'tenis') p.push('modalidad');
    if (esDobles) p.push('situacion_pareja');
    p.push('jugador1');
    if (tienePareja) p.push('jugador2');
    p.push('ubicacion');
    return p;
  }

  const pantallaActual = PANTALLAS[paso] || 'deporte';
  const totalPasos = PANTALLAS.length;

  function siguiente() {
    setError('');
    setPaso((p) => Math.min(p + 1, totalPasos - 1));
  }

  function anterior() {
    setError('');
    setPaso((p) => Math.max(p - 1, 0));
  }

  // ── validación por pantalla ──────────────────────────────────────────────
  function validar(pantalla) {
    if (pantalla === 'deporte') {
      return deporte ? ok() : err('Selecciona un deporte.');
    }
    if (pantalla === 'modalidad') {
      return modalidad ? ok() : err('Elige cómo juegas.');
    }
    if (pantalla === 'situacion_pareja') {
      return situacion ? ok() : err('Indica si tienes pareja o buscas una.');
    }
    if (pantalla === 'jugador1') {
      if (!nombre1.trim()) return err('Escribe tu nombre.');
      if (!edad1 || Number(edad1) < 12 || Number(edad1) > 99) return err('Edad no válida.');
      if (!nivel1) return err('Selecciona tu nivel.');
      return ok();
    }
    if (pantalla === 'jugador2') {
      if (!nombre2.trim()) return err('Escribe el nombre de tu compañero/a.');
      if (!edad2 || Number(edad2) < 12 || Number(edad2) > 99) return err('Edad no válida.');
      if (!nivel2) return err('Selecciona el nivel de tu compañero/a.');
      return ok();
    }
    return ok();
  }

  function avanzar() {
    if (!validar(pantallaActual)) return;
    siguiente();
  }

  // ── envío final ──────────────────────────────────────────────────────────
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

      const deporteDB = deporte === 'padel' ? 'Pádel' : 'Tenis';
      const nombreDB = tienePareja ? `${nombre1.trim()} & ${nombre2.trim()}` : nombre1.trim();
      const nivelDB = tienePareja ? `${nivel1} / ${nivel2}` : nivel1;

      // dobles_busca:
      //   'rival'  → tengo pareja y busco contra quién jugar
      //   'pareja' → busco compañero/a para jugar
      //   null     → individual
      let dobles_busca = null;
      if (esDobles) {
        dobles_busca = situacion === 'tengo_pareja' ? 'rival' : 'pareja';
      }

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

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 44 }} />
      </div>

      {paso > 0 && <Barra paso={paso} total={totalPasos - 1} />}

      {/* ── PANTALLA 0: deporte ─────────────────────────────────────── */}
      {pantallaActual === 'deporte' && (
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Bienvenido</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Cuéntanos qué deporte practicas para personalizar tu perfil.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Tenis"
              desc="Individual o dobles, en pista dura, tierra o hierba."
              seleccionada={deporte === 'tenis'}
              onClick={() => setDeporte('tenis')}
            />
            <OpcionCard
              titulo="Padel"
              desc="Siempre en pareja, pista cerrada con cristales."
              seleccionada={deporte === 'padel'}
              onClick={() => setDeporte('padel')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onContinuar={avanzar} />
        </div>
      )}

      {/* ── PANTALLA: modalidad (solo tenis) ───────────────────────── */}
      {pantallaActual === 'modalidad' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¿Cómo juegas?</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Esto define qué tipo de rivales te mostraremos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Individual"
              desc="Juegas solo, partidos de 1 contra 1."
              seleccionada={modalidad === 'individual'}
              onClick={() => setModalidad('individual')}
            />
            <OpcionCard
              titulo="Dobles"
              desc="Juegas en pareja, partidos de 2 contra 2."
              seleccionada={modalidad === 'dobles'}
              onClick={() => setModalidad('dobles')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* ── PANTALLA: situacion_pareja ──────────────────────────────── */}
      {pantallaActual === 'situacion_pareja' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            {deporte === 'padel' ? 'Tu pareja de padel' : 'Tu pareja de dobles'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            ¿Ya tienes con quién jugar o estás buscando compañero?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OpcionCard
              titulo="Tengo pareja"
              desc="Ya tenéis pareja formada y buscais contra quién jugar."
              seleccionada={situacion === 'tengo_pareja'}
              onClick={() => setSituacion('tengo_pareja')}
            />
            <OpcionCard
              titulo="Busco pareja"
              desc="Juegas solo y quieres encontrar compañero/a para formar pareja."
              seleccionada={situacion === 'busco_pareja'}
              onClick={() => setSituacion('busco_pareja')}
            />
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <NavBotones onAtras={anterior} onContinuar={avanzar} />
        </div>
      )}

      {/* ── PANTALLA: jugador1 ──────────────────────────────────────── */}
      {pantallaActual === 'jugador1' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            {tienePareja ? 'Jugador 1 — tus datos' : 'Tus datos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Esta información la verán los demás al buscarte.
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

      {/* ── PANTALLA: jugador2 (solo si tiene pareja) ───────────────── */}
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

      {/* ── PANTALLA: ubicacion ─────────────────────────────────────── */}
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
                  type="button"
                  key={o.id}
                  className={`chip ${disponibilidad.includes(o.id) ? 'selected' : ''}`}
                  onClick={() => toggleDisponibilidad(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descripcion (opcional)</label>
            <textarea
              maxLength={150} rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Algo sobre tu juego o disponibilidad..."
            />
          </div>

          <div className="form-group">
            <label>Codigo de referido (opcional)</label>
            <input value={codigoReferido} onChange={(e) => setCodigoReferido(e.target.value)} placeholder="Ej. AB12CD3" />
          </div>

          {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          <NavBotones onAtras={anterior} labelContinuar="Entrar a MeetRacquet" cargando={cargando} />
        </form>
      )}
    </div>
  );
}
