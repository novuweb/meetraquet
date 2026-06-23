import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { esProvinciaCanaria } from '../lib/provincias';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';

const DEPORTES = ['Pádel', 'Tenis', 'Ambos'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competición'];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [edad, setEdad] = useState(profile?.edad || '');
  const [deporte, setDeporte] = useState(profile?.deporte || 'Pádel');
  const [nivel, setNivel] = useState(profile?.nivel || 'Principiante');
  const [descripcion, setDescripcion] = useState(profile?.descripcion || '');
  const [provincia, setProvincia] = useState(profile?.provincia || '');
  const [isla, setIsla] = useState(profile?.isla || '');
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(profile?.avatar_url || null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (esProvinciaCanaria(provincia) && !isla) {
      setError('Selecciona tu isla.');
      return;
    }

    setCargando(true);
    try {
      let avatar_url = profile?.avatar_url || null;

      if (foto) {
        const ext = foto.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, foto, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          nombre,
          edad: Number(edad),
          deporte,
          nivel,
          descripcion,
          provincia,
          isla: esProvinciaCanaria(provincia) ? isla : null,
          avatar_url,
          perfil_completo: true,
          puntos: profile?.puntos || 0,
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Completa tu perfil</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
        Esta información es la que verán los demás jugadores antes de desafiarte.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ textAlign: 'center' }}>
          <label htmlFor="foto-input" style={{ cursor: 'pointer' }}>
            <div
              className="avatar"
              style={{
                width: 110, height: 110, margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed var(--border)', overflow: 'hidden', fontSize: 13, color: 'var(--text-muted)',
                backgroundImage: preview ? `url(${preview})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            >
              {!preview && 'Subir foto'}
            </div>
          </label>
          <input id="foto-input" type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Edad</label>
          <input type="number" min={16} max={99} value={edad} onChange={(e) => setEdad(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Deporte</label>
          <div className="chip-row">
            {DEPORTES.map((d) => (
              <button type="button" key={d} className={`chip ${deporte === d ? 'selected' : ''}`} onClick={() => setDeporte(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Nivel de juego</label>
          <div className="chip-row">
            {NIVELES.map((n) => (
              <button type="button" key={n} className={`chip ${nivel === n ? 'selected' : ''}`} onClick={() => setNivel(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Descripción ({descripcion.length}/150)</label>
          <textarea
            maxLength={150}
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuéntanos algo sobre ti y tu juego..."
          />
        </div>

        <SelectorUbicacion
          provincia={provincia}
          isla={isla}
          onChangeProvincia={(p) => { setProvincia(p); setIsla(''); }}
          onChangeIsla={setIsla}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Entrar a MeetRaquet'}
        </button>
      </form>
    </div>
  );
}
