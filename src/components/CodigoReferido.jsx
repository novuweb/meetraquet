import { useState } from 'react';

export default function CodigoReferido({ profile }) {
  const [copiado, setCopiado] = useState(false);
  if (!profile?.codigo_referido) return null;

  const mensaje = `¡Échale un ojo a MeetRaquet! Usa mi código ${profile.codigo_referido} al registrarte y ganamos +50 puntos los dos 🎾`;

  function copiar() {
    navigator.clipboard?.writeText(profile.codigo_referido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  function compartirWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  return (
    <div className="card" style={{ marginBottom: 18, textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>🎁 Invita y gana puntos</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        Comparte tu código: si alguien lo usa al registrarse, ambos ganáis +50 puntos.
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, marginBottom: 14 }}>{profile.codigo_referido}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={copiar}>
          {copiado ? '✅ Copiado' : '📋 Copiar'}
        </button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={compartirWhatsapp}>
          📲 WhatsApp
        </button>
      </div>
    </div>
  );
}
