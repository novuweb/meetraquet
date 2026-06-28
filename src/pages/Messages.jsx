import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabaseClient';
import { DEMO_MODE } from '../lib/demo';
import { demoStore, demoChatsIniciales, DEMO_USER_ID } from '../lib/demoData';
import { listarFakeChats } from '../lib/fakeMatches';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      if (demoStore.chats.length === 0) demoStore.chats.push(...demoChatsIniciales);
      cargarChatsDemo();
      return;
    }
    cargarChats();
    const canal = supabase
      .channel('mensajes-lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, cargarChats)
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [user.id]);

  function cargarChatsDemo() {
    const lista = demoStore.chats.map((chat) => {
      const ultimo = chat.mensajes[chat.mensajes.length - 1];
      const noLeidos = chat.mensajes.filter((m) => !m.leido && m.remitente_id !== DEMO_USER_ID).length;
      return { ...chat, ultimo, noLeidos };
    });
    setChats(lista);
    setCargando(false);
  }

  async function cargarChats() {
    const { data: chatsData } = await supabase
      .from('chats')
      .select('*, otro_a:profiles!chats_usuario_a_fkey(*), otro_b:profiles!chats_usuario_b_fkey(*)')
      .or(`usuario_a.eq.${user.id},usuario_b.eq.${user.id}`)
      .eq('archivado', false)
      .order('created_at', { ascending: false });

    const chatIds = (chatsData || []).map((c) => c.id);
    const [{ data: todosMsg }, { data: noLeidosData }] = chatIds.length
      ? await Promise.all([
          supabase.from('messages').select('*').in('chat_id', chatIds).order('created_at', { ascending: false }),
          supabase.from('messages').select('chat_id').in('chat_id', chatIds).eq('leido', false).neq('remitente_id', user.id),
        ])
      : [{ data: [] }, { data: [] }];

    const ultimoPorChat = {};
    (todosMsg || []).forEach((m) => { if (!ultimoPorChat[m.chat_id]) ultimoPorChat[m.chat_id] = m; });
    const noLeidosPorChat = {};
    (noLeidosData || []).forEach((m) => { noLeidosPorChat[m.chat_id] = (noLeidosPorChat[m.chat_id] || 0) + 1; });

    const conUltimoMensaje = (chatsData || []).map((chat) => {
      const otro = chat.usuario_a === user.id ? chat.otro_b : chat.otro_a;
      return { ...chat, otro, ultimo: ultimoPorChat[chat.id] || null, noLeidos: noLeidosPorChat[chat.id] || 0 };
    });

    const fakeChats = listarFakeChats(user.id).map((chat) => {
      const ultimo = chat.mensajes[chat.mensajes.length - 1];
      return { ...chat, ultimo, noLeidos: 0 };
    });

    const todos = [...conUltimoMensaje, ...fakeChats];
    todos.sort((a, b) => new Date(b.ultimo?.created_at || b.created_at) - new Date(a.ultimo?.created_at || a.created_at));
    setChats(todos);
    setCargando(false);
  }

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Mensajes</h1>

      {chats.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ color: 'var(--text-muted)' }}>Aún no tienes conversaciones. ¡Desafía a alguien en Matchmaking!</p>
        </div>
      )}

      {chats.map((chat) => (
        <Link
          key={chat.id}
          to={`/chat/${chat.id}`}
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}
        >
          <div
            className="avatar"
            style={{
              width: 52, height: 52, flexShrink: 0,
              backgroundImage: chat.otro?.avatar_url ? `url(${chat.otro.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}
          >
            {!chat.otro?.avatar_url && chat.otro?.nombre?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{chat.otro?.nombre}</span>
              {chat.ultimo && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(chat.ultimo.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chat.ultimo?.contenido || 'Inicia la conversación'}
            </p>
          </div>
          {chat.noLeidos > 0 && (
            <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 22, height: 22, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {chat.noLeidos}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
