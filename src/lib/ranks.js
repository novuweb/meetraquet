// Sistema de rangos por puntos acumulados
export const RANGOS = [
  { id: 'novato', nombre: 'Novato', icono: '🟤', min: 0, max: 499 },
  { id: 'calentando', nombre: 'Calentando', icono: '🟠', min: 500, max: 1499 },
  { id: 'consistente', nombre: 'Consistente', icono: '🟡', min: 1500, max: 2999 },
  { id: 'competidor', nombre: 'Competidor', icono: '🟢', min: 3000, max: 5499 },
  { id: 'elite', nombre: 'Élite', icono: '🔵', min: 5500, max: 9999 },
  { id: 'leyenda', nombre: 'Leyenda', icono: '🟣', min: 10000, max: Infinity },
];

export function getRango(puntos = 0) {
  return RANGOS.find((r) => puntos >= r.min && puntos <= r.max) || RANGOS[0];
}

export function getSiguienteRango(puntos = 0) {
  const actual = getRango(puntos);
  const idx = RANGOS.findIndex((r) => r.id === actual.id);
  return RANGOS[idx + 1] || null;
}

// Progreso 0-100 hacia el siguiente rango
export function progresoRango(puntos = 0) {
  const actual = getRango(puntos);
  const siguiente = getSiguienteRango(puntos);
  if (!siguiente) return 100;
  const rango = siguiente.min - actual.min;
  const avance = puntos - actual.min;
  return Math.min(100, Math.round((avance / rango) * 100));
}

// Puntos otorgados por cada acción (ver spec del producto)
export const PUNTOS = {
  REGISTRO: 50,
  PERFIL_COMPLETO: 100,
  ENVIAR_DESAFIO: 10,
  DESAFIO_ACEPTADO: 25,
  PARTIDO_GANADO: 50,
  RACHA_3_VICTORIAS: 75,
  SEMANA_ACTIVA: 30,
};
