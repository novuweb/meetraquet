import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { session, signIn, signUp } = useAuth();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { error: err } = modo === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, nombre);
      if (err) throw err;
    } catch (err) {
      setError(traducirError(err.message));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="center-screen">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 72, margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
            Encuentra rival. Desafía. Juega.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {modo === 'registro' && (
            <div className="form-group">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Tu nombre" />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={cargando}>
            {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text-muted)' }}>
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} style={{ color: 'var(--accent)', fontWeight: 700 }}>
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

function traducirError(msg) {
  if (msg?.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg?.includes('already registered')) return 'Ese email ya está registrado.';
  return msg || 'Ha ocurrido un error, inténtalo de nuevo.';
}
