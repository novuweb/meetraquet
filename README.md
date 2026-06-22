# MeetRaquet

App de matchmaking deportivo para jugadores de pádel y tenis en España. Estilo Tinder: descubre rivales cerca de ti, deslízales un desafío y coordina el partido por chat en tiempo real.

Stack: **React + Vite** (frontend), **Supabase** (Auth + Postgres + Realtime + Storage), **Leaflet + OpenStreetMap** (mapa de pistas, sin coste).

## 1. Requisitos

- Node.js 18+
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta todo el contenido de `supabase/schema.sql`. Esto crea:
   - Tablas: `profiles`, `swipes`, `chats`, `messages`, `partidos`.
   - Todas las políticas de **Row Level Security** (cada usuario solo ve/edita lo suyo; los perfiles son visibles por todos los usuarios autenticados para que funcione el matchmaking).
   - El bucket de Storage `avatars` (público para lectura, solo el propio usuario puede subir/editar su foto).
   - Funciones RPC: `enviar_desafio`, `responder_desafio`, `reportar_resultado`, `confirmar_resultado`, `cambiar_ubicacion`.
   - Vistas `ranking_global` y `ranking_zona`.
   - Trigger que crea automáticamente una fila en `profiles` al registrarse un usuario.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
   - `service_role key` (¡secreta, solo para el seed!) → `SUPABASE_SERVICE_ROLE_KEY`
4. Activa **Realtime** para la tabla `messages` y `chats` (Database → Replication → habilitar ambas tablas).
5. En **Authentication → Settings**, puedes desactivar la confirmación de email en desarrollo si quieres probar más rápido (opcional).

## 3. Instalación del proyecto

```bash
npm install
cp .env.example .env
# edita .env con tus claves de Supabase
npm run dev
```

La app se abre en `http://localhost:5173`. Pruébala desde el móvil o con las devtools en modo responsive (está diseñada mobile-first).

## 4. Cargar los 55 perfiles falsos (seed)

El seed crea 55 usuarios reales en Supabase Auth (28 perfiles femeninos + 27 masculinos), todos ubicados en Canarias (La Palma / Tenerife), con stats variados para que el ranking tenga vida desde el primer día. Sube automáticamente las fotos reales desde las carpetas locales de chicos/chicas a Supabase Storage.

```bash
# Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en tu .env
npm run seed
```

Por defecto el script busca las fotos en:
- `SEED_PHOTOS_CHICOS` (variable de entorno, opcional) — si no se define, usa la ruta configurada en `supabase/seed.mjs`.
- `SEED_PHOTOS_CHICAS` (idem).

Si alguna carpeta de fotos no tiene suficientes imágenes, esos perfiles se crean sin foto (placeholder con inicial sobre fondo de color, gestionado automáticamente por la UI).

Los usuarios de seed se crean con la contraseña definida en `SEED_PASSWORD` (por defecto `Seed12345!`) — útil si quieres iniciar sesión como uno de ellos para testear.

## 5. Estructura del proyecto

```
src/
  components/    Componentes reutilizables (SwipeCard, ChallengeMessage, BottomNav...)
  pages/          Una página por sección (Login, Onboarding, Matchmaking, Messages, ChatRoom, Ranking, MapPage, Profile)
  hooks/          useAuth (sesión + perfil), useTheme (tema claro/oscuro persistido en localStorage)
  lib/            supabaseClient, provincias.js (provincias + islas Canarias), ranks.js (rangos/puntos), achievements.js (logros)
supabase/
  schema.sql      Esquema completo: tablas, RLS, storage, funciones RPC, vistas
  seed.mjs        Script de seed de 55 perfiles falsos
```

## 6. Cómo funciona el sistema de puntos y rangos

| Acción | Puntos |
|---|---|
| Registrarse | +50 |
| Completar perfil al 100% | +100 |
| Enviar un desafío | +10 |
| Que acepten tu desafío | +25 |
| Reportar partido ganado (confirmado por el rival) | +50 |
| Racha de 3 victorias seguidas | +75 bonus |

| Rango | Puntos |
|---|---|
| 🟤 Novato | 0 – 499 |
| 🟠 Calentando | 500 – 1.499 |
| 🟡 Consistente | 1.500 – 2.999 |
| 🟢 Competidor | 3.000 – 5.499 |
| 🔵 Élite | 5.500 – 9.999 |
| 🟣 Leyenda | 10.000+ |

## 7. Notas técnicas

- El mapa usa la **Overpass API** (overpass-api.de) para consultar pistas de pádel/tenis de OpenStreetMap en un radio de 20km alrededor de la ubicación del usuario — gratuito, sin API key.
- El chat usa **Supabase Realtime** (Postgres changes) para mensajes instantáneos sin polling.
- Las fotos de perfil se guardan en el bucket `avatars` de Supabase Storage, organizadas por `userId/avatar.ext`.
- Los desafíos, respuestas y resultados de partido se gestionan mediante funciones `SECURITY DEFINER` en Postgres (`enviar_desafio`, `responder_desafio`, `reportar_resultado`, `confirmar_resultado`) para mantener la lógica de negocio consistente y segura en el servidor.

## 8. Build de producción

```bash
npm run build
npm run preview
```

El proyecto no usa ningún servicio de pago: Supabase (plan gratuito), Leaflet/OpenStreetMap (gratis) y Overpass API (gratis).
