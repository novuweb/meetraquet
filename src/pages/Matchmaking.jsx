import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { ubicacionKey } from '../lib/provincias';
import SwipeCard from '../components/SwipeCard.jsx';
import { DEMO_MODE } from '../lib/demo';
import { demoJugadores, crearChatDemo } from '../lib/demoData';

export default function Matchmaking() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      setJugadores(demoJugadores);
      setCargando(false);
      return;
    }
    if (profile) cargarCandidatos();
  }, [profile?.id]);

  async function cargarCandidatos(soloExcluirDesafiados = false) {
    setCargando(true);
    const zona = ubicacionKey(profile.provincia, profile.isla);

    let queryVistos = supabase.from('swipes').select('target_id').eq('swiper_id', user.id);
    if (soloExcluirDesafiados) queryVistos = queryVistos.eq('accion', 'desafiado');
    const { data: vistos } = await queryVistos;
    const idsVistos = (vistos || []).map((v) => v.target_id);

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('perfil_completo', true);

    if (profile.isla) query = query.eq('isla', profile.isla);
    else query = query.eq('provincia', profile.provincia).is('isla', null);

    const { data, error } = await query;

    if (!error) {
      const filtrados = (data || []).filter((j) => !idsVistos.includes(j.id));
      setJugadores(filtrados);
    }
    setCargando(false);
    // referencia para evitar warning de lint sobre var no usada
    void zona;
  }

  async function pasar(jugador) {
    if (procesando) return;
    setProcesando(true);
    if (!DEMO_MODE) {
      await supabase.from('swipes').insert({ swiper_id: user.id, target_id: jugador.id, accion: 'pasado' });
    }
    setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
    setProcesando(false);
  }

  async function desafiar(jugador) {
    if (procesando) return;
    setProcesando(true);
    if (DEMO_MODE) {
      const chat = crearChatDemo(jugador);
      setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
      setProcesando(false);
      navigate(`/chat/${chat.id}`);
      return;
    }
    const { data: chatId, error } = await supabase.rpc('enviar_desafio', { p_target_id: jugador.id });
    setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
    setProcesando(false);
    if (!error && chatId) navigate(`/chat/${chatId}`);
  }

  function recargar() {
    if (DEMO_MODE) {
      setJugadores(demoJugadores);
      return;
    }
    cargarCandidatos(true);
  }

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 78px)' }}>
      <div className="page-header" style={{ padding: 0, marginBottom: 16 }}>
        <h1>Encuentra tu rival</h1>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 420 }}>
        {jugadores.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, marginTop: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎾</p>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>No hay más jugadores cerca</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 18 }}>Vuelve más tarde o cambia tu ubicación desde el perfil.</p>
            <button className="btn-primary" onClick={recargar}>🔄 Recargar</button>
          </div>
        )}

        {jugadores.slice(0, 3).reverse().map((jugador, idx, arr) => (
          <SwipeCard
            key={jugador.id}
            jugador={jugador}
            esTop={idx === arr.length - 1}
            onPasar={() => pasar(jugador)}
            onDesafiar={() => desafiar(jugador)}
          />
        ))}
      </div>

      {jugadores.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18 }}>
          <button
            onClick={() => pasar(jugadores[0])}
            disabled={procesando}
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 26, color: '#EF4444' }}
          >
            ✕
          </button>
          <button
            onClick={() => desafiar(jugadores[0])}
            disabled={procesando}
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', fontSize: 24, color: '#fff' }}
          >
            🎾
          </button>
        </div>
      )}
    </div>
  );
}
