export const DISPONIBILIDAD_OPCIONES = [
  { id: 'manana_semana', label: 'Mañanas entre semana', corto: 'Mañ. L-V' },
  { id: 'tarde_semana', label: 'Tardes entre semana', corto: 'Tarde L-V' },
  { id: 'manana_finde', label: 'Mañanas fin de semana', corto: 'Mañ. finde' },
  { id: 'tarde_finde', label: 'Tardes fin de semana', corto: 'Tarde finde' },
];

export function labelDisponibilidad(id) {
  return DISPONIBILIDAD_OPCIONES.find((o) => o.id === id)?.corto || id;
}

// Kept for backward compatibility — returns the short label instead of emoji
export function iconoDisponibilidad(id) {
  return labelDisponibilidad(id);
}

export function solapeDisponibilidad(a = [], b = []) {
  if (!a?.length || !b?.length) return 0;
  return a.filter((x) => b.includes(x)).length;
}
