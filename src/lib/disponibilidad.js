// Franjas horarias de disponibilidad para jugar, seleccionables en
// onboarding/perfil y usadas para priorizar candidatos compatibles.
export const DISPONIBILIDAD_OPCIONES = [
  { id: 'manana_semana', label: 'Mañanas entre semana', icono: '🌅' },
  { id: 'tarde_semana', label: 'Tardes entre semana', icono: '🌇' },
  { id: 'manana_finde', label: 'Mañanas fin de semana', icono: '🌄' },
  { id: 'tarde_finde', label: 'Tardes fin de semana', icono: '🌆' },
];

export function iconoDisponibilidad(id) {
  return DISPONIBILIDAD_OPCIONES.find((o) => o.id === id)?.icono || '';
}

// Número de franjas en común entre dos jugadores (para ordenar candidatos)
export function solapeDisponibilidad(a = [], b = []) {
  if (!a?.length || !b?.length) return 0;
  return a.filter((x) => b.includes(x)).length;
}
