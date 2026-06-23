import { useState } from 'react';

// Formulario inline para reportar el resultado de un partido ya finalizado.
// quienGano: 'yo' | 'rival' — el perdedor se calcula a partir de eso.
export default function ReportarResultadoForm({ otro, onCancelar, onConfirmar }) {
  const [quienGano, setQuienGano] = useState('yo');
  const [resultado, setResultado] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!resultado.trim()) return;
    onConfirmar(quienGano, resultado.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ margin: '10px 0' }}>
      <p style={{ fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>🏆 Partido finalizado</p>

      <div className="form-group">
        <label>¿Quién ganó?</label>
        <div className="chip-row">
          <button type="button" className={`chip ${quienGano === 'yo' ? 'selected' : ''}`} onClick={() => setQuienGano('yo')}>
            Yo
          </button>
          <button type="button" className={`chip ${quienGano === 'rival' ? 'selected' : ''}`} onClick={() => setQuienGano('rival')}>
            {otro?.nombre || 'Rival'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Resultado (ej. 6-0 6-0)</label>
        <input value={resultado} onChange={(e) => setResultado(e.target.value)} placeholder="6-0 6-0" required />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Enviar resultado</button>
      </div>
    </form>
  );
}
