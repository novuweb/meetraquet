import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme';
import { useModo, MODO_LABELS } from '../hooks/useModo.jsx';
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
const ESTILOS = ['Agresivo', 'Defensivo', 'Equilibrado', 'Completo'];

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

export default function Profile() {
  const { profile, user, refreshProfile, signOut, setProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { modo } = useModo();
  const navigate = useNavigate();

  const [tab, setTab] = useState(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [logroSel, setLogroSel] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (profile && !tab) {
      setTab(profile.juega_tenis ? 'tenis' : 'padel');
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      setForm({
        nombre: profile.nombre || '',
        edad: profile.edad || '',
        nivel_tenis: profile.nivel_tenis || '',
        estilo_tenis: profile.estilo_tenis || '',
        descripcion_tenis: profile.descripcion_tenis || '',
        nivel_padel: profile.nivel_padel || '',
        estilo_padel: profile.estilo_padel || '',
        descripcion_padel: profile.descripcion_padel || '',
        pareja_nombre: profile.pareja_nombre || '',
        pareja_nivel: profile.pareja_nivel || '',
        provincia: profile.provincia || '',
        isla: profile.isla || '',
        disponibilidad: profile.disponibilidad || [],
      });
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
  const tieneDobles = profile.dobles_busca === 'rival';

  async function handleFoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (DEMO_MODE) { setProfile({ ...profile, avatar_url: URL.createObjectURL(file) }); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    await refreshProfile();
  }

  async function guardar() {
    setGuardando(true);
    if (DEMO_MODE) { setProfile({ ...profile, ...form }); setGuardando(false); setEditando(false); return; }
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
      estilo_tenis: form.estilo_tenis || null,
      descripcion_tenis: form.descripcion_tenis || null,
      nivel_padel: form.nivel_padel || null,
      estilo_padel: form.estilo_padel || null,
      descripcion_padel: form.descripcion_padel || null,
      pareja_nombre: form.pareja_nombre || null,
      pareja_nivel: form.pareja_nivel || null,
    }).eq('id', user.id);
    await refreshProfile();
    setGuardando(false);
    setEditando(false);
  }

  const dispText = profile.disponibilidad?.length
    ? profile.disponibilidad.map(labelDisponibilidad).filter(Boolean).join(', ')
    : '—';

  return (
    <div className="page">
      <div className="page-header" style={{ padding: 0, marginBottom: 18 }}>
        <h1>Mi perfil</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{modo ? MODO_LABELS[modo] : ''}</span>
          <button className="chip" onClick={() => navigate('/modo')} style={{ fontSize: 12 }}>Cambiar</button>
        </div>
      </div>

      {/* Foto + info */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <label htmlFor="foto-perfil" style={{ cursor: 'pointer' }}>
          <div className="avatar" style={{
            width: 96, height: 96, margin: '0 auto 10px',
            backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 800,
          }}>
            {!profile.avatar_url && profile.nombre?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>Cambiar foto</p>
        </label>
        <input id="foto-perfil" type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
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

      {/* Tabs deportes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {profile.juega_tenis && (
          <button className={`chip ${tab === 'tenis' ? 'selected' : ''}`} onClick={() => { setTab('tenis'); setEditando(false); }}>Tenis</button>
        )}
        {profile.juega_padel && (
          <button className={`chip ${tab === 'padel' ? 'selected' : ''}`} onClick={() => { setTab('padel'); setEditando(false); }}>Padel</button>
        )}
        <button
          onClick={() => setEditando(!editando)}
          style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
        >{editando ? 'Cancelar' : 'Editar'}</button>
      </div>

      {/* Vista de datos del deporte */}
      {!editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          {tab === 'tenis' && (
            <>
              <p style={{ marginBottom: 8 }}><strong>Nivel:</strong> {profile.nivel_tenis || '—'}</p>
              <p style={{ marginBottom: 8 }}><strong>Estilo:</strong> {profile.estilo_tenis || '—'}</p>
              {profile.descripcion_tenis && <p style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>{profile.descripcion_tenis}</p>}
              {tieneDobles && profile.pareja_nombre && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>Mi pareja</p>
                  <p style={{ marginBottom: 4 }}><strong>Nombre:</strong> {profile.pareja_nombre}</p>
                  <p><strong>Nivel:</strong> {profile.pareja_nivel || '—'}</p>
                </>
              )}
            </>
          )}
          {tab === 'padel' && (
            <>
              <p style={{ marginBottom: 8 }}><strong>Nivel:</strong> {profile.nivel_padel || '—'}</p>
              <p style={{ marginBottom: 8 }}><strong>Estilo:</strong> {profile.estilo_padel || '—'}</p>
              {profile.descripcion_padel && <p style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 14 }}>{profile.descripcion_padel}</p>}
              {tieneDobles && profile.pareja_nombre && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>Mi pareja</p>
                  <p style={{ marginBottom: 4 }}><strong>Nombre:</strong> {profile.pareja_nombre}</p>
                  <p><strong>Nivel:</strong> {profile.pareja_nivel || '—'}</p>
                </>
              )}
            </>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}><strong>Disponibilidad:</strong> {dispText}</p>
        </div>
      )}

      {/* Form de edicion */}
      {editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-group">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
          </div>

          {tab === 'tenis' && (
            <>
              <div className="form-group">
                <label>Nivel tenis</label>
                <ChipGroup opciones={NIVELES} value={form.nivel_tenis} onChange={(v) => setForm({ ...form, nivel_tenis: v })} />
              </div>
              <div className="form-group">
                <label>Estilo tenis</label>
                <ChipGroup opciones={ESTILOS} value={form.estilo_tenis} onChange={(v) => setForm({ ...form, estilo_tenis: v })} />
              </div>
              <div className="form-group">
                <label>Descripcion tenis</label>
                <textarea rows={2} maxLength={150} value={form.descripcion_tenis} onChange={(e) => setForm({ ...form, descripcion_tenis: e.target.value })} />
              </div>
              {tieneDobles && (
                <>
                  <div className="form-group">
                    <label>Nombre pareja</label>
                    <input value={form.pareja_nombre} onChange={(e) => setForm({ ...form, pareja_nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nivel pareja</label>
                    <ChipGroup opciones={NIVELES} value={form.pareja_nivel} onChange={(v) => setForm({ ...form, pareja_nivel: v })} />
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'padel' && (
            <>
              <div className="form-group">
                <label>Nivel padel</label>
                <ChipGroup opciones={NIVELES} value={form.nivel_padel} onChange={(v) => setForm({ ...form, nivel_padel: v })} />
              </div>
              <div className="form-group">
                <label>Estilo padel</label>
                <ChipGroup opciones={ESTILOS} value={form.estilo_padel} onChange={(v) => setForm({ ...form, estilo_padel: v })} />
              </div>
              <div className="form-group">
                <label>Descripcion padel</label>
                <textarea rows={2} maxLength={150} value={form.descripcion_padel} onChange={(e) => setForm({ ...form, descripcion_padel: e.target.value })} />
              </div>
              {tieneDobles && (
                <>
                  <div className="form-group">
                    <label>Nombre pareja</label>
                    <input value={form.pareja_nombre} onChange={(e) => setForm({ ...form, pareja_nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nivel pareja</label>
                    <ChipGroup opciones={NIVELES} value={form.pareja_nivel} onChange={(v) => setForm({ ...form, pareja_nivel: v })} />
                  </div>
                </>
              )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="chip" onClick={toggleTheme} style={{ alignSelf: 'flex-start' }}>
            {theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          </button>
        </div>
      </div>

      <button className="btn-danger" style={{ width: '100%', marginBottom: 32 }} onClick={signOut}>
        Cerrar sesion
      </button>
    </div>
  );
}
