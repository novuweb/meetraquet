// Modal simple que explica qué hace falta para conseguir un logro.
export default function LogroModal({ logro, conseguido, onClose }) {
  if (!logro) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 40, marginBottom: 10 }}>{logro.icono}</p>
        <h3 style={{ fontSize: 19, marginBottom: 8 }}>{logro.nombre}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{logro.descripcion}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: conseguido ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 16 }}>
          {conseguido ? 'Conseguido ✓' : 'Aún no conseguido'}
        </p>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
