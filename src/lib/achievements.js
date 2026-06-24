// Sistema de logros automáticos, calculados a partir de las stats del perfil.
// `profile` debe incluir: racha_actual, partidos_jugados, victorias, derrotas,
// ultimo_partido_en, desafios_enviados, ubicaciones_cambiadas, posicion_zona (opcional)

const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;

export const LOGROS_DEF = [
  {
    id: 'en_racha',
    nombre: 'En racha',
    icono: '🔥',
    descripcion: '3 victorias consecutivas',
    check: (p) => (p.racha_actual || 0) >= 3,
  },
  {
    id: 'veterano',
    nombre: 'Veterano',
    icono: '💪',
    descripcion: 'Más de 20 partidos jugados',
    check: (p) => (p.partidos_jugados || 0) > 20,
  },
  {
    id: 'activo',
    nombre: 'Activo',
    icono: '⚡',
    descripcion: 'Ha jugado esta semana',
    check: (p) => p.ultimo_partido_en && (Date.now() - new Date(p.ultimo_partido_en).getTime()) <= unaSemanaMs,
  },
  {
    id: 'desafiador',
    nombre: 'Desafiador',
    icono: '🎯',
    descripcion: 'Más de 10 desafíos enviados',
    check: (p) => (p.desafios_enviados || 0) > 10,
  },
  {
    id: 'top10',
    nombre: 'Top 10',
    icono: '👑',
    descripcion: 'Top 10 del ranking de su zona',
    check: (p) => p.posicion_zona != null && p.posicion_zona <= 10,
  },
  {
    id: 'invicto',
    nombre: 'Invicto',
    icono: '🏆',
    descripcion: 'Nunca ha perdido (mínimo 3 partidos)',
    check: (p) => (p.partidos_jugados || 0) >= 3 && (p.derrotas || 0) === 0,
  },
  {
    id: 'viajero',
    nombre: 'Viajero',
    icono: '🌍',
    descripcion: 'Ha cambiado de ubicación alguna vez',
    check: (p) => (p.ubicaciones_cambiadas || 0) >= 1,
  },
  {
    id: 'deportista',
    nombre: 'Deportista',
    icono: '⭐',
    descripcion: 'Media de valoraciones superior a 4.5 (mínimo 5 valoraciones)',
    check: (p) => (p.valoraciones_recibidas || 0) >= 5 && (p.deportividad_media || 0) > 4.5,
  },
];

export function getLogrosConseguidos(profile) {
  if (!profile) return [];
  return LOGROS_DEF.filter((l) => l.check(profile));
}

export function getLogrosPendientes(profile) {
  if (!profile) return LOGROS_DEF;
  return LOGROS_DEF.filter((l) => !l.check(profile));
}

// Para la carta de matchmaking: máximo 3, priorizando los más "vistosos"
const PRIORIDAD = ['top10', 'invicto', 'deportista', 'en_racha', 'veterano', 'desafiador', 'activo', 'viajero'];
export function getLogrosDestacados(profile, max = 3) {
  const conseguidos = getLogrosConseguidos(profile);
  return conseguidos
    .sort((a, b) => PRIORIDAD.indexOf(a.id) - PRIORIDAD.indexOf(b.id))
    .slice(0, max);
}
