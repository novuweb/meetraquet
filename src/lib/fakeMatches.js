// Gestión local (localStorage) de los swipes y chats con los 55 perfiles
// falsos embebidos en el código (ver perfilesFalsos.js). No son cuentas
// reales de Supabase, así que sus "desafíos" se resuelven de forma simulada
// en el propio dispositivo, sin backend.

const swipesKey = (uid) => `meetraquet_fake_swipes_${uid}`;
const chatsKey = (uid) => `meetraquet_fake_chats_${uid}`;

export function getFakeSwipes(uid) {
  try { return JSON.parse(localStorage.getItem(swipesKey(uid))) || {}; } catch { return {}; }
}
function saveFakeSwipes(uid, obj) {
  localStorage.setItem(swipesKey(uid), JSON.stringify(obj));
}
export function setFakeSwipe(uid, fakeId, accion) {
  const s = getFakeSwipes(uid);
  s[fakeId] = accion;
  saveFakeSwipes(uid, s);
}
// Vuelve a mostrar los perfiles "pasados" (no los ya "desafiados")
export function limpiarFakePasados(uid) {
  const s = getFakeSwipes(uid);
  const limpio = {};
  Object.entries(s).forEach(([id, accion]) => { if (accion === 'desafiado') limpio[id] = accion; });
  saveFakeSwipes(uid, limpio);
}

export function getFakeChats(uid) {
  try { return JSON.parse(localStorage.getItem(chatsKey(uid))) || {}; } catch { return {}; }
}
function saveFakeChats(uid, obj) {
  localStorage.setItem(chatsKey(uid), JSON.stringify(obj));
}

// Crea el chat con el mensaje de desafío. Se autoacepta al instante (el
// perfil falso no puede responder de verdad), para no dejar al usuario
// esperando una respuesta que nunca llegará.
export function crearFakeChat(uid, fakePerfil) {
  const chats = getFakeChats(uid);
  const chatId = `fake-chat-${fakePerfil.id}`;
  const ahora = new Date().toISOString();
  const chat = {
    id: chatId,
    usuario_a: uid,
    usuario_b: fakePerfil.id,
    estado_desafio: 'aceptado',
    desafio_iniciado_por: uid,
    archivado: false,
    otro: fakePerfil,
    mensajes: [
      { id: 'm1', remitente_id: uid, contenido: '¡Hola! Te desafío a un partido. ¿Aceptas el reto?', tipo: 'desafio', created_at: ahora },
      { id: 'm2', remitente_id: fakePerfil.id, contenido: '✅ Desafío aceptado. ¡A coordinar el partido!', tipo: 'sistema', created_at: ahora },
    ],
  };
  chats[chatId] = chat;
  saveFakeChats(uid, chats);
  setFakeSwipe(uid, fakePerfil.id, 'desafiado');
  return chat;
}

export function getFakeChat(uid, chatId) {
  return getFakeChats(uid)[chatId] || null;
}

export function actualizarFakeChat(uid, chatId, updater) {
  const chats = getFakeChats(uid);
  if (!chats[chatId]) return null;
  chats[chatId] = updater(chats[chatId]);
  saveFakeChats(uid, chats);
  return chats[chatId];
}

export function listarFakeChats(uid) {
  return Object.values(getFakeChats(uid));
}
