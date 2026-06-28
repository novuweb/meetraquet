import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
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

function AvatarUpload({ preview, nombre, onFile }) {
  return (
    <label htmlFor="pareja-foto" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
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
      <input id="pareja-foto" type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
    </label>
  );
}

function buildPasos(modo) {
  const esTenis = modo?.includes('tenis');
  const esIndividual = modo?.endsWith('_individual');
  const esBuscaPareja = modo?.endsWith('_pareja');
  const esTienePareja = modo?.endsWith('_rival');

  if (esIndividual) return ['nivel', 'desc'];
  if (esBuscaPareja) return ['nivel', 'desc', 'busco_pareja'];
  if (esTienePareja) return ['mi_nivel', 'mi_desc', 'pareja_nombre', 'pareja_foto', 'pareja_nivel', 'desc_equipo'];
  return ['nivel', 'desc'];
}

export default function OnboardingModo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const modo = state?.modo || profile?.modo_activo || 'tenis_individual';
  const esTenis = modo.includes('tenis');
  const esTienePareja = modo.endsWith('_rival');
  const esBuscaPareja = modo.endsWith('_pareja');

  const pasos = buildPasos(modo);
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [miNivel, setMiNivel] = useState('');
  const [miDesc, setMiDesc] = useState('');
  const [buscoParejaDesc, setBuscoParejaDesc] = useState('');
  const [parejaNombre, setParejaNombre] = useState('');
  const [parejaFotoFile, setParejaFotoFile] = useState(null);
  const [parejaFotoPreview, setParejaFotoPreview] = useState(null);
  const [parejaNivel, setParejaNivel] = useState('');
  const [descEquipo, setDescEquipo] = useState('');

  const pantallaActual = pasos[paso];

  function puedeAvanzar() {
    if (pantallaActual === 'nivel' || pantallaActual === 'mi_nivel') return !!miNivel;
    if (pantallaActual === 'desc' || pantallaActual === 'mi_desc') return miDesc.trim().length > 0;
    if (pantallaActual === 'busco_pareja') return true;
    if (pantallaActual === 'pareja_nombre') return parejaNombre.trim().length > 0;
    if (pantallaActual === 'pareja_foto') return true;
    if (pantallaActual === 'pareja_nivel') return !!parejaNivel;
    if (pantallaActual === 'desc_equipo') return true;
    return true;
  }

  function handleParejaFoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setParejaFotoFile(f);
    setParejaFotoPreview(URL.createObjectURL(f));
  }

  async function guardar() {
    setCargando(true);
    try {
      let pareja_foto_url = null;
      if (parejaFotoFile) {
        const ext = parejaFotoFile.name.split('.').pop();
        const path = `${user.id}/pareja.${ext}`;
        await supabase.storage.from('avatars').upload(path, parejaFotoFile, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        pareja_foto_url = data.publicUrl;
      }

      const modos_conf = Array.from(new Set([...(profile?.modos_configurados || []), modo]));

      let dobles_busca = null;
      if (esTienePareja) dobles_busca = 'rival';
      else if (esBuscaPareja) dobles_busca = 'pareja';

      const updates = {
        modo_activo: modo,
        modos_configurados: modos_conf,
        juega_tenis: modo.includes('tenis') ? true : (profile?.juega_tenis || false),
        juega_padel: modo.includes('padel') ? true : (profile?.juega_padel || false),
        dobles_busca,
        perfil_completo: true,
        ...(esTenis
          ? { nivel_tenis: miNivel, descripcion_tenis: miDesc }
          : { nivel_padel: miNivel, descripcion_padel: miDesc }
        ),
        ...(esBuscaPareja && { busco_pareja_desc: buscoParejaDesc }),
        ...(esTienePareja && {
          pareja_nombre: parejaNombre,
          pareja_foto_url,
          pareja_nivel: parejaNivel,
          descripcion_equipo: descEquipo,
        }),
      };

      await supabase.from('profiles').update(updates).eq('id', user.id);
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
  function retroceder() { setError(''); setPaso(p => Math.max(p - 1, 0)); }

  const esUltimoPaso = paso === pasos.length - 1;

  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 40 }} />
      </div>
      <Barra paso={paso} total={pasos.length} />

      {(pantallaActual === 'nivel' || pantallaActual === 'mi_nivel') && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Tu nivel de juego</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Esto nos ayuda a encontrarte rivales o companeros de nivel similar.
          </p>
          <ChipNivel value={miNivel} onChange={setMiNivel} />
        </div>
      )}

      {(pantallaActual === 'desc' || pantallaActual === 'mi_desc') && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Cuentanos sobre tu juego</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Maximo 150 caracteres. Que vean los demas al verte en el matchmaking.
          </p>
          <div className="form-group">
            <textarea
              rows={4} maxLength={150} value={miDesc}
              onChange={(e) => setMiDesc(e.target.value)}
              placeholder="Cuentanos algo sobre tu juego..."
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{miDesc.length}/150</p>
          </div>
        </div>
      )}

      {pantallaActual === 'busco_pareja' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Que buscas en una pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Describe el tipo de companero que buscas. Campo opcional.
          </p>
          <div className="form-group">
            <textarea
              rows={4} maxLength={150} value={buscoParejaDesc}
              onChange={(e) => setBuscoParejaDesc(e.target.value)}
              placeholder="Describe el companero ideal..."
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{buscoParejaDesc.length}/150</p>
          </div>
        </div>
      )}

      {pantallaActual === 'pareja_nombre' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>El nombre de tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Como se llama tu companero o companera.
          </p>
          <div className="form-group">
            <input
              value={parejaNombre}
              onChange={(e) => setParejaNombre(e.target.value)}
              placeholder="Nombre de tu pareja"
            />
          </div>
        </div>
      )}

      {pantallaActual === 'pareja_foto' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Foto de tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Opcional. Si no subes foto se usaran las iniciales.
          </p>
          <AvatarUpload preview={parejaFotoPreview} nombre={parejaNombre} onFile={handleParejaFoto} />
        </div>
      )}

      {pantallaActual === 'pareja_nivel' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Nivel de tu pareja</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            El nivel de juego de {parejaNombre || 'tu pareja'}.
          </p>
          <ChipNivel value={parejaNivel} onChange={setParejaNivel} />
        </div>
      )}

      {pantallaActual === 'desc_equipo' && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Describid vuestro equipo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Que veran los rivales al encontraros en el matchmaking. Campo opcional.
          </p>
          <div className="form-group">
            <textarea
              rows={4} maxLength={150} value={descEquipo}
              onChange={(e) => setDescEquipo(e.target.value)}
              placeholder="Cuentanos algo sobre vosotros como equipo..."
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{descEquipo.length}/150</p>
          </div>
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {paso > 0 && (
          <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={retroceder}>
            Atras
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 2, opacity: puedeAvanzar() ? 1 : .4 }}
          onClick={avanzar}
          disabled={cargando}
        >
          {cargando ? 'Guardando...' : esUltimoPaso ? 'Entrar al matchmaking' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
