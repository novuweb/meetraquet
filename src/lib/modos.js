export const MODOS = [
  { id: 'tenis_individual',    label: 'Tenis Individual',           icono: '🎾' },
  { id: 'tenis_dobles_pareja', label: 'Tenis Dobles — Busco pareja', icono: '🎾' },
  { id: 'tenis_dobles_rival',  label: 'Tenis Dobles — Tengo pareja', icono: '🎾' },
  { id: 'padel_individual',    label: 'Pádel Individual',            icono: '🏓' },
  { id: 'padel_dobles_pareja', label: 'Pádel — Busco pareja',        icono: '🏓' },
  { id: 'padel_dobles_rival',  label: 'Pádel — Tengo pareja',        icono: '🏓' },
];

export function getModo(id) {
  return MODOS.find((m) => m.id === id) || { id, label: id || 'Partido', icono: '🎾' };
}
