import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import ChallengeMessage from '../components/ChallengeMessage.jsx';
import MatchResultMessage from '../components/MatchResultMessage.jsx';
import ReportarResultadoForm from '../components/ReportarResultadoForm.jsx';
import { DEMO_MODE } from '../lib/demo';
import { demoStore, DEMO_USER_ID } from '../lib/demoData';
import { getFakeChat, actualizarFakeChat } from '../lib/fakeMatches';

const esFakeChatId = (id) => typeof id === 'string' && id.startsWith('fake-chat-');

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const esFake = !DEMO_MODE && esFakeChatId(chatId);

  const [chat, setChat] = useState(null);
  const [otro, setOtro] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [partidos, setPartidos] = useState({}); // { [partidoId]: partidoRow }
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarFormResultado, setMostrarFormResultado] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (DEMO_MODE) {
      const chatDemo = demoStore.chats.find((c) => c.id === chatId);
      if (chatDemo) {
        setChat(chatDemo);
        setOtro(chatDemo.otro);
        setMensajes(chatDemo.mensajes);
      }
      setCargando(false);
      return;
    }
    if (esFake) {
      const fakeChat = getFakeChat(user.id, chatId);
      if (fakeChat) {
        setChat(fakeChat);
        setOtro(fakeChat.otro);
        setMensajes(fakeChat.mensajes);
      }
      setCargando(false);
      return;
    }
    cargarTodo();
    const canal = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, async (payload) => {
        setMensajes((prev) => [...prev, payload.new]);
        if (payload.new.tipo === 'partido' && payload.new.partido_id) {
          await cargarPartido(payload.new.partido_id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` }, (payload) => {
        setChat(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partidos', filter: `chat_id=eq.${chatId}` }, (payload) => {
        setPartidos((prev) => ({ ...prev, [payload.new.id]: payload.new }));
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [chatId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length]);

  async function cargarPartido(partidoId) {
    const { data } = await supabase.from('partidos').select('*').eq('id', partidoId).single();
    if (data) setPartidos((prev) => ({ ...prev, [data.id]: data }));
  }

  async function cargarTodo() {
    const { data: chatData } = await supabase.from('chats').select('*').eq('id', chatId).single();
    setChat(chatData);

    if (chatData) {
      const otroId = chatData.usuario_a === user.id ? chatData.usuario_b : chatData.usuario_a;
      const { data: perfilOtro } = await supabase.from('profiles').select('*').eq('id', otroId).single();
      setOtro(perfilOtro);
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMensajes(msgs || []);

    const partidoIds = (msgs || []).filter((m) => m.tipo === 'partido' && m.partido_id).map((m) => m.partido_id);
    if (partidoIds.length > 0) {
      const { data: partidosData } = await supabase.from('partidos').select('*').in('id', partidoIds);
      const dict = {};
      (partidosData || []).forEach((p) => { dict[p.id] = p; });
      setPartidos(dict);
    }

    await supabase.from('messages').update({ leido: true }).eq('chat_id', chatId).neq('remitente_id', user.id);
    setCargando(false);
  }

  async function enviarMensaje(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    const contenido = texto.trim();
    setTexto('');

    if (DEMO_MODE) {
      const nuevo = { id: `m-${Date.now()}`, remitente_id: user.id, contenido, tipo: 'texto', created_at: new Date().toISOString() };
      const chatDemo = demoStore.chats.find((c) => c.id === chatId);
      chatDemo?.mensajes.push(nuevo);
      setMensajes((prev) => [...prev, nuevo]);
      return;
    }

    if (esFake) {
      const nuevo = { id: `m-${Date.now()}`, remitente_id: user.id, contenido, tipo: 'texto', created_at: new Date().toISOString() };
      actualizarFakeChat(user.id, chatId, (c) => ({ ...c, mensajes: [...c.mensajes, nuevo] }));
      setMensajes((prev) => [...prev, nuevo]);
      return;
    }

    await supabase.from('messages').insert({ chat_id: chatId, remitente_id: user.id, contenido, tipo: 'texto' });
  }

  function onDesafioResuelto(accion) {
    setChat((prev) => ({ ...prev, estado_desafio: accion }));

    if (DEMO_MODE) {
      const sistema = {
        id: `m-${Date.now()}`,
        remitente_id: DEMO_USER_ID,
        contenido: accion === 'aceptado' ? '✅ Desafío aceptado. ¡A coordinar el partido!' : '❌ Desafío rechazado.',
        tipo: 'sistema',
        created_at: new Date().toISOString(),
      };
      const chatDemo = demoStore.chats.find((c) => c.id === chatId);
      if (chatDemo) {
        chatDemo.estado_desafio = accion;
        chatDemo.mensajes.push(sistema);
      }
      setMensajes((prev) => [...prev, sistema]);
    }
  }

  function onResultadoResuelto(partidoId, estado) {
    setPartidos((prev) => ({ ...prev, [partidoId]: { ...prev[partidoId], estado } }));
  }

  async function reportarResultado(quienGano, resultado) {
    setMostrarFormResultado(false);
    if (!otro) return;
    const perdedorId = quienGano === 'yo' ? otro.id : user.id;

    if (DEMO_MODE) {
      const ganadorId = quienGano === 'yo' ? user.id : otro.id;
      const partidoId = `partido-${Date.now()}`;
      const partido = { id: partidoId, ganador_id: ganadorId, perdedor_id: perdedorId, resultado, estado: 'pendiente', reportado_por: user.id };
      const nuevo = { id: `m-${Date.now()}`, remitente_id: user.id, contenido: `🏆 Resultado reportado: ${resultado}`, tipo: 'partido', partido_id: partidoId, created_at: new Date().toISOString() };
      setPartidos((prev) => ({ ...prev, [partidoId]: partido }));
      setMensajes((prev) => [...prev, nuevo]);
      return;
    }

    if (esFake) {
      // El rival falso no puede confirmar de verdad: se autoconfirma al instante
      // y se aplican los puntos reales (+200 victoria / -100 derrota) al usuario.
      const ganadorId = quienGano === 'yo' ? user.id : otro.id;
      const partidoId = `partido-${Date.now()}`;
      const ahora = new Date().toISOString();
      const partido = { id: partidoId, ganador_id: ganadorId, perdedor_id: perdedorId, resultado, estado: 'confirmado', reportado_por: user.id };
      const mensajeResultado = { id: `m-${Date.now()}`, remitente_id: user.id, contenido: `🏆 Resultado reportado: ${resultado}`, tipo: 'partido', partido_id: partidoId, created_at: ahora };
      const mensajeSistema = { id: `m-${Date.now() + 1}`, remitente_id: otro.id, contenido: '✅ Resultado confirmado. ¡Puntos sumados!', tipo: 'sistema', created_at: ahora };

      actualizarFakeChat(user.id, chatId, (c) => ({ ...c, mensajes: [...c.mensajes, mensajeResultado, mensajeSistema] }));
      setPartidos((prev) => ({ ...prev, [partidoId]: partido }));
      setMensajes((prev) => [...prev, mensajeResultado, mensajeSistema]);

      const gane = quienGano === 'yo';
      const racha = gane ? (profile.racha_actual || 0) + 1 : 0;
      const bonusRacha = gane && racha === 3 ? 75 : 0;
      const puntos = gane
        ? (profile.puntos || 0) + 200 + bonusRacha
        : Math.max((profile.puntos || 0) - 100, 0);

      await supabase.from('profiles').update({
        puntos,
        partidos_jugados: (profile.partidos_jugados || 0) + 1,
        victorias: (profile.victorias || 0) + (gane ? 1 : 0),
        derrotas: (profile.derrotas || 0) + (gane ? 0 : 1),
        racha_actual: racha,
        ultimo_partido_en: ahora,
      }).eq('id', user.id);
      await refreshProfile();
      return;
    }

    await supabase.rpc('reportar_resultado', { p_chat_id: chatId, p_perdedor_id: perdedorId, p_resultado: resultado });
  }

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, alignItems: 'center' }}>
        <button onClick={() => navigate('/mensajes')} style={{ fontSize: 20, marginRight: 6 }}>←</button>
        <button
          onClick={() => otro && navigate(`/jugador/${otro.id}`)}
          style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 10, textAlign: 'left' }}
        >
          <div
            className="avatar"
            style={{
              width: 36, height: 36, flexShrink: 0,
              backgroundImage: otro?.avatar_url ? `url(${otro.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
            }}
          >
            {!otro?.avatar_url && otro?.nombre?.[0]?.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 17 }}>{otro?.nombre}</h1>
        </button>
        <button className="chip" onClick={() => setMostrarFormResultado((v) => !v)}>🏆 Finalizar</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
        {mostrarFormResultado && (
          <ReportarResultadoForm
            otro={otro}
            onCancelar={() => setMostrarFormResultado(false)}
            onConfirmar={reportarResultado}
          />
        )}

        {mensajes.map((m) => {
          if (m.tipo === 'desafio') {
            return (
              <ChallengeMessage
                key={m.id}
                chat={chat}
                mensaje={m}
                esMio={m.remitente_id === user.id}
                onResuelto={onDesafioResuelto}
              />
            );
          }
          if (m.tipo === 'partido') {
            return (
              <MatchResultMessage
                key={m.id}
                mensaje={m}
                partido={partidos[m.partido_id]}
                esMio={m.remitente_id === user.id}
                onResuelto={(estado) => onResultadoResuelto(m.partido_id, estado)}
              />
            );
          }
          if (m.tipo === 'sistema') {
            return (
              <p key={m.id} style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '8px 0' }}>
                {m.contenido}
              </p>
            );
          }
          const esMio = m.remitente_id === user.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: esMio ? 'flex-end' : 'flex-start',
                background: esMio ? 'var(--accent)' : 'var(--bg-card)',
                color: esMio ? '#fff' : 'var(--text)',
                border: esMio ? 'none' : '1px solid var(--border)',
                borderRadius: 16,
                padding: '10px 14px',
                maxWidth: '75%',
                marginBottom: 8,
                fontSize: 14.5,
              }}
            >
              {m.contenido}
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje..." />
        <button type="submit" className="btn-primary" style={{ padding: '12px 18px' }}>➤</button>
      </form>
    </div>
  );
}
