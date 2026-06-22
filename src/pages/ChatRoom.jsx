import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import ChallengeMessage from '../components/ChallengeMessage.jsx';
import { DEMO_MODE } from '../lib/demo';
import { demoStore, DEMO_USER_ID } from '../lib/demoData';

export default function ChatRoom() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chat, setChat] = useState(null);
  const [otro, setOtro] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
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
    cargarTodo();
    const canal = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMensajes((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats', filter: `id=eq.${chatId}` }, (payload) => {
        setChat(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [chatId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length]);

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

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, alignItems: 'center' }}>
        <button onClick={() => navigate('/mensajes')} style={{ fontSize: 20, marginRight: 6 }}>←</button>
        <div
          className="avatar"
          style={{
            width: 36, height: 36,
            backgroundImage: otro?.avatar_url ? `url(${otro.avatar_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
          }}
        >
          {!otro?.avatar_url && otro?.nombre?.[0]?.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>{otro?.nombre}</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
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
