import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme';
import { useModo, MODO_LABELS, esModoTengoPareja } from '../hooks/useModo.jsx';
import { supabase } from '../lib/supabaseClient';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { playDing } from '../lib/sounds';
import { getRango, getSiguienteRango, progresoRango } from '../lib/ranks';
import { LOGROS_DEF, getLogrosConseguidos } from '../lib/achievements';
import { esProvinciaCanaria, ubicacionLabel } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import LogroModal from '../components/LogroModal.jsx';
import { DISPONIBILIDAD_OPCIONES, labelDisponibilidad } from '../lib/disponibilidad';
import HistorialPartidos from '../components/HistorialPartidos.jsx';
import CodigoReferido from '../components/CodigoReferido.jsx';
import { DEMO_MODE } from '../lib/demo';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competicion'];

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 800 }}>{value ?? '—'}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function ChipGroup({ opciones, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((o) => (
        <button key={o} type="button"
          className={`chip ${value === o ? 'selected' : ''}`}
          onClick={() => onChange(value === o ? '' : o)}
        >{o}</button>
      ))}
    </div>
  );
}

function Avatar({ url, nombre, size = 80 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundImage: url ? `url(${url})` : 'none',
      backgroundSize: 'cover', backgroundPosition: 'center',
      background: url ? undefined : 'var(--bg-elev)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800, color: 'var(--text-muted)',
      border: '2px solid var(--border)',
    }}>
      {!url && nombre?.[0]?.toUpperCase()}
    </div>
  );
}

// Campos de nivel/descripcion por deporte del modo
function camposPorModo(modo) {
  const esTenis = modo?.includes('tenis');
  return {
    nivel: esTenis ? 'nivel_tenis' : 'nivel_padel',
    descripcion: esTenis ? 'descripcion_tenis' : 'descripcion_padel',
  };
}

export default function Profile() {
  const { profile, user, refreshProfile, signOut, setProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { modo } = useModo();
  const navigate = useNavigate();

  const [tabModo, setTabModo] = useState(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [logroSel, setLogroSel] = useState(null);
  const [form, setForm] = useState({});
  const [fotoParejaFile, setFotoParejaFile] = useState(null);
  const [fotoParejaPreview, setFotoParejaPreview] = useState(null);

  const modoActivo = tabModo || modo || profile?.modo_activo;
  const tienePareja = esModoTengoPareja(modoActivo);
  const esBuscoPareja = modoActivo?.endsWith('_pareja');
  const campos = camposPorModo(modoActivo);

  useEffect(() => {
    if (profile && !tabModo) setTabModo(modo || profile.modo_activo);
  }, [profile?.id, modo]);

  useEffect(() => {
    if (profile) {
      setForm({
        nombre: profile.nombre || '',
        edad: profile.edad || '',
        nivel_tenis: profile.nivel_tenis || '',
        descripcion_tenis: profile.descripcion_tenis || '',
        nivel_padel: profile.nivel_padel || '',
        descripcion_padel: profile.descripcion_padel || '',
        pareja_nombre: profile.pareja_nombre || '',
        pareja_nivel: profile.pareja_nivel || '',
        descripcion_equipo: profile.descripcion_equipo || '',
        busco_pareja_desc: profile.busco_pareja_desc || '',
        provincia: profile.provincia || '',
        isla: profile.isla || '',
        disponibilidad: profile.disponibilidad || [],
      });
      setFotoParejaPreview(profile.pareja_foto_url || null);
    }
  }, [profile?.id]);

  if (!profile) return (
    <div className="center-screen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
        <div className="skeleton skeleton-avatar" style={{ width: 100, height: 100, margin: '0 auto' }} />
        <div className="skeleton skeleton-line" style={{ width: '60%', margin: '0 auto' }} />
        <div className="skeleton skeleton-card" style={{ height: 80 }} />
      </div>
    </div>
  );

  const rango = getRango(profile.puntos);
  const siguiente = getSiguienteRango(profile.puntos);
  const progreso = progresoRango(profile.puntos);
  const puntosAnimados = useAnimatedCounter(profile.puntos || 0);
  const prevPuntos = useRef(profile.puntos);
  useEffect(() => {
    if (profile.puntos > prevPuntos.current) playDing();
    prevPuntos.current = profile.puntos;
  }, [profile.puntos]);

  const logrosConseguidos = getLogrosConseguidos(profile);
  const idsConseguidos = logrosConseguidos.map((l) => l.id);
  const modosConfigurados = profile.modos_configurados || [];

  async function handleFotoPerfil(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (DEMO_MODE) { setProfile({ ...profile, avatar_url: URL.createObjectURL(file) }); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    await refreshProfile();
  }

  function handleFotoPareja(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setFotoParejaFile(f);
    setFotoParejaPreview(URL.createObjectURL(f));
  }

  async function guardar() {
    setGuardando(true);
    try {
      let pareja_foto_url = profile.pareja_foto_url;
      if (fotoParejaFile) {
        const ext = fotoParejaFile.name.split('.').pop();
        const path = `${user.id}/pareja.${ext}`;
        await supabase.storage.from('avatars').upload(path, fotoParejaFile, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        pareja_foto_url = data.publicUrl;
      }

      const cambioUbicacion = form.provincia !== profile.provincia || form.isla !== profile.isla;
      if (cambioUbicacion) {
        await supabase.rpc('cambiar_ubicacion', {
          p_provincia: form.provincia,
          p_isla: esProvinciaCanaria(form.provincia) ? form.isla : null,
        });
      }

      await supabase.from('profiles').update({
        nombre: form.nombre,
        edad: Number(form.edad),
        disponibilidad: form.disponibilidad || [],
        nivel_tenis: form.nivel_tenis || null,
        descripcion_tenis: form.descripcion_tenis || null,
        nivel_padel: form.nivel_padel || null,
        descripcion_padel: form.descripcion_padel || null,
        pareja_nombre: form.pareja_nombre || null,
        pareja_nivel: form.pareja_nivel || null,
        pareja_foto_url,
        descripcion_equipo: form.descripcion_equipo || null,
        busco_pareja_desc: form.busco_pareja_desc || null,
      }).eq('id', user.id);

      await refreshProfile();
      setEditando(false);
      setFotoParejaFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  }

  const dispText = profile.disponibilidad?.length
    ? profile.disponibilidad.map(labelDisponibilidad).filter(Boolean).join(', ')
    : '—';

  const nivelActivo = profile[campos.nivel] || '—';
  const descActiva = profile[campos.descripcion] || '';

  return (
    <div className="page">
      {/* Header con modo activo */}
      <div className="page-header" style={{ padding: 0, marginBottom: 18 }}>
        <h1>Mi perfil</h1>
        <button className="chip" onClick={() => navigate('/modo')} style={{ fontSize: 12 }}>
          {modoActivo ? MODO_LABELS[modoActivo] : 'Elegir modo'}
        </button>
      </div>

      {/* Foto + info principal */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <label htmlFor="foto-perfil" style={{ cursor: 'pointer' }}>
          <Avatar url={profile.avatar_url} nombre={profile.nombre} size={96} />
          <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, marginBottom: 8 }}>Cambiar foto</p>
        </label>
        <input id="foto-perfil" type="file" accept="image/*" onChange={handleFotoPerfil} style={{ display: 'none' }} />
        <h2 style={{ fontSize: 21 }}>{profile.nombre}, {profile.edad}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ubicacionLabel(profile.provincia, profile.isla)}</p>
        <p style={{ marginTop: 6, fontSize: 14 }}><strong>{rango.nombre}</strong> · {puntosAnimados} pts</p>
        {siguiente && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 6, background: 'var(--bg-elev)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: 'var(--accent)', transition: 'width .4s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {siguiente.min - profile.puntos} pts para {siguiente.nombre}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Partidos" value={profile.partidos_jugados} />
        <Stat label="Victorias" value={profile.victorias} />
        <Stat label="Derrotas" value={profile.derrotas} />
        <Stat label="Racha" value={profile.racha_actual} />
      </div>

      {/* Tabs de modos configurados */}
      {modosConfigurados.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {modosConfigurados.map((m) => (
            <button key={m} className={`chip ${tabModo === m ? 'selected' : ''}`}
              onClick={() => { setTabModo(m); setEditando(false); }}
              style={{ fontSize: 12 }}
            >{MODO_LABELS[m] || m}</button>
          ))}
        </div>
      )}

      {/* Info del modo activo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>{MODO_LABELS[modoActivo] || modoActivo || 'Perfil'}</p>
        <button
          onClick={() => setEditando(!editando)}
          style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
        >{editando ? 'Cancelar' : 'Editar'}</button>
      </div>

      {!editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ marginBottom: 8 }}><strong>Nivel:</strong> {nivelActivo}</p>
          {descActiva && <p style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>{descActiva}</p>}

          {esBuscoPareja && profile.busco_pareja_desc && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Que busco en una pareja</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{profile.busco_pareja_desc}</p>
            </>
          )}

          {tienePareja && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <p style={{ fontWeight: 700, marginBottom: 10 }}>Mi pareja</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar url={profile.pareja_foto_url} nombre={profile.pareja_nombre} size={56} />
                <div>
                  <p style={{ fontWeight: 600 }}>{profile.pareja_nombre || '—'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nivel: {profile.pareja_nivel || '—'}</p>
                </div>
              </div>
              {profile.descripcion_equipo && (
                <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-muted)' }}>{profile.descripcion_equipo}</p>
              )}
            </>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}><strong>Disponibilidad:</strong> {dispText}</p>
        </div>
      )}

      {editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          {/* Datos comunes */}
          <div className="form-group">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
          </div>

          {/* Datos del modo */}
          <div className="form-group">
            <label>Nivel</label>
            <ChipGroup opciones={NIVELES} value={form[campos.nivel]} onChange={(v) => setForm({ ...form, [campos.nivel]: v })} />
          </div>
          <div className="form-group">
            <label>Descripcion</label>
            <textarea rows={2} maxLength={150} value={form[campos.descripcion]} onChange={(e) => setForm({ ...form, [campos.descripcion]: e.target.value })} />
          </div>

          {esBuscoPareja && (
            <div className="form-group">
              <label>Que buscas en una pareja</label>
              <textarea rows={2} maxLength={150} value={form.busco_pareja_desc} onChange={(e) => setForm({ ...form, busco_pareja_desc: e.target.value })} placeholder="Describe el companero ideal..." />
            </div>
          )}

          {tienePareja && (
            <>
              <div className="form-group">
                <label>Nombre de tu pareja</label>
                <input value={form.pareja_nombre} onChange={(e) => setForm({ ...form, pareja_nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Foto de tu pareja</label>
                <label htmlFor="foto-pareja" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar url={fotoParejaPreview} nombre={form.pareja_nombre} size={52} />
                    <span style={{ fontSize: 13, color: 'var(--accent)' }}>
                      {fotoParejaPreview ? 'Cambiar foto' : 'Subir foto (opcional)'}
                    </span>
                  </div>
                  <input id="foto-pareja" type="file" accept="image/*" onChange={handleFotoPareja} style={{ display: 'none' }} />
                </label>
              </div>
              <div className="form-group">
                <label>Nivel de tu pareja</label>
                <ChipGroup opciones={NIVELES} value={form.pareja_nivel} onChange={(v) => setForm({ ...form, pareja_nivel: v })} />
              </div>
              <div className="form-group">
                <label>Descripcion del equipo</label>
                <textarea rows={2} maxLength={150} value={form.descripcion_equipo} onChange={(e) => setForm({ ...form, descripcion_equipo: e.target.value })} placeholder="Cuentanos algo sobre vosotros como equipo..." />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Disponibilidad</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISPONIBILIDAD_OPCIONES.map((o) => (
                <button key={o.id} type="button"
                  className={`chip ${(form.disponibilidad || []).includes(o.id) ? 'selected' : ''}`}
                  onClick={() => setForm((f) => ({
                    ...f,
                    disponibilidad: f.disponibilidad?.includes(o.id)
                      ? f.disponibilidad.filter((d) => d !== o.id)
                      : [...(f.disponibilidad || []), o.id],
                  }))}
                >{o.label}</button>
              ))}
            </div>
          </div>

          <SelectorUbicacion
            provincia={form.provincia} isla={form.isla}
            onChangeProvincia={(p) => setForm({ ...form, provincia: p, isla: '' })}
            onChangeIsla={(i) => setForm({ ...form, isla: i })}
          />

          <button className="btn-primary" style={{ width: '100%' }} disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* Añadir otro modo */}
      <button
        className="btn-outline"
        style={{ width: '100%', marginBottom: 18 }}
        onClick={() => navigate('/modo')}
      >
        Configurar otro modo de juego
      </button>

      <CodigoReferido profile={profile} />
      <HistorialPartidos profile={profile} userId={user?.id} />

      {/* Logros */}
      <h3 style={{ fontSize: 16, marginBottom: 10, marginTop: 4 }}>Logros</h3>
      <div className="chip-row" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {LOGROS_DEF.map((l) => (
          <button key={l.id} className={`badge ${idsConseguidos.includes(l.id) ? '' : 'locked'}`} onClick={() => setLogroSel(l)}>
            {l.icono} {l.nombre}
          </button>
        ))}
      </div>
      <LogroModal logro={logroSel} conseguido={logroSel ? idsConseguidos.includes(logroSel.id) : false} onClose={() => setLogroSel(null)} />

      {/* Ajustes */}
      <div className="card" style={{ marginBottom: 18 }}>
        <p style={{ fontWeight: 700, marginBottom: 14 }}>Ajustes</p>
        <button className="chip" onClick={toggleTheme}>
          {theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        </button>
      </div>

      <button className="btn-danger" style={{ width: '100%', marginBottom: 32 }} onClick={signOut}>
        Cerrar sesion
      </button>
    </div>
  );
}
