import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useModo } from '../hooks/useModo.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import { DISPONIBILIDAD_OPCIONES } from '../lib/disponibilidad';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competicion'];

const MODOS_DEPORTE = [
  { id: 'individual', titulo: 'Individual', desc: 'Busco rival para jugar uno contra uno' },
  { id: 'dobles_pareja', titulo: 'Dobles — Busco pareja', desc: 'Quiero encontrar companero de dobles' },
  { id: 'dobles_rival', titulo: 'Dobles — Tengo pareja', desc: 'Ya jugamos en pareja, buscamos rivales' },
];

function Barra({ paso, total }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
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

function SportHeader({ deporte }) {
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 10, marginBottom: 20,
      background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)',
      display: 'inline-block',
    }}>
      <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>
        Configurando {deporte}
      </span>
    </div>
  );
}

function ModeCard({ titulo, desc, sel, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 14,
      cursor: 'pointer', transition: 'all .18s',
      border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
      background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
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
}

function Chips({ opciones, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((o) => (
        <button key={o} type="button"
          className={`chip ${value === o ? 'selected' : ''}`}
          style={{ fontSize: 15, padding: '10px 18px' }}
          onClick={() => onChange(value === o ? '' : o)}
        >{o}</button>
      ))}
    </div>
  );
}

function FotoUpload({ preview, onChange, circular = true, label }) {
  const id = `foto-${label.replace(/\s/g, '')}`;
  return (
    <label htmlFor={id} style={{ cursor: 'pointer', display: 'block', textAlign: circular ? 'center' : 'left' }}>
      <div style={{
        width: circular ? 88 : '100%', height: circular ? 88 : 160,
        borderRadius: circular ? '50%' : 14,
        margin: circular ? '0 auto 10px' : '0 0 10px',
        border: '2px dashed var(--border)', overflow: 'hidden',
        background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: circular ? 28 : 14, color: 'var(--text-muted)',
      }}>
        {!preview && (circular ? '+' : 'Subir foto')}
      </div>
      <p style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center' }}>{preview ? 'Cambiar foto' : label}</p>
      <input id={id} type="file" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f, URL.createObjectURL(f)); }}
        style={{ display: 'none' }}
      />
    </label>
  );
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const { cambiarModo } = useModo();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);

  // Comunes
  const [deportes, setDeportes] = useState([]);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [isla, setIsla] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);

  // Tenis
  const [tenisModo, setTenisModo] = useState('');
  const [tenisNivel, setTenisNivel] = useState('');
  const [tenisDesc, setTenisDesc] = useState('');
  const [tenisParejaNombre, setTenisParejaNombre] = useState('');
  const [tenisParejaEdad, setTenisParejaEdad] = useState('');
  const [tenisParejaFoto, setTenisParejaFoto] = useState(null);
  const [tenisParejaFotoPreview, setTenisParejaFotoPreview] = useState(null);
  const [tenisFotoJuntos, setTenisFotoJuntos] = useState(null);
  const [tenisFotoJuntosPreview, setTenisFotoJuntosPreview] = useState(null);

  // Padel
  const [padelModo, setPadelModo] = useState('');
  const [padelNivel, setPadelNivel] = useState('');
  const [padelDesc, setPadelDesc] = useState('');
  const [padelParejaNombre, setPadelParejaNombre] = useState('');
  const [padelParejaEdad, setPadelParejaEdad] = useState('');
  const [padelParejaFoto, setPadelParejaFoto] = useState(null);
  const [padelParejaFotoPreview, setPadelParejaFotoPreview] = useState(null);
  const [padelFotoJuntos, setPadelFotoJuntos] = useState(null);
  const [padelFotoJuntosPreview, setPadelFotoJuntosPreview] = useState(null);

  const tieneTenis = deportes.includes('tenis');
  const tienePadel = deportes.includes('padel');

  const steps = useMemo(() => {
    const s = ['deportes', 'foto', 'nombre', 'edad', 'ubicacion'];
    if (tieneTenis) {
      s.push('tenis_modo');
      if (tenisModo === 'individual' || tenisModo === 'dobles_pareja') {
        s.push('tenis_nivel', 'tenis_desc');
      } else if (tenisModo === 'dobles_rival') {
        s.push('tenis_nivel', 'tenis_pareja_nombre', 'tenis_pareja_edad', 'tenis_pareja_foto', 'tenis_foto_juntos');
      }
    }
    if (tienePadel) {
      s.push('padel_modo');
      if (padelModo === 'individual' || padelModo === 'dobles_pareja') {
        s.push('padel_nivel', 'padel_desc');
      } else if (padelModo === 'dobles_rival') {
        s.push('padel_nivel', 'padel_pareja_nombre', 'padel_pareja_edad', 'padel_pareja_foto', 'padel_foto_juntos');
      }
    }
    return s;
  }, [tieneTenis, tienePadel, tenisModo, padelModo]);

  const pasoSeguro = Math.min(paso, steps.length - 1);
  const pasoActual = steps[pasoSeguro];
  const esTenisStep = pasoActual?.startsWith('tenis_');
  const esPadelStep = pasoActual?.startsWith('padel_');
  const esUltimoPaso = pasoSeguro >= steps.length - 1;

  function puedeAvanzar() {
    switch (pasoActual) {
      case 'deportes': return deportes.length > 0;
      case 'foto': return true;
      case 'nombre': return nombre.trim().length > 0;
      case 'edad': return !!edad && Number(edad) >= 12 && Number(edad) <= 99;
      case 'ubicacion': return !!provincia && (!esProvinciaCanaria(provincia) || !!isla);
      case 'tenis_modo': return !!tenisModo;
      case 'tenis_nivel': return !!tenisNivel;
      case 'tenis_desc': return true;
      case 'tenis_pareja_nombre': return tenisParejaNombre.trim().length > 0;
      case 'tenis_pareja_edad': return !!tenisParejaEdad && Number(tenisParejaEdad) >= 12;
      case 'tenis_pareja_foto': return true;
      case 'tenis_foto_juntos': return true;
      case 'padel_modo': return !!padelModo;
      case 'padel_nivel': return !!padelNivel;
      case 'padel_desc': return true;
      case 'padel_pareja_nombre': return padelParejaNombre.trim().length > 0;
      case 'padel_pareja_edad': return !!padelParejaEdad && Number(padelParejaEdad) >= 12;
      case 'padel_pareja_foto': return true;
      case 'padel_foto_juntos': return true;
      default: return true;
    }
  }

  function avanzar() {
    setErr('');
    if (!puedeAvanzar()) { setErr('Rellena este campo para continuar.'); return; }
    if (esUltimoPaso) { guardar(); return; }
    setPaso((p) => p + 1);
  }
  function retroceder() { setErr(''); setPaso((p) => Math.max(p - 1, 0)); }

  async function uploadFoto(file, path) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fullPath = `${user.id}/${path}.${ext}`;
    await supabase.storage.from('avatars').upload(fullPath, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(fullPath);
    return data.publicUrl;
  }

  async function guardar() {
    setCargando(true);
    try {
      const avatar_url = await uploadFoto(foto, 'avatar');
      const tenis_pareja_foto_url = await uploadFoto(tenisParejaFoto, 'tenis-pareja');
      const tenis_foto_juntos_url = await uploadFoto(tenisFotoJuntos, 'tenis-juntos');
      const padel_pareja_foto_url = await uploadFoto(padelParejaFoto, 'padel-pareja');
      const padel_foto_juntos_url = await uploadFoto(padelFotoJuntos, 'padel-juntos');

      const modosConf = [];
      if (tieneTenis && tenisModo) modosConf.push(`tenis_${tenisModo}`);
      if (tienePadel && padelModo) modosConf.push(`padel_${padelModo}`);
      const modo_activo = modosConf[0] || null;

      const deporteDB = tieneTenis && tienePadel ? 'Ambos' : tieneTenis ? 'Tenis' : 'Pádel';

      const { error: updateErr } = await supabase.from('profiles').update({
        nombre: nombre.trim(),
        edad: Number(edad),
        provincia,
        isla: esProvinciaCanaria(provincia) ? isla : null,
        disponibilidad,
        avatar_url,
        deporte: deporteDB,
        modo_activo,
        modos_configurados: modosConf,
        tenis_modo: tieneTenis ? tenisModo : null,
        tenis_nivel: tieneTenis ? tenisNivel : null,
        tenis_descripcion: tieneTenis ? tenisDesc : null,
        tenis_pareja_nombre: (tieneTenis && tenisModo === 'dobles_rival') ? tenisParejaNombre : null,
        tenis_pareja_edad: (tieneTenis && tenisModo === 'dobles_rival') ? Number(tenisParejaEdad) : null,
        tenis_pareja_foto_url,
        tenis_foto_juntos_url,
        padel_modo: tienePadel ? padelModo : null,
        padel_nivel: tienePadel ? padelNivel : null,
        padel_descripcion: tienePadel ? padelDesc : null,
        padel_pareja_nombre: (tienePadel && padelModo === 'dobles_rival') ? padelParejaNombre : null,
        padel_pareja_edad: (tienePadel && padelModo === 'dobles_rival') ? Number(padelParejaEdad) : null,
        padel_pareja_foto_url,
        padel_foto_juntos_url,
        dobles_busca: modo_activo?.endsWith('_rival') ? 'rival' : modo_activo?.endsWith('_pareja') ? 'pareja' : 'individual',
        perfil_completo: true,
        puntos: 0,
      }).eq('id', user.id);

      if (updateErr) throw new Error(updateErr.message);

      if (modo_activo) cambiarModo(modo_activo);
      await refreshProfile();
      navigate('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setCargando(false);
    }
  }

  function toggleDeporte(d) {
    setDeportes((prev) => {
      if (d === 'ambos') return prev.length === 2 ? [] : ['tenis', 'padel'];
      return prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
    });
  }

  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 40 }} />
      </div>
      <Barra paso={pasoSeguro} total={steps.length} />

      {esTenisStep && <SportHeader deporte="Tenis" />}
      {esPadelStep && <SportHeader deporte="Padel" />}

      {pasoActual === 'deportes' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Que practicas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Puedes elegir mas de uno.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'tenis', titulo: 'Tenis', desc: 'Individual o dobles' },
              { id: 'padel', titulo: 'Padel', desc: 'Siempre en pareja, pista cerrada' },
              { id: 'ambos', titulo: 'Ambos', desc: 'Practico tenis y padel' },
            ].map(({ id, titulo, desc }) => (
              <ModeCard key={id} titulo={titulo} desc={desc}
                sel={id === 'ambos' ? deportes.length === 2 : deportes.includes(id)}
                onClick={() => toggleDeporte(id)}
              />
            ))}
          </div>
        </div>
      )}

      {pasoActual === 'foto' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu foto de perfil</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Opcional. Si no subes foto se usaran tus iniciales.</p>
          <FotoUpload preview={fotoPreview} onChange={(f, p) => { setFoto(f); setFotoPreview(p); }} circular label="Subir foto" />
        </div>
      )}

      {pasoActual === 'nombre' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Tu nombre</h1>
          <div className="form-group">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'edad' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Cuantos anos tienes</h1>
          <div className="form-group">
            <input type="number" min={12} max={99} value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Ej. 28" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'ubicacion' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Donde juegas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Para mostrarte jugadores cerca de ti.</p>
          <SelectorUbicacion provincia={provincia} isla={isla}
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
        </div>
      )}

      {pasoActual === 'tenis_modo' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Como juegas al tenis</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODOS_DEPORTE.map(({ id, titulo, desc }) => (
              <ModeCard key={id} titulo={titulo} desc={desc} sel={tenisModo === id} onClick={() => setTenisModo(id)} />
            ))}
          </div>
        </div>
      )}

      {pasoActual === 'tenis_nivel' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Tu nivel de tenis</h1>
          <Chips opciones={NIVELES} value={tenisNivel} onChange={setTenisNivel} />
        </div>
      )}

      {pasoActual === 'tenis_desc' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Cuentanos algo sobre tu juego</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Opcional. Maximo 150 caracteres.</p>
          <textarea className="form-group" maxLength={150} rows={4} value={tenisDesc} onChange={(e) => setTenisDesc(e.target.value)} placeholder="Algo sobre tu juego de tenis..." style={{ width: '100%' }} />
        </div>
      )}

      {pasoActual === 'tenis_pareja_nombre' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Nombre de tu pareja de tenis</h1>
          <div className="form-group">
            <input value={tenisParejaNombre} onChange={(e) => setTenisParejaNombre(e.target.value)} placeholder="Nombre de tu companero/a" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'tenis_pareja_edad' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Edad de {tenisParejaNombre || 'tu pareja'}</h1>
          <div className="form-group">
            <input type="number" min={12} max={99} value={tenisParejaEdad} onChange={(e) => setTenisParejaEdad(e.target.value)} placeholder="Ej. 30" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'tenis_pareja_foto' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de {tenisParejaNombre || 'tu pareja'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Opcional. Si no subes foto se usaran sus iniciales.</p>
          <FotoUpload preview={tenisParejaFotoPreview} onChange={(f, p) => { setTenisParejaFoto(f); setTenisParejaFotoPreview(p); }} circular label="Subir foto de tu pareja" />
        </div>
      )}

      {pasoActual === 'tenis_foto_juntos' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de los dos juntos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Opcional. Se mostrara como fondo de vuestra tarjeta en el matchmaking.</p>
          <FotoUpload preview={tenisFotoJuntosPreview} onChange={(f, p) => { setTenisFotoJuntos(f); setTenisFotoJuntosPreview(p); }} circular={false} label="Subir foto juntos" />
        </div>
      )}

      {pasoActual === 'padel_modo' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Como juegas al padel</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODOS_DEPORTE.map(({ id, titulo, desc }) => (
              <ModeCard key={id} titulo={titulo} desc={desc} sel={padelModo === id} onClick={() => setPadelModo(id)} />
            ))}
          </div>
        </div>
      )}

      {pasoActual === 'padel_nivel' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Tu nivel de padel</h1>
          <Chips opciones={NIVELES} value={padelNivel} onChange={setPadelNivel} />
        </div>
      )}

      {pasoActual === 'padel_desc' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Cuentanos algo sobre tu juego</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Opcional. Maximo 150 caracteres.</p>
          <textarea className="form-group" maxLength={150} rows={4} value={padelDesc} onChange={(e) => setPadelDesc(e.target.value)} placeholder="Algo sobre tu juego de padel..." style={{ width: '100%' }} />
        </div>
      )}

      {pasoActual === 'padel_pareja_nombre' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Nombre de tu pareja de padel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Puede ser distinta a tu pareja de tenis.</p>
          <div className="form-group">
            <input value={padelParejaNombre} onChange={(e) => setPadelParejaNombre(e.target.value)} placeholder="Nombre de tu companero/a" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'padel_pareja_edad' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Edad de {padelParejaNombre || 'tu pareja'}</h1>
          <div className="form-group">
            <input type="number" min={12} max={99} value={padelParejaEdad} onChange={(e) => setPadelParejaEdad(e.target.value)} placeholder="Ej. 30" autoFocus />
          </div>
        </div>
      )}

      {pasoActual === 'padel_pareja_foto' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de {padelParejaNombre || 'tu pareja'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Opcional.</p>
          <FotoUpload preview={padelParejaFotoPreview} onChange={(f, p) => { setPadelParejaFoto(f); setPadelParejaFotoPreview(p); }} circular label="Subir foto de tu pareja de padel" />
        </div>
      )}

      {pasoActual === 'padel_foto_juntos' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de los dos juntos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>Opcional. Se mostrara como fondo de vuestra tarjeta.</p>
          <FotoUpload preview={padelFotoJuntosPreview} onChange={(f, p) => { setPadelFotoJuntos(f); setPadelFotoJuntosPreview(p); }} circular={false} label="Subir foto juntos" />
        </div>
      )}

      {err && <p className="error-text" style={{ marginTop: 12 }}>{err}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {paso > 0 && (
          <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={retroceder}>Atras</button>
        )}
        <button
          type="button" className="btn-primary"
          style={{ flex: 2, opacity: puedeAvanzar() ? 1 : .4 }}
          onClick={avanzar} disabled={cargando}
        >
          {esUltimoPaso ? (cargando ? 'Guardando...' : 'Entrar') : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
