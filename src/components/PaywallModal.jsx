import { useAuth } from '../hooks/useAuth.jsx';

// Enlace de pago de Stripe — ya configurado
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gMeVf8SUbp991VdBm4c809';

// URL a la que Stripe redirige tras el pago (configura esto en el Dashboard de Stripe)
const SUCCESS_URL = `${window.location.origin}/pago-exitoso`;

const BENEFITS = [
  { text: 'Desafía a jugadores ilimitados' },
  { text: 'Chatea con tus rivales' },
  { text: 'Sube en el ranking' },
  { text: 'Accede a todos los modos de matchmaking' },
];

export default function PaywallModal({ onClose }) {
  const { user } = useAuth();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      backdropFilter: 'blur(10px)',
      overflowY: 'auto',
    }}>
      {/* Valoración */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: '#9A9A9A', marginBottom: '6px', letterSpacing: '0.05em' }}>
          🏆 Usado por jugadores de toda España
        </div>
        <div style={{ fontSize: '22px', letterSpacing: '2px' }}>⭐⭐⭐⭐⭐</div>
        <div style={{ fontSize: '13px', color: '#9A9A9A', marginTop: '2px' }}>4.8 · Valoración media</div>
      </div>

      {/* Logo */}
      <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: '56px', marginBottom: '18px' }} />

      {/* Título */}
      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontSize: '34px', fontWeight: 800,
        textAlign: 'center', lineHeight: 1.1, marginBottom: '24px',
        letterSpacing: '-0.02em',
      }}>
        <span style={{ color: '#22C55E' }}>Acceso</span>{' '}ilimitado
      </h1>

      {/* Beneficios */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {BENEFITS.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(34,197,94,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: '1px solid rgba(34,197,94,0.25)',
            }}>
              <span style={{ color: '#22C55E', fontSize: '16px', fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.4 }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* Precio */}
      <div style={{
        width: '100%', maxWidth: '320px',
        border: '1.5px solid #22C55E',
        borderRadius: '16px', padding: '16px', textAlign: 'center',
        marginBottom: '20px', background: 'rgba(34,197,94,0.05)',
        boxShadow: '0 0 24px rgba(34,197,94,0.1)',
      }}>
        <div style={{ fontSize: '13px', color: '#9A9A9A', marginBottom: '4px' }}>Primera semana gratis</div>
        <div style={{ fontSize: '22px', fontWeight: 700 }}>
          Después <span style={{ color: '#22C55E' }}>2,99 €/mes</span>
        </div>
      </div>

      {/* Botón */}
      <button
        className="btn-primary"
        style={{ width: '100%', maxWidth: '320px', fontSize: '17px', padding: '16px', borderRadius: '16px' }}
        onClick={() => {
          // Adjuntamos el user ID como client_reference_id para que el webhook
          // de Stripe pueda vincular el pago con el perfil del usuario
          const params = new URLSearchParams();
          if (user?.id) params.set('client_reference_id', user.id);
          if (user?.email) params.set('prefilled_email', user.email);
          const url = `${STRIPE_PAYMENT_LINK}?${params.toString()}`;
          window.location.href = url; // misma pestaña para que SUCCESS_URL funcione
        }}
      >
        Continuar
      </button>

      <p style={{ fontSize: '12px', color: '#9A9A9A', textAlign: 'center', marginTop: '14px', maxWidth: '280px', lineHeight: 1.5 }}>
        7 días gratis, luego 2,99 €/mes. Cancela cuando quieras.
      </p>

      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#9A9A9A' }}>
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Términos</span>
        <span>·</span>
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacidad</span>
        <span>·</span>
        <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#22C55E' }} onClick={onClose}>Cancelar</span>
      </div>
    </div>
  );
}
