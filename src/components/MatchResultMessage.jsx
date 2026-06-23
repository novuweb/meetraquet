import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Mensaje especial de resultado de partido ("🏆 Resultado reportado: 6-0 6-0")
// con botones Confirmar/Rechazar para el rival. Una vez resuelto, solo se ve el texto.
export default function MatchResultMessage({ mensaje, partido, esMio, onResuelto }) {
  const [cargando, setCargando] = useState(false);

  if (!partido) return null;
  const pendiente = partido.estado === 'pendiente';

  async function confirmar() {
    setCargando(true);
    const { error } = await supabase.rpc('confirmar_resultado', { p_partido_id: partido.id });
    setCargando(false);
    if (!error) onResuelto('confirmado');
  }

  async function rechazar() {
    setCargando(true);
    const { error } = await supabase.rpc('rechazar_resultado', { p_partido_id: partido.id });
    setCargando(false);
    if (!error) onResuelto('rechazado');
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
      <p style={{ fontSize: 24, marginBottom: 6 }}>🏆</p>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Resultado: {partido.resultado}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{mensaje.contenido}</p>

      {pendiente && !esMio && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-primary" disabled={cargando} onClick={confirmar} style={{ flex: 1 }}>
            ✅ Confirmar
          </button>
          <button className="btn-danger" disabled={cargando} onClick={rechazar} style={{ flex: 1 }}>
            ❌ Rechazar
          </button>
        </div>
      )}

      {pendiente && esMio && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Esperando confirmación del rival...</p>
      )}

      {!pendiente && (
        <p style={{ fontSize: 13, color: partido.estado === 'confirmado' ? 'var(--accent)' : '#EF4444', fontWeight: 700 }}>
          {partido.estado === 'confirmado' ? '✅ Resultado confirmado, puntos sumados' : '❌ Resultado rechazado'}
        </p>
      )}
    </div>
  );
}
