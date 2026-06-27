import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CodigoReferido({ profile }) {
  const [copiado, setCopiado] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeUso, setMensajeUso] = useState(null); // { ok: bool, texto: string }

  if (!profile) return null;

  const mensaje = `Únete a MeetRacquet, la app para encontrar rivales de tenis y pádel. Usa mi código ${profile.codigo_referido} al registrarte y ganamos +50 puntos los dos.`;

  function copiar() {
    navigator.clipboard?.writeText(profile.codigo_referido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  function compartirWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  async function usarCodigo() {
    const codigo = codigoInput.trim().toUpperCase();
    if (!codigo) return;
    setEnviando(true);
    setMensajeUso(null);
    try {
      const { error } = await supabase.rpc('usar_codigo_referido', { p_codigo: codigo });
      if (error) {
        setMensajeUso({ ok: false, texto: error.message === 'codigo_no_existe' ? 'Código no válido.' : 'No se pudo aplicar el código.' });
      } else {
        setMensajeUso({ ok: true, texto: '+50 puntos añadidos. ¡Gracias por usar un código de invitacion!' });
        setCodigoInput('');
      }
    } catch {
      setMensajeUso({ ok: false, texto: 'Error al conectar. Inténtalo de nuevo.' });
    }
    setEnviando(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>

      {/* Tu código para compartir */}
      {profile.codigo_referido && (
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Invita y gana puntos</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Comparte tu código. Si alguien lo usa al registrarse, ambos ganais +50 puntos.
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, marginBottom: 14, color: 'var(--accent)' }}>
            {profile.codigo_referido}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar codigo'}
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={compartirWhatsapp}>
              Compartir
            </button>
          </div>
        </div>
      )}

      {/* Meter código de otro */}
      <div className="card">
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Tienes un codigo de invitacion?</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Introduce el codigo de un amigo y gana +50 puntos al instante.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="Ej: ABC123"
            maxLength={10}
            style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}
          />
          <button
            className="btn-primary"
            style={{ flexShrink: 0, padding: '12px 18px' }}
            onClick={usarCodigo}
            disabled={enviando || !codigoInput.trim()}
          >
            {enviando ? '...' : 'Aplicar'}
          </button>
        </div>
        {mensajeUso && (
          <p style={{ marginTop: 10, fontSize: 13, color: mensajeUso.ok ? 'var(--accent)' : '#EF4444' }}>
            {mensajeUso.texto}
          </p>
        )}
      </div>

    </div>
  );
}
