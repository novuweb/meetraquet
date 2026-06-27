import { useState, useEffect, useRef } from 'react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { playDing } from '../lib/sounds';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabaseClient';
import { getRango, getSiguienteRango, progresoRango } from '../lib/ranks';
import { LOGROS_DEF, getLogrosConseguidos } from '../lib/achievements';
import { esProvinciaCanaria, ubicacionLabel } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';
import LogroModal from '../components/LogroModal.jsx';
import { DEMO_MODE } from '../lib/demo';
import { DISPONIBILIDAD_OPCIONES, iconoDisponibilidad } from '../lib/disponibilidad';
import HistorialPartidos from '../components/HistorialPartidos.jsx';
import CodigoReferido from '../components/CodigoReferido.jsx';

const DEPORTES = ['Pádel', 'Tenis', 'Ambos'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competición'];

export default function Profile() {
  const { profile, user, refreshProfile, signOut, setProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [logroSeleccionado, setLogroSeleccionado] = useState(null);

  const [form, setForm] = useState(() => ({ ...profile }));

  if (!profile) return (
    <div className="center-screen">
      <div style={{ display:'flex',flexDirection:'column',gap:12,width:'100%',maxWidth:340 }}>
        <div className="skeleton skeleton-avatar" style={{width:100,height:100,margin:'0 auto'}}/>
        <div className="skeleton skeleton-line" style={{width:'60%',margin:'0 auto'}}/>
        <div className="skeleton skeleton-card" style={{height:80}}/>
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

  function toggleDisponibilidadForm(id) {
    setForm((prev) => {
      const actual = prev.disponibilidad || [];
      const next = actual.includes(id) ? actual.filter((d) => d !== id) : [...actual, id];
      return { ...prev, disponibilidad: next };
    });
  }

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (DEMO_MODE) {
      setProfile({ ...profile, avatar_url: URL.createObjectURL(file) });
      return;
    }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    await refreshProfile();
  }

  async function guardar() {
    setGuardando(true);

    if (DEMO_MODE) {
      setProfile({ ...profile, ...form });
      setGuardando(false);
      setEditando(false);
      return;
    }

    const cambioUbicacion = form.provincia !== profile.provincia || form.isla !== profile.isla;

    if (cambioUbicacion) {
      await supabase.rpc('cambiar_ubicacion', { p_provincia: form.provincia, p_isla: esProvinciaCanaria(form.provincia) ? form.isla : null });
    }

    await supabase
      .from('profiles')
      .update({
        nombre: form.nombre,
        edad: Number(form.edad),
        deporte: form.deporte,
        nivel: form.nivel,
        descripcion: form.descripcion,
        disponibilidad: form.disponibilidad || [],
      })
      .eq('id', user.id);

    await refreshProfile();
    setGuardando(false);
    setEditando(false);
  }

  return (
    <div className="page">
      <div className="page-header" style={{ padding: 0, marginBottom: 18 }}>
        <h1>Mi perfil</h1>
        <button onClick={toggleTheme} className="chip">
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <label htmlFor="foto-perfil" style={{ cursor: 'pointer' }}>
          <div
            className="avatar"
            style={{
              width: 100, height: 100, margin: '0 auto 10px',
              backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800,
            }}
          >
            {!profile.avatar_url && profile.nombre?.[0]?.toUpperCase()}
          </div>
        </label>
        <input id="foto-perfil" type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
        <h2 style={{ fontSize: 22 }}>{profile.nombre}, {profile.edad}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ubicacionLabel(profile.provincia, profile.isla)}</p>
        <p style={{ marginTop: 6, fontSize: 14 }}><strong>{rango.nombre}</strong> · {puntosAnimados} pts</p>

        {siguiente && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, background: 'var(--bg-elev)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: 'var(--accent)' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {siguiente.min - profile.puntos} pts para {siguiente.nombre}
            </p>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center', marginBottom: 18 }}>
        <Stat label="Partidos" value={profile.partidos_jugados} />
        <Stat label="Victorias" value={profile.victorias} />
        <Stat label="Derrotas" value={profile.derrotas} />
        <Stat label="Racha" value={profile.racha_actual} />
      </div>

      {(profile.valoraciones_recibidas || 0) > 0 && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', textAlign: 'center', marginBottom: 18 }}>
          <Stat label="Deportividad" value={profile.deportividad_media} />
          <Stat label="Puntualidad" value={profile.puntualidad_media} />
        </div>
      )}

      <CodigoReferido profile={profile} />

      <HistorialPartidos profile={profile} userId={user?.id} />

      {/* LOGROS */}
      <h3 style={{ fontSize: 16, marginBottom: 10 }}>Logros</h3>
      <div className="chip-row" style={{ marginBottom: 18 }}>
        {LOGROS_DEF.map((l) => (
          <button key={l.id} className={`badge ${idsConseguidos.includes(l.id) ? '' : 'locked'}`} onClick={() => setLogroSeleccionado(l)}>
            {l.icono} {l.nombre}
          </button>
        ))}
      </div>

      <LogroModal
        logro={logroSeleccionado}
        conseguido={logroSeleccionado ? idsConseguidos.includes(logroSeleccionado.id) : false}
        onClose={() => setLogroSeleccionado(null)}
      />

      {/* DATOS DE PERFIL */}
      <div className="page-header" style={{ padding: 0, marginBottom: 10 }}>
        <h3 style={{ fontSize: 16 }}>Datos del perfil</h3>
        <button onClick={() => setEditando(!editando)} style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
          {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {!editando && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ marginBottom: 8 }}><strong>Deporte:</strong> {profile.deporte}</p>
          <p style={{ marginBottom: 8 }}><strong>Nivel:</strong> {profile.nivel}</p>
          <p style={{ marginBottom: 8 }}><strong>Descripción:</strong> {profile.descripcion || '—'}</p>
          <p>
            <strong>Disponibilidad:</strong>{' '}
            {profile.disponibilidad?.length
              ? profile.disponibilidad.map((d) => iconoDisponibilidad(d)).join(', ')
              : '—'}
          </p>
        </div>
      )}

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
          <div className="form-group">
            <label>Deporte</label>
            <div className="chip-row">
              {DEPORTES.map((d) => (
                <button key={d} className={`chip ${form.deporte === d ? 'selected' : ''}`} onClick={() => setForm({ ...form, deporte: d })}>{d}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Nivel</label>
            <div className="chip-row">
              {NIVELES.map((n) => (
                <button key={n} className={`chip ${form.nivel === n ? 'selected' : ''}`} onClick={() => setForm({ ...form, nivel: n })}>{n}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={3} maxLength={150} value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="form-group">
            <label>¿Cuándo puedes jugar?</label>
            <div className="chip-row">
              {DISPONIBILIDAD_OPCIONES.map((o) => (
                <button
                  key={o.id}
                  className={`chip ${(form.disponibilidad || []).includes(o.id) ? 'selected' : ''}`}
                  onClick={() => toggleDisponibilidadForm(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <SelectorUbicacion
            provincia={form.provincia}
            isla={form.isla}
            onChangeProvincia={(p) => setForm({ ...form, provincia: p, isla: '' })}
            onChangeIsla={(i) => setForm({ ...form, isla: i })}
          />
          <button className="btn-primary" style={{ width: '100%' }} disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      <button className="btn-danger" style={{ width: '100%' }} onClick={signOut}>Cerrar sesión</button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 800 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}
