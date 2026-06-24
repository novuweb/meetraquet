import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const valoradoKey = (partidoId) => `meetraquet_valorado_${partidoId}`;

export function yaValorado(partidoId) {
  return localStorage.getItem(valoradoKey(partidoId)) === '1';
}

function Estrellas({ valor, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} style={{ fontSize: 26, color: n <= valor ? '#F59E0B' : 'var(--border)' }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function ValorarPartido({ partido, otro, onDone }) {
  const [deportividad, setDeportividad] = useState(0);
  const [puntualidad, setPuntualidad] = useState(0);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!deportividad || !puntualidad) return;
    setEnviando(true);
    const { error } = await supabase.rpc('valorar_partido', {
      p_partido_id: partido.id,
      p_deportividad: deportividad,
      p_puntualidad: puntualidad,
    });
    setEnviando(false);
    if (!error) {
      localStorage.setItem(valoradoKey(partido.id), '1');
      onDone();
    }
  }

  return (
    <div className="card" style={{ margin: '10px 0', textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>Valora a {otro?.nombre || 'tu rival'}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Tu opinión ayuda a toda la comunidad.</p>

      <p style={{ fontSize: 13, marginBottom: 6 }}>Deportividad</p>
      <Estrellas valor={deportividad} onChange={setDeportividad} />

      <p style={{ fontSize: 13, marginTop: 14, marginBottom: 6 }}>Puntualidad</p>
      <Estrellas valor={puntualidad} onChange={setPuntualidad} />

      <button
        className="btn-primary"
        style={{ width: '100%', marginTop: 16 }}
        disabled={!deportividad || !puntualidad || enviando}
        onClick={enviar}
      >
        {enviando ? 'Enviando...' : 'Enviar valoración'}
      </button>
    </div>
  );
}
