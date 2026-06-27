import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { ubicacionKey } from '../lib/provincias';
import SwipeCard from '../components/SwipeCard.jsx';
import { DEMO_MODE } from '../lib/demo';
import { demoJugadores, crearChatDemo } from '../lib/demoData';
import { PERFILES_FALSOS } from '../lib/perfilesFalsos';
import { getFakeSwipes, setFakeSwipe, crearFakeChat, limpiarFakePasados } from '../lib/fakeMatches';
import { MODOS, getModo } from '../lib/modos';
import { solapeDisponibilidad } from '../lib/disponibilidad';
import { sonidoDesafio, sonidoPasar } from '../lib/sounds';
import PaywallModal from '../components/PaywallModal.jsx';

const esFakeId = (id) => typeof id === 'string' && (id.startsWith('fake-') || id.startsWith('pair-'));

export default function Matchmaking() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('tenis_1v1');
  const [doblesBusca, setDoblesBusca] = useState(profile?.dobles_busca || 'rival');
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      setJugadores(demoJugadores);
      setCargando(false);
      return;
    }
    if (profile) cargarCandidatos();
  }, [profile?.id, modo, doblesBusca]);

  function ordenarPorDisponibilidad(lista) {
    return [...lista].sort((a, b) =>
      solapeDisponibilidad(b.disponibilidad, profile.disponibilidad) - solapeDisponibilidad(a.disponibilidad, profile.disponibilidad)
    );
  }

  function candidatosFalsos(soloExcluirDesafiados = false) {
    const zona = ubicacionKey(profile.provincia, profile.isla);
    const swipes = getFakeSwipes(user.id, modo);
    const deportesModo = getModo(modo).deportes;

    const base = PERFILES_FALSOS.filter((f) => {
      const mismaZona = ubicacionKey(f.provincia, f.isla) === zona;
      return mismaZona && deportesModo.includes(f.deporte);
    });

    if (modo === 'tenis_dobles' || modo === 'padel') {
      const parejas = [];
      for (let i = 0; i + 1 < base.length; i += 2) {
        const p1 = base[i];
        const p2 = base[i + 1];
        const pairId = `pair-${p1.id}-${p2.id}`;
        const accion = swipes[pairId];
        if (soloExcluirDesafiados && accion === 'desafiado') continue;
        if (!soloExcluirDesafiados && accion) continue;
        parejas.push({
          id: pairId,
          jugador1: p1,
          jugador2: p2,
          nombre: `${p1.nombre.split(' ')[0]} & ${p2.nombre.split(' ')[0]}`,
          edad: p1.edad,
          puntos: Math.round((p1.puntos + p2.puntos) / 2),
          deporte: p1.deporte,
          nivel: `${p1.nivel} · ${p2.nivel}`,
          provincia: p1.provincia,
          isla: p1.isla,
          disponibilidad: p1.disponibilidad || [],
          descripcion: p1.descripcion,
          avatar_url: null,
        });
      }
      return parejas;
    }

    return base.filter((f) => {
      const accion = swipes[f.id];
      if (soloExcluirDesafiados) return accion !== 'desafiado';
      return !accion;
    });
  }

  async function cargarCandidatos(soloExcluirDesafiados = false) {
    setCargando(true);
    const deportesModo = getModo(modo).deportes;

    let queryVistos = supabase.from('swipes').select('target_id').eq('swiper_id', user.id).eq('modo', modo);
    if (soloExcluirDesafiados) queryVistos = queryVistos.eq('accion', 'desafiado');
    const { data: vistos } = await queryVistos;
    const idsVistos = (vistos || []).map((v) => v.target_id);

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('perfil_completo', true)
      .in('deporte', deportesModo);

    if (profile.isla) query = query.eq('isla', profile.isla);
    else query = query.eq('provincia', profile.provincia).is('isla', null);

    if (modo === 'tenis_dobles') {
      query = query.eq('dobles_busca', doblesBusca);
    }

    const { data, error } = await query;

    const reales = error ? [] : (data || []).filter((j) => !idsVistos.includes(j.id));
    const falsos = candidatosFalsos(soloExcluirDesafiados);
    setJugadores(ordenarPorDisponibilidad([...reales, ...falsos]));
    setCargando(false);
  }

  async function pasar(jugador) {
    if (procesando) return;
    setProcesando(true);
    sonidoPasar();
    if (DEMO_MODE) {
      // no-op, ya gestionado abajo
    } else if (esFakeId(jugador.id)) {
      setFakeSwipe(user.id, modo, jugador.id, 'pasado');
    } else {
      await supabase.from('swipes').insert({ swiper_id: user.id, target_id: jugador.id, accion: 'pasado', modo });
    }
    setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
    setProcesando(false);
  }

  function desafiarConPaywall(jugador) {
    if (profile?.suscrito) {
      desafiar(jugador);
    } else {
      setShowPaywall(true);
    }
  }

  async function desafiar(jugador) {
    if (procesando) return;
    setProcesando(true);
    sonidoDesafio();

    if (DEMO_MODE) {
      const chat = crearChatDemo(jugador);
      setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
      setProcesando(false);
      navigate(`/chat/${chat.id}`);
      return;
    }

    if (esFakeId(jugador.id)) {
      const chat = crearFakeChat(user.id, modo, jugador);
      // El desafío se autoacepta al instante: +10 por enviarlo, +25 por ser aceptado.
      await supabase
        .from('profiles')
        .update({ puntos: (profile.puntos || 0) + 35, desafios_enviados: (profile.desafios_enviados || 0) + 1 })
        .eq('id', user.id);
      await refreshProfile();
      setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
      setProcesando(false);
      navigate(`/chat/${chat.id}`);
      return;
    }

    const { data: chatId, error } = await supabase.rpc('enviar_desafio', { p_target_id: jugador.id, p_modo: modo });
    setJugadores((prev) => prev.filter((j) => j.id !== jugador.id));
    setProcesando(false);
    if (!error && chatId) navigate(`/chat/${chatId}`);
  }

  function recargar() {
    if (DEMO_MODE) {
      setJugadores(demoJugadores);
      return;
    }
    limpiarFakePasados(user.id, modo);
    cargarCandidatos(true);
  }

  async function cambiarDoblesBusca(valor) {
    setDoblesBusca(valor);
    if (!DEMO_MODE) {
      await supabase.from('profiles').update({ dobles_busca: valor }).eq('id', user.id);
    }
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <div className="page-header" style={{ padding: 0, marginBottom: 12 }}>
        <h1>Encuentra tu rival</h1>
      </div>

      <div className="chip-row" style={{ marginBottom: modo === 'tenis_dobles' ? 8 : 16 }}>
        {MODOS.map((m) => (
          <button key={m.id} className={`chip ${modo === m.id ? 'selected' : ''}`} onClick={() => setModo(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {modo === 'tenis_dobles' && (
        <div className="chip-row" style={{ marginBottom: 16 }}>
          <button className={`chip ${doblesBusca === 'pareja' ? 'selected' : ''}`} onClick={() => cambiarDoblesBusca('pareja')}>
            Busco pareja
          </button>
          <button className={`chip ${doblesBusca === 'rival' ? 'selected' : ''}`} onClick={() => cambiarDoblesBusca('rival')}>
            Busco rival
          </button>
        </div>
      )}

      {cargando ? (
        <div className="center-screen"><div className="spinner" /></div>
      ) : (
        <>
          <div style={{ position: 'relative', flex: 1, minHeight: 420 }}>
            {jugadores.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 40, marginTop: 60 }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>—</p>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>No hay más jugadores cerca</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 18 }}>Vuelve más tarde o cambia tu ubicación desde el perfil.</p>
                <button className="btn-primary" onClick={recargar}>Recargar</button>
              </div>
            )}

            {jugadores.slice(0, 3).reverse().map((jugador, idx, arr) => (
              <SwipeCard
                key={jugador.id}
                jugador={jugador}
                esTop={idx === arr.length - 1}
                onPasar={() => pasar(jugador)}
                onDesafiar={() => desafiarConPaywall(jugador)}
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
                onClick={() => desafiarConPaywall(jugadores[0])}
                disabled={procesando}
                style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', fontSize: 24, color: '#fff', fontWeight: 800 }}
              >
                ✓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
