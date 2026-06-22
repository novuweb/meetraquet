import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DEMO_MODE } from '../lib/demo';

// Mensaje especial de desafío con botones Aceptar/Rechazar.
// Una vez resuelto (chat.estado_desafio !== 'pendiente'), solo se muestra el texto del resultado.
export default function ChallengeMessage({ chat, mensaje, esMio, onResuelto }) {
  const [cargando, setCargando] = useState(false);
  const pendiente = chat.estado_desafio === 'pendiente';

  async function responder(accion) {
    if (DEMO_MODE) {
      onResuelto(accion);
      return;
    }
    setCargando(true);
    const { error } = await supabase.rpc('responder_desafio', { p_chat_id: chat.id, p_accion: accion });
    setCargando(false);
    if (!error) onResuelto(accion);
  }

  return (
    <div style={{
      alignSelf: 'center',
      maxWidth: '88%',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 16,
      textAlign: 'center',
      margin: '10px 0',
    }}>
      <p style={{ fontSize: 24, marginBottom: 6 }}>🎾</p>
      <p style={{ fontWeight: 600, marginBottom: 10 }}>{mensaje.contenido}</p>

      {pendiente && !esMio && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-primary" disabled={cargando} onClick={() => responder('aceptado')} style={{ flex: 1 }}>
            ✅ Aceptar
          </button>
          <button className="btn-danger" disabled={cargando} onClick={() => responder('rechazado')} style={{ flex: 1 }}>
            ❌ Rechazar
          </button>
        </div>
      )}

      {pendiente && esMio && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Esperando respuesta del rival...</p>
      )}

      {!pendiente && (
        <p style={{ fontSize: 13, color: chat.estado_desafio === 'aceptado' ? 'var(--accent)' : '#EF4444', fontWeight: 700 }}>
          {chat.estado_desafio === 'aceptado' ? '✅ Desafío aceptado' : '❌ Desafío rechazado'}
        </p>
      )}
    </div>
  );
}
