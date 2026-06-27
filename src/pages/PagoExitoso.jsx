import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';

export default function PagoExitoso() {
  const navigate = useNavigate();
  const { user, refreshProfile, loadingSession } = useAuth();
  const [estado, setEstado] = useState('verificando');

  useEffect(() => {
    // Timeout máximo de 8 segundos — si algo falla mostramos éxito igualmente
    // porque el webhook ya actualizó la BD aunque la sesión tarde en cargar
    const timeout = setTimeout(async () => {
      await refreshProfile().catch(() => {});
      setEstado('listo');
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // En cuanto tengamos el user ID, comprobamos suscrito directamente en Supabase
    if (!user?.id) return;

    let intentos = 0;
    const MAX_INTENTOS = 8;

    const intervalo = setInterval(async () => {
      intentos++;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('suscrito')
          .eq('id', user.id)
          .single();

        if (data?.suscrito || intentos >= MAX_INTENTOS) {
          clearInterval(intervalo);
          await refreshProfile().catch(() => {});
          setEstado('listo');
        }
      } catch {
        if (intentos >= MAX_INTENTOS) {
          clearInterval(intervalo);
          setEstado('listo');
        }
      }
    }, 1200);

    return () => clearInterval(intervalo);
  }, [user?.id]);

  return (
    <div style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, #0A1A0A, #0A0A0A 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 24px', gap: '20px',
    }}>
      <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: '64px', marginBottom: '8px' }} />

      {estado === 'verificando' && (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid #2A2A2A', borderTopColor: '#22C55E',
            animation: 'spin .8s linear infinite',
          }} />
          <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '22px', textAlign: 'center' }}>
            Verificando tu pago…
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '14px', textAlign: 'center' }}>
            Esto solo tarda unos segundos
          </p>
        </>
      )}

      {estado === 'listo' && (
        <>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            border: '2px solid #22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px',
            animation: 'popIn .4s cubic-bezier(0.175,0.885,0.32,1.275)',
            boxShadow: '0 0 40px rgba(34,197,94,0.3)',
          }}>
            ✓
          </div>

          <h1 style={{
            fontFamily: 'Poppins,sans-serif', fontSize: '30px', fontWeight: 800,
            textAlign: 'center', letterSpacing: '-0.02em',
          }}>
            ¡Bienvenido a<br/><span style={{ color: '#22C55E' }}>MeetRacquet</span>!
          </h1>

          <p style={{ color: '#9A9A9A', fontSize: '15px', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 }}>
            Tu acceso ilimitado ya está activo. Desafía a quien quieras, sube en el ranking y domina la pista.
          </p>

          <div style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '16px', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            width: '100%', maxWidth: '320px',
          }}>
            {['Desafíos ilimitados', 'Chat con tus rivales', 'Ranking en tiempo real', 'Todos los modos de juego'].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500 }}>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>✓</span> {b}
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', maxWidth: '320px', fontSize: '16px', padding: '16px', borderRadius: '16px' }}
            onClick={() => navigate('/', { replace: true })}
          >
            Empezar a jugar 🎾
          </button>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
