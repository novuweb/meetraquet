// Datos de ejemplo usados solo en DEMO_MODE (sin Supabase configurado).

export const DEMO_USER_ID = 'demo-yo';

export const demoPerfilPropio = {
  id: DEMO_USER_ID,
  nombre: 'Tú',
  edad: 24,
  avatar_url: null,
  deporte: 'Pádel',
  nivel: 'Intermedio',
  descripcion: 'Probando MEETRAQUET en modo demo.',
  provincia: 'Santa Cruz de Tenerife',
  isla: 'Tenerife',
  perfil_completo: true,
  puntos: 1280,
  partidos_jugados: 14,
  victorias: 9,
  derrotas: 5,
  racha_actual: 3,
  desafios_enviados: 6,
  ubicaciones_cambiadas: 1,
  posicion_zona: 4,
  ultimo_partido_en: new Date().toISOString(),
};

export const demoJugadores = [
  {
    id: 'demo-1', nombre: 'Nayra', edad: 22, avatar_url: null, deporte: 'Pádel', nivel: 'Avanzado',
    descripcion: 'Pádel los findes, ¡vengo con ganas de competir!', provincia: 'Santa Cruz de Tenerife', isla: 'Tenerife',
    puntos: 6200, racha_actual: 4, partidos_jugados: 28, victorias: 28, derrotas: 0, desafios_enviados: 14, posicion_zona: 2,
  },
  {
    id: 'demo-2', nombre: 'Airam', edad: 25, avatar_url: null, deporte: 'Tenis', nivel: 'Competición',
    descripcion: 'Tenis desde los 12, busco rivales de nivel alto.', provincia: 'Santa Cruz de Tenerife', isla: 'Tenerife',
    puntos: 3400, racha_actual: 0, partidos_jugados: 22, victorias: 12, derrotas: 10, desafios_enviados: 11, posicion_zona: 9,
  },
  {
    id: 'demo-3', nombre: 'Aday', edad: 19, avatar_url: null, deporte: 'Ambos', nivel: 'Principiante',
    descripcion: 'Recién empezando, busco gente para aprender.', provincia: 'Santa Cruz de Tenerife', isla: 'Tenerife',
    puntos: 180, racha_actual: 0, partidos_jugados: 2, victorias: 1, derrotas: 1, desafios_enviados: 2, posicion_zona: 40,
  },
  {
    id: 'demo-4', nombre: 'Yaiza', edad: 21, avatar_url: null, deporte: 'Pádel', nivel: 'Intermedio',
    descripcion: 'Competitiva pero con buen ambiente. ¡Vamos a pelotear!', provincia: 'Santa Cruz de Tenerife', isla: 'Tenerife',
    puntos: 2100, racha_actual: 2, partidos_jugados: 16, victorias: 10, derrotas: 6, desafios_enviados: 8, posicion_zona: 15,
  },
];

export const demoRanking = [
  { id: 'demo-1', nombre: 'Nayra', avatar_url: null, puntos: 6200 },
  { id: 'demo-5', nombre: 'Saúl Pérez', avatar_url: null, puntos: 5800 },
  { id: 'demo-6', nombre: 'Carla Reyes', avatar_url: null, puntos: 4900 },
  { id: DEMO_USER_ID, nombre: 'Tú', avatar_url: null, puntos: 1280 },
  { id: 'demo-2', nombre: 'Airam', avatar_url: null, puntos: 3400 },
  { id: 'demo-4', nombre: 'Yaiza', avatar_url: null, puntos: 2100 },
  { id: 'demo-3', nombre: 'Aday', avatar_url: null, puntos: 180 },
].sort((a, b) => b.puntos - a.puntos).map((j, i) => ({ ...j, posicion: i + 1 }));

export function crearChatDemo(jugador) {
  const chat = {
    id: `demo-chat-${jugador.id}`,
    usuario_a: DEMO_USER_ID,
    usuario_b: jugador.id,
    estado_desafio: 'pendiente',
    desafio_iniciado_por: DEMO_USER_ID,
    otro: jugador,
    mensajes: [
      { id: 'm1', remitente_id: DEMO_USER_ID, contenido: '¡Hola! Te desafío a un partido. ¿Aceptas el reto?', tipo: 'desafio', created_at: new Date().toISOString() },
    ],
  };
  demoStore.chats.push(chat);
  return chat;
}

// Store en memoria compartido entre páginas mientras dura la sesión demo
export const demoStore = {
  chats: [],
};

export const demoChatsIniciales = [
  {
    id: 'demo-chat-fijo',
    usuario_a: DEMO_USER_ID,
    usuario_b: 'demo-1',
    estado_desafio: 'aceptado',
    desafio_iniciado_por: 'demo-1',
    otro: demoJugadores[0],
    mensajes: [
      { id: 'm1', remitente_id: 'demo-1', contenido: '¡Hola! Te desafío a un partido. ¿Aceptas el reto?', tipo: 'desafio', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm2', remitente_id: 'demo-1', contenido: '✅ Desafío aceptado. ¡A coordinar el partido!', tipo: 'sistema', created_at: new Date(Date.now() - 3500000).toISOString() },
      { id: 'm3', remitente_id: DEMO_USER_ID, contenido: '¡Genial! ¿Te viene bien el sábado a las 10?', tipo: 'texto', created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: 'm4', remitente_id: 'demo-1', contenido: 'Perfecto, reservo la pista 😊', tipo: 'texto', created_at: new Date(Date.now() - 900000).toISOString() },
    ],
  },
];
