import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useModo } from '../hooks/useModo.jsx';
import { supabase } from '../lib/supabaseClient';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competicion'];

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

function ChipNivel({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {NIVELES.map((n) => (
        <button key={n} type="button"
          className={`chip ${value === n ? 'selected' : ''}`}
          style={{ fontSize: 15, padding: '10px 18px' }}
          onClick={() => onChange(n)}
        >{n}</button>
      ))}
    </div>
  );
}

function AvatarUpload({ preview, nombre, onFile, id = 'pareja-foto' }) {
  return (
    <label htmlFor={id} style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%', margin: '0 auto 10px',
        border: '2px dashed var(--border)', overflow: 'hidden',
        background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 800, color: 'var(--text-muted)',
      }}>
        {!preview && (nombre?.[0]?.toUpperCase() || '+')}
      </div>
      <p style={{ fontSize: 12, color: 'var(--accent)' }}>Subir foto (opcional)</p>
      <input id={id} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
    </label>
  );
}

function FotoJuntosUpload({ preview, onFile }) {
  return (
    <label htmlFor="foto-juntos" style={{ cursor: 'pointer', display: 'block' }}>
      <div style={{
        width: '100%', height: 150, borderRadius: 14, overflow: 'hidden',
        border: '2px dashed var(--border)',
        background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: 'var(--text-muted)', marginBottom: 6,
      }}>
        {!preview && 'Subir foto'}
      </div>
      <p style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center' }}>{preview ? 'Cambiar foto' : 'Opcional'}</p>
      <input id="foto-juntos" type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
    </label>
  );
}

function buildPasos(modo) {
  const esTienePareja = modo?.endsWith('_rival');
  if (esTienePareja) return ['nivel', 'pareja_nombre', 'pareja_edad', 'pareja_foto', 'foto_juntos'];
  return ['nivel', 'desc'];
}

export default function OnboardingModo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const { cambiarModo } = useModo();
  const modo = state?.modo || profile?.modo_activo || 'tenis_individual';
  const esTenis = modo.includes('tenis');
  const esTienePareja = modo.endsWith('_rival');
  const esBuscaPareja = modo.endsWith('_pareja');

  const pasos = buildPasos(modo);
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [nivel, setNivel] = useState('');
  const [desc, setDesc] = useState('');
  const [parejaNombre, setParejaNombre] = useState('');
  const [parejaEdad, setParejaEdad] = useState('');
  const [parejaFotoFile, setParejaFotoFile] = useState(null);
  const [parejaFotoPreview, setParejaFotoPreview] = useState(null);
  const [juntosFile, setJuntosFile] = useState(null);
  const [juntosPreview, setJuntosPreview] = useState(null);

  const pantallaActual = pasos[paso];

  function puedeAvanzar() {
    if (pantallaActual === 'nivel') return !!nivel;
    if (pantallaActual === 'desc') return true;
    if (pantallaActual === 'pareja_nombre') return parejaNombre.trim().length > 0;
    if (pantallaActual === 'pareja_edad') return !!parejaEdad && Number(parejaEdad) >= 12;
    if (pantallaActual === 'pareja_foto') return true;
    if (pantallaActual === 'foto_juntos') return true;
    return true;
  }

  async function guardar() {
    setCargando(true);
    try {
      const pathPre = esTenis ? 'tenis' : 'padel';

      let pareja_foto_url = null;
      if (parejaFotoFile) {
        const ext = parejaFotoFile.name.split('.').pop();
        const path = `${user.id}/${pathPre}-pareja.${ext}`;
        await supabase.storage.from('avatars').upload(path, parejaFotoFile, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        pareja_foto_url = data.publicUrl;
      }

      let foto_juntos_url = null;
      if (juntosFile) {
        const ext = juntosFile.name.split('.').pop();
        const path = `${user.id}/${pathPre}-juntos.${ext}`;
        await supabase.storage.from('avatars').upload(path, juntosFile, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        foto_juntos_url = data.publicUrl;
      }

      const modos_conf = Array.from(new Set([...(profile?.modos_configurados || []), modo]));
      const dobles_busca = esTienePareja ? 'rival' : esBuscaPareja ? 'pareja' : 'individual';

      const updates = {
        modo_activo: modo,
        modos_configurados: modos_conf,
        dobles_busca,
        perfil_completo: true,
        ...(esTenis ? {
          tenis_modo: modo.replace('tenis_', ''),
          tenis_nivel: nivel,
          tenis_descripcion: desc || null,
          ...(esTienePareja && {
            tenis_pareja_nombre: parejaNombre,
            tenis_pareja_edad: Number(parejaEdad),
            ...(pareja_foto_url && { tenis_pareja_foto_url: pareja_foto_url }),
            ...(foto_juntos_url && { tenis_foto_juntos_url: foto_juntos_url }),
          }),
        } : {
          padel_modo: modo.replace('padel_', ''),
          padel_nivel: nivel,
          padel_descripcion: desc || null,
          ...(esTienePareja && {
            padel_pareja_nombre: parejaNombre,
            padel_pareja_edad: Number(parejaEdad),
            ...(pareja_foto_url && { padel_pareja_foto_url: pareja_foto_url }),
            ...(foto_juntos_url && { padel_foto_juntos_url: foto_juntos_url }),
          }),
        }),
      };

      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateErr) throw new Error(updateErr.message);

      cambiarModo(modo);
      await refreshProfile();
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function avanzar() {
    setError('');
    if (!puedeAvanzar()) { setError('Rellena este campo para continuar.'); return; }
    if (paso < pasos.length - 1) setPaso(paso + 1);
    else guardar();
  }
  function retroceder() { setError(''); setPaso((p) => Math.max(p - 1, 0)); }

  const esUltimoPaso = paso === pasos.length - 1;
  const deporteLabel = esTenis ? 'tenis' : 'padel';

  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 40 }} />
      </div>

      <div style={{
        padding: '6px 12px', borderRadius: 8, marginBottom: 20, display: 'inline-block',
        background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)',
      }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
          Configurando {esTenis ? 'Tenis' : 'Padel'}
        </span>
      </div>

      <Barra paso={paso} total={pasos.length} />

      {pantallaActual === 'nivel' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tu nivel de {deporteLabel}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Esto nos ayuda a encontrarte rivales de nivel similar.
          </p>
          <ChipNivel value={nivel} onChange={setNivel} />
        </div>
      )}

      {pantallaActual === 'desc' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Cuentanos sobre tu juego</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Opcional. Maximo 150 caracteres.
          </p>
          <div className="form-group">
            <textarea
              rows={4} maxLength={150} value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Algo sobre tu juego..."
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{desc.length}/150</p>
          </div>
        </div>
      )}

      {pantallaActual === 'pareja_nombre' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Nombre de tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Como se llama tu companero o companera de {deporteLabel}.
          </p>
          <div className="form-group">
            <input value={parejaNombre} onChange={(e) => setParejaNombre(e.target.value)} placeholder="Nombre" autoFocus />
          </div>
        </div>
      )}

      {pantallaActual === 'pareja_edad' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Edad de {parejaNombre || 'tu pareja'}</h1>
          <div className="form-group" style={{ marginTop: 20 }}>
            <input type="number" min={12} max={99} value={parejaEdad} onChange={(e) => setParejaEdad(e.target.value)} placeholder="Ej. 30" autoFocus />
          </div>
        </div>
      )}

      {pantallaActual === 'pareja_foto' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de {parejaNombre || 'tu pareja'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Opcional. Si no subes foto se usaran sus iniciales.
          </p>
          <AvatarUpload
            preview={parejaFotoPreview} nombre={parejaNombre}
            onFile={(e) => { const f = e.target.files?.[0]; if (f) { setParejaFotoFile(f); setParejaFotoPreview(URL.createObjectURL(f)); } }}
          />
        </div>
      )}

      {pantallaActual === 'foto_juntos' && (
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Foto de los dos juntos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Opcional. Se mostrara como fondo de vuestra tarjeta en el matchmaking.
          </p>
          <FotoJuntosUpload
            preview={juntosPreview}
            onFile={(e) => { const f = e.target.files?.[0]; if (f) { setJuntosFile(f); setJuntosPreview(URL.createObjectURL(f)); } }}
          />
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
          onClick={avanzar} disabled={cargando}
        >
          {cargando ? 'Guardando...' : esUltimoPaso ? 'Entrar al matchmaking' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
