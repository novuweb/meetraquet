// Tres modos de matchmaking independientes. Cada uno filtra por el
// campo "deporte" del perfil (que admite 'Pádel' | 'Tenis' | 'Ambos').
export const MODOS = [
  { id: 'tenis_1v1', label: 'Tenis 1v1', icono: '🎾', deportes: ['Tenis', 'Ambos'] },
  { id: 'tenis_dobles', label: 'Tenis Dobles', icono: '👥', deportes: ['Tenis', 'Ambos'] },
  { id: 'padel', label: 'Pádel', icono: '🏓', deportes: ['Pádel', 'Ambos'] },
];

export function getModo(id) {
  return MODOS.find((m) => m.id === id) || MODOS[0];
}
