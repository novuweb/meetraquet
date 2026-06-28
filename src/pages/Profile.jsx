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
  if (url) {
    return (
      <img src={url} alt={nombre}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-elev)', border: '2px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800, color: 'var(--text-muted)',
    }}>
      {nombre?.[0]?.toUpperCase()}
    </div>
  );
}

function FotoUpload({ id, preview, onChange, circular = true }) {
  return (
    <label htmlFor={id} style={{ cursor: 'pointer', display: 'block', textAlign: circular ? 'center' : 'left' }}>
      {circular ? (
        <Avatar url={preview} nombre="+" size={64} />
      ) : (
        <div style={{
          width: '100%', height: 120, borderRadius: 12, overflow: 'hidden',
          border: '2px dashed var(--border)',
          background: preview ? `url(${preview}) center/cover` : 'var(--bg-elev)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: 'var(--text-muted)',
        }}>{!preview && 'Subir foto'}</div>
      )}
      <p style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'center', marginTop: 4 }}>
        {preview ? 'Cambiar foto' : 'Subir foto'}
      </p>
      <input id={id} type="file" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f, URL.createObjectURL(f)); }}
        style={{ display: 'none' }}
      />
    </label>
  );
}

// Bloque editable de un deporte (tenis o padel)
function SeccionDeporte({ deporte, profile, form, setForm, guardando, onGuardar, onGuardarPareja, editando, setEditando }) {
  const esTenis = deporte === 'tenis';
  const label = esTenis ? 'Tenis' : 'Padel';
  const campoNivel = esTenis ? 'tenis_nivel' : 'padel_nivel';
  const campoDesc = esTenis ? 'tenis_descripcion' : 'padel_descripcion';
  const modoCol = esTenis ? 'tenis_modo' : 'padel_modo';
  const tienePareja = profile[modoCol] === 'dobles_rival';

  // Pareja
  const campoPNombre = esTenis ? 'tenis_pareja_nombre' : 'padel_pareja_nombre';
  const campoPEdad = esTenis ? 'tenis_pareja_edad' : 'padel_pareja_edad';
  const campoPFoto = esTenis ? 'tenis_pareja_foto_url' : 'padel_pareja_foto_url';
  const campoJuntos = esTenis ? 'tenis_foto_juntos_url' : 'padel_foto_juntos_url';
  const pathPareja = esTenis ? 'tenis-pareja' : 'padel-pareja';
  const pathJuntos = esTenis ? 'tenis-juntos' : 'padel-juntos';

  const [editPareja, setEditPareja] = useState(false);
  const [parejaFoto, setParejaFoto] = useState(null);
  const [parejaFotoPreview, setParejaFotoPreview] = useState(profile[campoPFoto] || null);
  const [juntosFile, setJuntosFile] = useState(null);
  const [juntosPreview, setJuntosPreview] = useState(profile[campoJuntos] || null);

  const modoLabel = {
    individual: 'Individual',
    dobles_pareja: 'Dobles — Busco pareja',
    dobles_rival: 'Dobles — Tengo pareja',
  }[profile[modoCol]] || '—';

  async function guardarPareja() {
    await onGuardarPareja({
      parejaFoto, juntosFile, pathPareja, pathJuntos, campoPFoto, campoJuntos,
    });
    setEditPareja(false);
    setParejaFoto(null);
    setJuntosFile(null);
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      {/* Cabecera deporte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{label}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{modoLabel}</span>
        </div>
        <button
          onClick={() => { setEditando(!editando); setEditPareja(false); }}
          style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
        >{editando ? 'Cancelar' : 'Editar'}</button>
      </div>

      {!editando && (
        <>
          <p style={{ marginBottom: 4 }}><strong>Nivel:</strong> {profile[campoNivel] || '—'}</p>
          {profile[campoDesc] && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{profile[campoDesc]}</p>
          )}
        </>
      )}

      {editando && (
        <div>
          <div className="form-group">
            <label>Nivel</label>
            <ChipGroup opciones={NIVELES} value={form[campoNivel] || ''} onChange={(v) => setForm((f) => ({ ...f, [campoNivel]: v }))} />
          </div>
          <div className="form-group">
            <label>Descripcion (opcional)</label>
            <textarea rows={3} maxLength={150} value={form[campoDesc] || ''}
              onChange={(e) => setForm((f) => ({ ...f, [campoDesc]: e.target.value }))}
            />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} disabled={guardando} onClick={() => onGuardar(setEditando)}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Pareja (solo si modo dobles_rival) */}
      {tienePareja && !editando && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Mi pareja de {label}</p>
            <button onClick={() => setEditPareja(!editPareja)}
              style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              {editPareja ? 'Cancelar' : 'Editar fotos'}
            </button>
          </div>

          {!editPareja && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar url={profile[campoPFoto]} nombre={profile[campoPNombre]} size={54} />
              <div>
                <p style={{ fontWeight: 600 }}>{profile[campoPNombre] || '—'}</p>
                {profile[campoPEdad] && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile[campoPEdad]} años</p>
                )}
              </div>
            </div>
          )}

          {editPareja && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Foto de {profile[campoPNombre] || 'tu pareja'}</p>
              <FotoUpload id={`${deporte}-pareja-foto`} preview={parejaFotoPreview}
                onChange={(f, p) => { setParejaFoto(f); setParejaFotoPreview(p); }} circular
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '14px 0 8px' }}>Foto de los dos juntos</p>
              <FotoUpload id={`${deporte}-juntos-foto`} preview={juntosPreview}
                onChange={(f, p) => { setJuntosFile(f); setJuntosPreview(p); }} circular={false}
              />
              <button className="btn-primary" style={{ width: '100%', marginTop: 14 }}
                disabled={guardando} onClick={guardarPareja}>
                {guardando ? 'Guardando...' : 'Guardar fotos'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { profile, user, refreshProfile, signOut, setProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { modo } = useModo();
  const navigate = useNavigate();

  const [editandoTenis, setEditandoTenis] = useState(false);
  const [editandoPadel, setEditandoPadel] = useState(false);
  const [editandoComun, setEditandoComun] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [logroSel, setLogroSel] = useState(null);
  const [form, setForm] = useState({});

  const modosConf = profile?.modos_configurados || [];
  const tieneTenis = modosConf.some((m) => m.includes('tenis'));
  const tienePadel = modosConf.some((m) => m.includes('padel'));

  useEffect(() => {
    if (profile) {
      setForm({
        nombre: profile.nombre || '',
        edad: profile.edad || '',
        provincia: profile.provincia || '',
        isla: profile.isla || '',
        disponibilidad: profile.disponibilidad || [],
        tenis_nivel: profile.tenis_nivel || '',
        tenis_descripcion: profile.tenis_descripcion || '',
        padel_nivel: profile.padel_nivel || '',
        padel_descripcion: profile.padel_descripcion || '',
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

  async function handleFotoPerfil(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setProfile({ ...profile, avatar_url: localUrl });
    if (DEMO_MODE) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      console.error('Error subiendo foto:', err);
      await refreshProfile();
    }
  }

  async function uploadFoto(file, path) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fullPath = `${user.id}/${path}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(fullPath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fullPath);
    return data.publicUrl;
  }

  async function guardarDeporte(setEditandoFn) {
    setGuardando(true);
    try {
      const { error } = await supabase.from('profiles').update({
        tenis_nivel: form.tenis_nivel || null,
        tenis_descripcion: form.tenis_descripcion || null,
        padel_nivel: form.padel_nivel || null,
        padel_descripcion: form.padel_descripcion || null,
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setEditandoFn(false);
    } catch (err) { console.error(err); alert('Error al guardar. Inténtalo de nuevo.'); }
    finally { setGuardando(false); }
  }

  async function guardarPareja({ parejaFoto, juntosFile, pathPareja, pathJuntos, campoPFoto, campoJuntos }) {
    setGuardando(true);
    try {
      const updates = {};
      const pUrl = await uploadFoto(parejaFoto, pathPareja);
      const jUrl = await uploadFoto(juntosFile, pathJuntos);
      if (pUrl) updates[campoPFoto] = pUrl;
      if (jUrl) updates[campoJuntos] = jUrl;
      if (Object.keys(updates).length) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
        await refreshProfile();
      }
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  }

  async function guardarComun() {
    setGuardando(true);
    try {
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
      }).eq('id', user.id);
      await refreshProfile();
      setEditandoComun(false);
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  }

  const dispText = profile.disponibilidad?.length
    ? profile.disponibilidad.map(labelDisponibilidad).filter(Boolean).join(', ')
    : '—';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ padding: 0, marginBottom: 18 }}>
        <h1>Mi perfil</h1>
        <button className="chip" onClick={() => navigate('/modo')} style={{ fontSize: 12 }}>
          {modo ? MODO_LABELS[modo] : 'Elegir modo'}
        </button>
      </div>

      {/* Foto + info personal */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <label htmlFor="foto-perfil" style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Avatar url={profile.avatar_url} nombre={profile.nombre} size={80} />
            <p style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'center', marginTop: 4 }}>Cambiar</p>
          </label>
          <input id="foto-perfil" type="file" accept="image/*" onChange={handleFotoPerfil} style={{ display: 'none' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20 }}>{profile.nombre}{profile.edad ? `, ${profile.edad}` : ''}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ubicacionLabel(profile.provincia, profile.isla)}</p>
            <p style={{ marginTop: 4, fontSize: 13 }}><strong>{rango.nombre}</strong> · {puntosAnimados} pts</p>
          </div>
          <button onClick={() => setEditandoComun(!editandoComun)}
            style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}>
            {editandoComun ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {siguiente && (
          <div>
            <div style={{ height: 5, background: 'var(--bg-elev)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: 'var(--accent)', transition: 'width .4s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {siguiente.min - profile.puntos} pts para {siguiente.nombre}
            </p>
          </div>
        )}

        {editandoComun && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="form-group"><label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="form-group"><label>Edad</label>
              <input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
            </div>
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
            <button className="btn-primary" style={{ width: '100%' }} disabled={guardando} onClick={guardarComun}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}

        {!editandoComun && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            <strong>Disponibilidad:</strong> {dispText}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        <Stat label="Partidos" value={profile.partidos_jugados} />
        <Stat label="Victorias" value={profile.victorias} />
        <Stat label="Derrotas" value={profile.derrotas} />
        <Stat label="Racha" value={profile.racha_actual} />
      </div>

      {/* Secciones por deporte */}
      {tieneTenis && (
        <SeccionDeporte
          deporte="tenis" profile={profile} form={form} setForm={setForm}
          guardando={guardando}
          onGuardar={guardarDeporte}
          onGuardarPareja={guardarPareja}
          editando={editandoTenis} setEditando={setEditandoTenis}
        />
      )}
      {tienePadel && (
        <SeccionDeporte
          deporte="padel" profile={profile} form={form} setForm={setForm}
          guardando={guardando}
          onGuardar={guardarDeporte}
          onGuardarPareja={guardarPareja}
          editando={editandoPadel} setEditando={setEditandoPadel}
        />
      )}

      {/* Añadir modo */}
      <button className="btn-outline" style={{ width: '100%', marginBottom: 18 }} onClick={() => navigate('/modo')}>
        Configurar otro modo de juego
      </button>

      <CodigoReferido profile={profile} />
      <HistorialPartidos profile={profile} userId={user?.id} />

      <h3 style={{ fontSize: 16, marginBottom: 10, marginTop: 4 }}>Logros</h3>
      <div className="chip-row" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {LOGROS_DEF.map((l) => (
          <button key={l.id} className={`badge ${idsConseguidos.includes(l.id) ? '' : 'locked'}`} onClick={() => setLogroSel(l)}>
            {l.icono} {l.nombre}
          </button>
        ))}
      </div>
      <LogroModal logro={logroSel} conseguido={logroSel ? idsConseguidos.includes(logroSel.id) : false} onClose={() => setLogroSel(null)} />

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
