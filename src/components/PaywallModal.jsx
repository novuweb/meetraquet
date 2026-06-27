import { useAuth } from '../hooks/useAuth.jsx';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gMeVf8SUbp991VdBm4c809';

const BENEFITS = [
  'Desafía a jugadores ilimitados',
  'Chatea con tus rivales',
  'Sube en el ranking',
  'Accede a todos los modos de matchmaking',
];

// Estrella SVG sin emoji
function Star({ filled = true }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function PaywallModal({ onClose }) {
  const { user } = useAuth();

  function irAPago() {
    const params = new URLSearchParams();
    if (user?.id) params.set('client_reference_id', user.id);
    if (user?.email) params.set('prefilled_email', user.email);
    window.location.href = `${STRIPE_PAYMENT_LINK}?${params.toString()}`;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      backdropFilter: 'blur(10px)',
      overflowY: 'auto',
    }}>
      {/* Valoración */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: '#9A9A9A', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Usado por jugadores de toda España
        </div>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
          {[1,2,3,4,5].map((i) => <Star key={i} filled />)}
        </div>
        <div style={{ fontSize: '13px', color: '#9A9A9A' }}>4.8 · Valoración media</div>
      </div>

      {/* Logo */}
      <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: '52px', marginBottom: '16px' }} />

      {/* Título */}
      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontSize: '32px', fontWeight: 800,
        textAlign: 'center', lineHeight: 1.1, marginBottom: '22px',
        letterSpacing: '-0.02em', color: '#fff',
      }}>
        <span style={{ color: '#22C55E' }}>Acceso</span> ilimitado
      </h1>

      {/* Beneficios */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
        {BENEFITS.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#22C55E', fontSize: '15px', fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.4, color: '#fff' }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Precio */}
      <div style={{
        width: '100%', maxWidth: '320px',
        border: '1.5px solid #22C55E', borderRadius: '16px',
        padding: '16px', textAlign: 'center', marginBottom: '18px',
        background: 'rgba(34,197,94,0.06)',
        boxShadow: '0 0 24px rgba(34,197,94,0.1)',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
          <span style={{ color: '#22C55E' }}>2,99 €</span>/mes
        </div>
        <div style={{ fontSize: '13px', color: '#9A9A9A', marginTop: '4px' }}>Cancela cuando quieras</div>
      </div>

      {/* Botón */}
      <button
        className="btn-primary"
        style={{ width: '100%', maxWidth: '320px', fontSize: '17px', padding: '16px', borderRadius: '16px' }}
        onClick={irAPago}
      >
        Suscribirme ahora
      </button>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: '#9A9A9A' }}>
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Términos</span>
        <span>·</span>
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacidad</span>
        <span>·</span>
        <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#22C55E' }} onClick={onClose}>Cancelar</span>
      </div>
    </div>
  );
}
