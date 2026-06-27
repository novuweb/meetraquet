import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import { DISPONIBILIDAD_OPCIONES } from '../lib/disponibilidad';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competición'];

// ── helpers ────────────────────────────────────────────────────────────────
function Barra({ paso, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 4,
          background: i < paso ? 'var(--accent)' : 'var(--bg-elev)',
          transition: 'background .3s',
        }} />
      ))}
    </div>
  );
}

function ChipRow({ opciones, value, onChange }) {
  return (
    <div className="chip-row">
      {opciones.map((o) => (
        <button
          type="button"
          key={o}
          className={`chip ${value === o ? 'selected' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function FotoUpload({ preview, onChange }) {
  return (
    <div className="form-group" style={{ textAlign: 'center' }}>
      <label htmlFor="foto-input" style={{ cursor: 'pointer' }}>
        <div className="avatar" style={{
          width: 100, height: 100, margin: '0 auto 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--border)', overflow: 'hidden',
          fontSize: 13, color: 'var(--text-muted)',
          backgroundImage: preview ? `url(${preview})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          {!preview && 'Subir foto'}
        </div>
      </label>
      <input id="foto-input" type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toca para subir foto (opcional)</p>
    </div>
  );
}

// ── componente principal ───────────────────────────────────────────────────
export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // paso 0 = selección de modalidad
  const [paso, setPaso] = useState(0);
  const [modalidad, setModalidad] = useState(null); // 'individual' | 'dobles' | 'padel'
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // datos jugador 1 (o único, si individual)
  const [foto1, setFoto1] = useState(null);
  const [preview1, setPreview1] = useState(profile?.avatar_url || null);
  const [nombre1, setNombre1] = useState(profile?.nombre || '');
  const [edad1, setEdad1] = useState(profile?.edad || '');
  const [nivel1, setNivel1] = useState(profile?.nivel || '');

  // datos jugador 2 (solo dobles/padel)
  const [nombre2, setNombre2] = useState('');
  const [edad2, setEdad2] = useState('');
  const [nivel2, setNivel2] = useState('');

  // datos comunes
  const [descripcion, setDescripcion] = useState(profile?.descripcion || '');
  const [provincia, setProvincia] = useState(profile?.provincia || '');
  const [isla, setIsla] = useState(profile?.isla || '');
  const [disponibilidad, setDisponibilidad] = useState(profile?.disponibilidad || []);
  const [codigoReferido, setCodigoReferido] = useState('');

  const esPareja = modalidad === 'dobles' || modalidad === 'padel';

  // cuántos pasos tiene el flujo según modalidad
  // individual: 0(modal) → 1(foto+nombre+edad) → 2(nivel+desc) → 3(ubicación+disp) → submit
  // dobles/padel: 0 → 1(jugador1) → 2(jugador2) → 3(ubicación+disp) → submit
  const totalPasos = 4; // pasos 1-3 + el 0 de selección

  function handleFoto1(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto1(f);
    setPreview1(URL.createObjectURL(f));
  }

  function toggleDisponibilidad(id) {
    setDisponibilidad((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  function avanzar() {
    setError('');
    if (paso === 0) {
      if (!modalidad) { setError('Elige una modalidad.'); return; }
      setPaso(1); return;
    }
    if (paso === 1) {
      if (!nombre1.trim()) { setError('Escribe tu nombre.'); return; }
      if (!edad1 || Number(edad1) < 12 || Number(edad1) > 99) { setError('Edad no válida.'); return; }
      if (!nivel1) { setError('Selecciona tu nivel.'); return; }
      setPaso(2); return;
    }
    if (paso === 2) {
      if (esPareja) {
        if (!nombre2.trim()) { setError('Escribe el nombre del jugador 2.'); return; }
        if (!edad2 || Number(edad2) < 12 || Number(edad2) > 99) { setError('Edad no válida.'); return; }
        if (!nivel2) { setError('Selecciona el nivel del jugador 2.'); return; }
      }
      setPaso(3); return;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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

      const nombreFinal = esPareja ? `${nombre1.trim()} & ${nombre2.trim()}` : nombre1.trim();
      const nivelFinal = esPareja ? `${nivel1} / ${nivel2}` : nivel1;
      const deporteFinal = modalidad === 'padel' ? 'Pádel' : 'Tenis';

      const { error: updateErr } = await supabase.from('profiles').update({
        nombre: nombreFinal,
        edad: Number(edad1),
        deporte: deporteFinal,
        nivel: nivelFinal,
        descripcion,
        provincia,
        isla: esProvinciaCanaria(provincia) ? isla : null,
        disponibilidad,
        avatar_url,
        perfil_completo: true,
        puntos: profile?.puntos || 0,
        ...(esPareja ? { dobles_busca: 'rival' } : {}),
      }).eq('id', user.id);

      if (updateErr) throw updateErr;

      if (codigoReferido.trim()) {
        await supabase.rpc('aplicar_codigo_referido', { p_codigo: codigoReferido.trim() });
      }

      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 48 }} />
      </div>

      {paso > 0 && <Barra paso={paso} total={3} />}

      {/* PASO 0 — Modalidad */}
      {paso === 0 && (
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>¿Qué vas a jugar?</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Esto determina cómo se muestra tu perfil a otros jugadores.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              { id: 'individual', titulo: 'Tenis individual', desc: 'Juegas solo, buscas rivales para 1vs1.' },
              { id: 'dobles', titulo: 'Tenis dobles', desc: 'Jugais en pareja, buscais rivales o compañeros.' },
              { id: 'padel', titulo: 'Pádel', desc: 'Jugais en pareja, buscais rivales o compañeros.' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModalidad(m.id)}
                style={{
                  textAlign: 'left', padding: '16px 18px', borderRadius: 14,
                  border: `2px solid ${modalidad === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: modalidad === m.id ? 'rgba(34,197,94,.08)' : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'border-color .2s, background .2s',
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: 4, color: modalidad === m.id ? 'var(--accent)' : 'var(--text)' }}>
                  {m.titulo}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.desc}</p>
              </button>
            ))}
          </div>

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={avanzar}>
            Continuar
          </button>
        </div>
      )}

      {/* PASO 1 — Jugador 1 */}
      {paso === 1 && (
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>
            {esPareja ? 'Jugador 1 — tus datos' : 'Tus datos'}
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
            <ChipRow opciones={NIVELES} value={nivel1} onChange={setNivel1} />
          </div>

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setPaso(0)}>Atrás</button>
            <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 2 — Jugador 2 (solo pareja) o directo a ubicación (individual) */}
      {paso === 2 && esPareja && (
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Jugador 2</h1>
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
            <ChipRow opciones={NIVELES} value={nivel2} onChange={setNivel2} />
          </div>

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setPaso(1)}>Atrás</button>
            <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {paso === 2 && !esPareja && (
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Un poco más</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Opcional — ayuda a los rivales a conocerte mejor.
          </p>
          <div className="form-group">
            <label>Descripción ({descripcion.length}/150)</label>
            <textarea maxLength={150} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Cuéntanos algo sobre tu juego..." />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setPaso(1)}>Atrás</button>
            <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={avanzar}>Continuar</button>
          </div>
        </div>
      )}

      {/* PASO 3 — Ubicación + disponibilidad + referido */}
      {paso === 3 && (
        <form onSubmit={handleSubmit}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Ubicación y horarios</h1>
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
            <div className="chip-row">
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

          {esPareja && (
            <div className="form-group">
              <label>Descripcion (opcional)</label>
              <textarea maxLength={150} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Algo sobre vuestra pareja..." />
            </div>
          )}

          <div className="form-group">
            <label>Código de referido (opcional)</label>
            <input value={codigoReferido} onChange={(e) => setCodigoReferido(e.target.value)} placeholder="Ej. AB12CD3" />
          </div>

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setPaso(2)}>Atrás</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={cargando}>
              {cargando ? 'Guardando...' : 'Entrar a MeetRacquet'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
