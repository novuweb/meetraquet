import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModo } from '../hooks/useModo.jsx';

function IconTenis() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20M12 2a10 10 0 0 0 0 20" />
    </svg>
  );
}
function IconDobles() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" /><path d="M2 20c0-3 2.7-5 6-5s6 2 6 5" />
      <circle cx="17" cy="8" r="3" /><path d="M12 20c0-3 2.7-5 5-5s5 2 5 5" />
    </svg>
  );
}
function IconPadel() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const MODOS = [
  { id: 'tenis_1v1', label: 'Tenis Individual', desc: 'Busco rival para jugar solo contra solo.', Icon: IconTenis, tieneSubModo: false },
  { id: 'tenis_dobles', label: 'Tenis Dobles', desc: 'Juego en pareja. Busco rival o busco compañero.', Icon: IconDobles, tieneSubModo: true },
  { id: 'padel', label: 'Padel', desc: 'Juego en pareja. Busco rival o busco compañero.', Icon: IconPadel, tieneSubModo: true },
];

export default function SelectorModo() {
  const navigate = useNavigate();
  const { modo: modoActual, subModo: subModoActual, cambiarModo, cambiarSubModo } = useModo();

  const [modoSel, setModoSel] = useState(modoActual || null);
  const [subSel, setSubSel] = useState(subModoActual || 'rival');

  const modoInfo = MODOS.find((m) => m.id === modoSel);
  const listo = modoSel && (!modoInfo?.tieneSubModo || subSel);

  function confirmar() {
    if (!listo) return;
    cambiarModo(modoSel);
    cambiarSubModo(subSel);
    navigate('/');
  }

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '32px 20px 40px',
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 44, marginBottom: 16 }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Modo de juego</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Elige como quieres jugar hoy</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {MODOS.map(({ id, label, desc, Icon }) => {
          const sel = modoSel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setModoSel(id); setSubSel('rival'); }}
              style={{
                textAlign: 'left', padding: '18px 20px', borderRadius: 18,
                border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
                cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <span style={{ color: sel ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                <Icon />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: sel ? 'var(--accent)' : 'var(--text)', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                background: sel ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
            </button>
          );
        })}

        {/* Sub-modo: rival o pareja */}
        {modoInfo?.tieneSubModo && (
          <div style={{
            background: 'var(--bg-elev)', borderRadius: 16, padding: '16px 18px', marginTop: 4,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .8 }}>
              Que buscas
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'rival', label: 'Busco rival', desc: 'Ya teneis pareja formada' },
                { id: 'pareja', label: 'Busco pareja', desc: 'Buscas compañero o compañera' },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSubSel(id)}
                  style={{
                    flex: 1, padding: '12px 10px', borderRadius: 12,
                    border: `2px solid ${subSel === id ? 'var(--accent)' : 'var(--border)'}`,
                    background: subSel === id ? 'rgba(34,197,94,.08)' : 'var(--bg-card)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all .2s',
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: 14, color: subSel === id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={confirmar}
        disabled={!listo}
        className="btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: 16, borderRadius: 16, marginTop: 24, opacity: listo ? 1 : .4 }}
      >
        Entrar al matchmaking
      </button>
    </div>
  );
}
