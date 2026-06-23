-- ============================================================
-- MEETRAQUET / meetraquet — Esquema de base de datos Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase, en orden.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLA: profiles
-- Un perfil por usuario de auth.users (1:1)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  edad int not null check (edad >= 16 and edad <= 99),
  avatar_url text,
  deporte text not null check (deporte in ('Pádel', 'Tenis', 'Ambos')),
  nivel text not null check (nivel in ('Principiante', 'Intermedio', 'Avanzado', 'Competición')),
  descripcion text check (char_length(descripcion) <= 150),
  provincia text not null,
  isla text, -- solo relevante si provincia es Las Palmas / Santa Cruz de Tenerife
  perfil_completo boolean not null default false,

  -- Stats de juego
  puntos int not null default 0,
  partidos_jugados int not null default 0,
  victorias int not null default 0,
  derrotas int not null default 0,
  racha_actual int not null default 0,
  desafios_enviados int not null default 0,
  ubicaciones_cambiadas int not null default 0,
  ultimo_partido_en timestamptz,
  ultima_actividad_en timestamptz default now(),
  racha_dias_activos int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_provincia on public.profiles (provincia);
create index if not exists idx_profiles_isla on public.profiles (isla);
create index if not exists idx_profiles_puntos on public.profiles (puntos desc);

-- ------------------------------------------------------------
-- TABLA: swipes
-- Registra los perfiles ya vistos por cada usuario (pasados o desafiados)
-- para que no vuelvan a aparecer en el matchmaking.
-- ------------------------------------------------------------
create table if not exists public.swipes (
  id uuid primary key default uuid_generate_v4(),
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  accion text not null check (accion in ('pasado', 'desafiado')),
  created_at timestamptz not null default now(),
  unique (swiper_id, target_id)
);

-- ------------------------------------------------------------
-- TABLA: chats
-- Un chat por par de usuarios (se crea al desafiar)
-- ------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  usuario_a uuid not null references public.profiles(id) on delete cascade,
  usuario_b uuid not null references public.profiles(id) on delete cascade,
  estado_desafio text not null default 'pendiente' check (estado_desafio in ('pendiente', 'aceptado', 'rechazado')),
  desafio_iniciado_por uuid references public.profiles(id),
  archivado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (usuario_a, usuario_b)
);

create index if not exists idx_chats_usuario_a on public.chats (usuario_a);
create index if not exists idx_chats_usuario_b on public.chats (usuario_b);

-- ------------------------------------------------------------
-- TABLA: messages
-- ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  remitente_id uuid not null references public.profiles(id) on delete cascade,
  contenido text not null,
  tipo text not null default 'texto' check (tipo in ('texto', 'desafio', 'sistema', 'partido')),
  partido_id uuid,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_chat on public.messages (chat_id, created_at);

-- ------------------------------------------------------------
-- TABLA: partidos
-- Reporte de resultados, requiere confirmación del rival
-- ------------------------------------------------------------
create table if not exists public.partidos (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete set null,
  reportado_por uuid not null references public.profiles(id) on delete cascade,
  ganador_id uuid not null references public.profiles(id) on delete cascade,
  perdedor_id uuid not null references public.profiles(id) on delete cascade,
  resultado text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado')),
  confirmado boolean not null default false,
  confirmado_en timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages
  add constraint messages_partido_id_fkey foreign key (partido_id) references public.partidos(id) on delete set null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.partidos enable row level security;

-- PROFILES: cualquier usuario autenticado puede leer perfiles (necesario para
-- matchmaking, ranking y chats), pero solo puede editar/insertar el suyo.
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- SWIPES: el usuario solo ve y crea sus propios swipes
create policy "swipes_select_own"
  on public.swipes for select
  to authenticated
  using (auth.uid() = swiper_id);

create policy "swipes_insert_own"
  on public.swipes for insert
  to authenticated
  with check (auth.uid() = swiper_id);

-- CHATS: solo los participantes del chat pueden verlo/crearlo/actualizarlo
create policy "chats_select_participant"
  on public.chats for select
  to authenticated
  using (auth.uid() = usuario_a or auth.uid() = usuario_b);

create policy "chats_insert_participant"
  on public.chats for insert
  to authenticated
  with check (auth.uid() = usuario_a or auth.uid() = usuario_b);

create policy "chats_update_participant"
  on public.chats for update
  to authenticated
  using (auth.uid() = usuario_a or auth.uid() = usuario_b);

-- MESSAGES: solo los participantes del chat asociado pueden leer/escribir
create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id
      and (c.usuario_a = auth.uid() or c.usuario_b = auth.uid())
    )
  );

create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    remitente_id = auth.uid()
    and exists (
      select 1 from public.chats c
      where c.id = chat_id
      and (c.usuario_a = auth.uid() or c.usuario_b = auth.uid())
    )
  );

create policy "messages_update_participant"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id
      and (c.usuario_a = auth.uid() or c.usuario_b = auth.uid())
    )
  );

-- PARTIDOS: visibles y editables solo por ganador/perdedor implicados
create policy "partidos_select_implicado"
  on public.partidos for select
  to authenticated
  using (auth.uid() = ganador_id or auth.uid() = perdedor_id or auth.uid() = reportado_por);

create policy "partidos_insert_implicado"
  on public.partidos for insert
  to authenticated
  with check (auth.uid() = reportado_por and (auth.uid() = ganador_id or auth.uid() = perdedor_id));

create policy "partidos_update_implicado"
  on public.partidos for update
  to authenticated
  using (auth.uid() = ganador_id or auth.uid() = perdedor_id);

-- ============================================================
-- STORAGE: bucket "avatars" para fotos de perfil
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_upload_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- FUNCIÓN: updated_at automático en profiles
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil base automáticamente al registrarse
-- (el onboarding completa el resto de campos con un UPDATE)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, edad, deporte, nivel, provincia, puntos)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', 'Jugador/a'), 18, 'Pádel', 'Principiante', 'Madrid', 50)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCIÓN RPC: enviar_desafio
-- Crea (o reutiliza) un chat entre dos usuarios, inserta el mensaje
-- de desafío y otorga los +10 pts por enviar el desafío.
-- ============================================================
create or replace function public.enviar_desafio(p_target_id uuid)
returns uuid as $$
declare
  v_chat_id uuid;
  v_a uuid;
  v_b uuid;
begin
  if p_target_id = auth.uid() then
    raise exception 'No puedes desafiarte a ti mismo';
  end if;

  -- orden determinista para evitar duplicados (a,b) vs (b,a)
  if auth.uid() < p_target_id then
    v_a := auth.uid(); v_b := p_target_id;
  else
    v_a := p_target_id; v_b := auth.uid();
  end if;

  insert into public.chats (usuario_a, usuario_b, estado_desafio, desafio_iniciado_por)
  values (v_a, v_b, 'pendiente', auth.uid())
  on conflict (usuario_a, usuario_b) do update set archivado = false
  returning id into v_chat_id;

  insert into public.messages (chat_id, remitente_id, contenido, tipo)
  values (v_chat_id, auth.uid(), '¡Hola! Te desafío a un partido. ¿Aceptas el reto?', 'desafio');

  insert into public.swipes (swiper_id, target_id, accion)
  values (auth.uid(), p_target_id, 'desafiado')
  on conflict (swiper_id, target_id) do update set accion = 'desafiado';

  update public.profiles
  set puntos = puntos + 10, desafios_enviados = desafios_enviados + 1
  where id = auth.uid();

  return v_chat_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN RPC: responder_desafio
-- accion: 'aceptado' | 'rechazado'
-- ============================================================
create or replace function public.responder_desafio(p_chat_id uuid, p_accion text)
returns void as $$
declare
  v_iniciador uuid;
begin
  if p_accion not in ('aceptado', 'rechazado') then
    raise exception 'Acción inválida';
  end if;

  select desafio_iniciado_por into v_iniciador from public.chats where id = p_chat_id;

  update public.chats
  set estado_desafio = p_accion,
      archivado = (p_accion = 'rechazado')
  where id = p_chat_id
    and (usuario_a = auth.uid() or usuario_b = auth.uid());

  insert into public.messages (chat_id, remitente_id, contenido, tipo)
  values (
    p_chat_id,
    auth.uid(),
    case when p_accion = 'aceptado' then '✅ Desafío aceptado. ¡A coordinar el partido!'
         else '❌ Desafío rechazado.' end,
    'sistema'
  );

  if p_accion = 'aceptado' and v_iniciador is not null then
    update public.profiles set puntos = puntos + 25 where id = v_iniciador;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN RPC: reportar_resultado
-- Cualquiera de los dos jugadores del chat reporta el resultado
-- (ej. "6-0 6-0") indicando quién perdió. El rival debe confirmar
-- para que se sumen los puntos correspondientes.
-- ============================================================
create or replace function public.reportar_resultado(p_chat_id uuid, p_perdedor_id uuid, p_resultado text)
returns uuid as $$
declare
  v_partido_id uuid;
  v_otro uuid;
begin
  select case when usuario_a = auth.uid() then usuario_b else usuario_a end into v_otro
  from public.chats where id = p_chat_id and (usuario_a = auth.uid() or usuario_b = auth.uid());

  if v_otro is null then
    raise exception 'No participas en este chat';
  end if;

  if p_perdedor_id <> auth.uid() and p_perdedor_id <> v_otro then
    raise exception 'El perdedor debe ser uno de los dos jugadores del chat';
  end if;

  insert into public.partidos (chat_id, reportado_por, ganador_id, perdedor_id, resultado)
  values (
    p_chat_id, auth.uid(),
    case when p_perdedor_id = auth.uid() then v_otro else auth.uid() end,
    p_perdedor_id,
    p_resultado
  )
  returning id into v_partido_id;

  insert into public.messages (chat_id, remitente_id, contenido, tipo, partido_id)
  values (p_chat_id, auth.uid(), '🏆 Resultado reportado: ' || p_resultado, 'partido', v_partido_id);

  return v_partido_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN RPC: confirmar_resultado
-- Solo el rival (no quien reportó) puede confirmar. Al confirmar
-- se suman los puntos: +50 al ganador, bonus +75 si llega a 3
-- victorias seguidas, y se actualizan stats de ambos.
-- ============================================================
create or replace function public.confirmar_resultado(p_partido_id uuid)
returns void as $$
declare
  v_ganador uuid;
  v_perdedor uuid;
  v_reportado_por uuid;
  v_chat_id uuid;
  v_racha int;
begin
  select ganador_id, perdedor_id, reportado_por, chat_id
  into v_ganador, v_perdedor, v_reportado_por, v_chat_id
  from public.partidos where id = p_partido_id and estado = 'pendiente';

  if v_ganador is null then
    raise exception 'Partido no encontrado o ya resuelto';
  end if;

  if auth.uid() = v_reportado_por then
    raise exception 'No puedes confirmar tu propio reporte, debe hacerlo el rival';
  end if;

  if auth.uid() <> v_ganador and auth.uid() <> v_perdedor then
    raise exception 'No participas en este partido';
  end if;

  update public.partidos
  set estado = 'confirmado', confirmado = true, confirmado_en = now()
  where id = p_partido_id;

  update public.profiles
  set partidos_jugados = partidos_jugados + 1,
      victorias = victorias + 1,
      racha_actual = racha_actual + 1,
      puntos = puntos + 50,
      ultimo_partido_en = now()
  where id = v_ganador
  returning racha_actual into v_racha;

  if v_racha = 3 then
    update public.profiles set puntos = puntos + 75 where id = v_ganador;
  end if;

  update public.profiles
  set partidos_jugados = partidos_jugados + 1,
      derrotas = derrotas + 1,
      racha_actual = 0,
      ultimo_partido_en = now()
  where id = v_perdedor;

  insert into public.messages (chat_id, remitente_id, contenido, tipo)
  values (v_chat_id, auth.uid(), '✅ Resultado confirmado. ¡Puntos sumados!', 'sistema');
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN RPC: rechazar_resultado
-- El rival rechaza el resultado reportado: no se suman puntos.
-- ============================================================
create or replace function public.rechazar_resultado(p_partido_id uuid)
returns void as $$
declare
  v_reportado_por uuid;
  v_chat_id uuid;
  v_ganador uuid;
  v_perdedor uuid;
begin
  select reportado_por, chat_id, ganador_id, perdedor_id
  into v_reportado_por, v_chat_id, v_ganador, v_perdedor
  from public.partidos where id = p_partido_id and estado = 'pendiente';

  if v_reportado_por is null then
    raise exception 'Partido no encontrado o ya resuelto';
  end if;

  if auth.uid() = v_reportado_por then
    raise exception 'No puedes rechazar tu propio reporte';
  end if;

  if auth.uid() <> v_ganador and auth.uid() <> v_perdedor then
    raise exception 'No participas en este partido';
  end if;

  update public.partidos set estado = 'rechazado' where id = p_partido_id;

  insert into public.messages (chat_id, remitente_id, contenido, tipo)
  values (v_chat_id, auth.uid(), '❌ Resultado rechazado, no se han sumado puntos.', 'sistema');
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN RPC: cambiar_ubicacion
-- Actualiza provincia/isla y cuenta como "viaje" para el logro 🌍
-- ============================================================
create or replace function public.cambiar_ubicacion(p_provincia text, p_isla text)
returns void as $$
begin
  update public.profiles
  set provincia = p_provincia,
      isla = p_isla,
      ubicaciones_cambiadas = ubicaciones_cambiadas + 1
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- ============================================================
-- VISTA: ranking_global (para ordenar y calcular posición fácilmente)
-- ============================================================
create or replace view public.ranking_global as
select
  id, nombre, avatar_url, provincia, isla, puntos,
  row_number() over (order by puntos desc, created_at asc) as posicion
from public.profiles;

create or replace view public.ranking_zona as
select
  id, nombre, avatar_url, provincia, isla, puntos,
  coalesce(isla, provincia) as zona,
  row_number() over (partition by coalesce(isla, provincia) order by puntos desc, created_at asc) as posicion_zona
from public.profiles;
