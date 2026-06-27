-- ============================================================
-- MIGRACIÓN: Stripe subscription support
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Añadir columnas de suscripción al perfil
alter table public.profiles
  add column if not exists suscrito boolean not null default false,
  add column if not exists stripe_customer_id text,
  add column if not exists suscripcion_inicio timestamptz,
  add column if not exists suscripcion_fin timestamptz;

-- 2. Permitir que la Edge Function (service role) actualice suscrito
-- Las RLS ya están activas; el service role las bypasea automáticamente.

-- 3. Función RPC que la Edge Function llama para marcar suscrito
create or replace function public.activar_suscripcion(
  p_user_id uuid,
  p_stripe_customer_id text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    suscrito = true,
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    suscripcion_inicio = coalesce(suscripcion_inicio, now()),
    updated_at = now()
  where id = p_user_id;
end;
$$;

-- 4. Función RPC para cancelar suscripción
create or replace function public.cancelar_suscripcion(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set suscrito = false, suscripcion_fin = now(), updated_at = now()
  where id = p_user_id;
end;
$$;

-- Revocar acceso público a estas funciones (solo service role puede llamarlas)
revoke execute on function public.activar_suscripcion(uuid, text) from anon, authenticated;
revoke execute on function public.cancelar_suscripcion(uuid) from anon, authenticated;
grant  execute on function public.activar_suscripcion(uuid, text) to service_role;
grant  execute on function public.cancelar_suscripcion(uuid) to service_role;
