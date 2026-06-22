// Provincias de España (incluye Canarias con sus islas como sublocalización)
export const PROVINCIAS = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón',
  'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara',
  'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares', 'Jaén', 'A Coruña',
  'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga',
  'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra', 'Salamanca',
  'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
  'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
  'Ceuta', 'Melilla',
];

// Islas Canarias agrupadas por las dos provincias canarias
export const ISLAS_POR_PROVINCIA = {
  'Las Palmas': ['Gran Canaria', 'Lanzarote', 'Fuerteventura', 'La Graciosa'],
  'Santa Cruz de Tenerife': ['Tenerife', 'La Palma', 'La Gomera', 'El Hierro'],
};

export function esProvinciaCanaria(provincia) {
  return provincia === 'Las Palmas' || provincia === 'Santa Cruz de Tenerife';
}

export function getIslas(provincia) {
  return ISLAS_POR_PROVINCIA[provincia] || [];
}

// Etiqueta de ubicación combinada para mostrar y para comparar matchmaking
export function ubicacionLabel(provincia, isla) {
  if (esProvinciaCanaria(provincia) && isla) return `${isla} (${provincia})`;
  return provincia;
}

// Clave usada para filtrar "misma ubicación" en matchmaking/ranking
export function ubicacionKey(provincia, isla) {
  if (esProvinciaCanaria(provincia) && isla) return isla;
  return provincia;
}
