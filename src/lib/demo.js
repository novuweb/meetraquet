// Modo demo: se activa automáticamente cuando no hay claves de Supabase
// configuradas en el .env, para poder ver el diseño de la app sin backend.
export const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
