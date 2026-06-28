import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useModo, MODO_LABELS } from '../hooks/useModo.jsx';
import { supabase } from '../lib/supabaseClient';

const MODOS_DEF = [
  { id: 'tenis_individual', titulo: 'Tenis Individual', desc: 'Busco rival para jugar uno contra uno' },
  { id: 'tenis_dobles_pareja', titulo: 'Tenis Dobles — Busco pareja', desc: 'Quiero encontrar un companero de dobles' },
  { id: 'tenis_dobles_rival', titulo: 'Tenis Dobles — Tengo pareja', desc: 'Ya jugamos en pareja, buscamos rivales' },
  { id: 'padel_individual', titulo: 'Padel Individual', desc: 'Busco rival para jugar uno contra uno' },
  { id: 'padel_dobles_pareja', titulo: 'Padel — Busco pareja', desc: 'Quiero encontrar un companero de padel' },
  { id: 'padel_dobles_rival', titulo: 'Padel — Tengo pareja', desc: 'Ya jugamos en pareja, buscamos rivales' },
];

export default function SelectorModo() {
  const { profile, user } = useAuth();
  const { cambiarModo } = useModo();
  const navigate = useNavigate();

  const [modoSel, setModoSel] = useState(profile?.modo_activo || null);
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    if (!modoSel || cargando) return;
    setCargando(true);
    cambiarModo(modoSel);
    await supabase.from('profiles').update({ modo_activo: modoSel }).eq('id', user.id);
    const modos = profile?.modos_configurados || [];
    if (modos.includes(modoSel)) {
      navigate('/');
    } else {
      navigate('/onboarding-modo', { state: { modo: modoSel } });
    }
  }

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '32px 20px 40px', maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img src="/logo-mr.png" alt="MeetRacquet" style={{ height: 44, marginBottom: 16 }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Modo de juego</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Elige como quieres jugar hoy. Puedes cambiarlo en cualquier momento.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {MODOS_DEF.map(({ id, titulo, desc }) => {
          const sel = modoSel === id;
          const yaConf = (profile?.modos_configurados || []).includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setModoSel(id)}
              style={{
                textAlign: 'left', padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                background: sel ? 'rgba(34,197,94,.07)' : 'var(--bg-card)',
                transition: 'all .18s',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: sel ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{titulo}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  background: sel ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                {yaConf && (
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>Conf.</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={confirmar}
        disabled={!modoSel || cargando}
        className="btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: 16, borderRadius: 16, marginTop: 24, opacity: modoSel ? 1 : .4 }}
      >
        {cargando ? 'Cargando...' : 'Continuar'}
      </button>
    </div>
  );
}
