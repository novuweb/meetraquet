-- ============================================================
-- MEETRAQUET — Migración 2
-- Ejecutar UNA VEZ en el SQL Editor de Supabase (Database → SQL Editor).
-- Añade: modos de matchmaking, disponibilidad horaria, valoraciones
-- post-partido y códigos de referido.
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES: nuevas columnas
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists disponibilidad text[] not null default '{}',
  add column if not exists dobles_busca text not null default 'rival' check (dobles_busca in ('pareja', 'rival')),
  add column if not exists codigo_referido text unique,
  add column if not exists referido_por uuid references public.profiles(id),
  add column if not exists deportividad_media numeric(3,2) not null default 0,
  add column if not exists puntualidad_media numeric(3,2) not null default 0,
  add column if not exists valoraciones_recibidas int not null default 0;

-- Genera códigos de referido para perfiles ya existentes que no tengan uno
update public.profiles
set codigo_referido = upper(substr(replace(id::text, '-', ''), 1, 7))
where codigo_referido is null;

-- ------------------------------------------------------------
-- SWIPES / CHATS / PARTIDOS: columna "modo"
-- ------------------------------------------------------------
alter table public.swipes
  add column if not exists modo text not null default 'tenis_1v1' check (modo in ('tenis_1v1', 'tenis_dobles', 'padel'));

alter table public.chats
  add column if not exists modo text not null default 'tenis_1v1' check (modo in ('tenis_1v1', 'tenis_dobles', 'padel'));

alter table public.partidos
  add column if not exists modo text not null default 'tenis_1v1' check (modo in ('tenis_1v1', 'tenis_dobles', 'padel'));

-- Las uniques originales no contemplaban el modo: un mismo par de
-- usuarios puede tener un swipe/chat independiente por cada modo.
alter table public.swipes drop constraint if exists swipes_swiper_id_target_id_key;
alter table public.swipes add constraint swipes_swiper_target_modo_key unique (swiper_id, target_id, modo);

alter table public.chats drop constraint if exists chats_usuario_a_usuario_b_key;
alter table public.chats add constraint chats_usuario_a_usuario_b_modo_key unique (usuario_a, usuario_b, modo);

-- ------------------------------------------------------------
-- TABLA: valoraciones (deportividad / puntualidad post-partido)
-- ------------------------------------------------------------
create table if not exists public.valoraciones (
  id uuid primary key default uuid_generate_v4(),
  partido_id uuid not null references public.partidos(id) on delete cascade,
  de_id uuid not null references public.profiles(id) on delete cascade,
  para_id uuid not null references public.profiles(id) on delete cascade,
  deportividad int not null check (deportividad between 1 and 5),
  puntualidad int not null check (puntualidad between 1 and 5),
  created_at timestamptz not null default now(),
  unique (partido_id, de_id)
);

alter table public.valoraciones enable row level security;

create policy "valoraciones_select_implicado"
  on public.valoraciones for select
  to authenticated
  using (auth.uid() = de_id or auth.uid() = para_id);

create policy "valoraciones_insert_propia"
  on public.valoraciones for insert
  to authenticated
  with check (auth.uid() = de_id);

-- ============================================================
-- FUNCIÓN: genera un código de referido corto al crear el perfil
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, edad, deporte, nivel, provincia, puntos, codigo_referido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Jugador/a'),
    18, 'Pádel', 'Principiante', 'Madrid', 0,
    upper(substr(replace(new.id::text, '-', ''), 1, 7))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: aplicar_codigo_referido
-- Solo se puede usar una vez (mientras referido_por sea null) y no
-- sobre el propio código. Da +50 puntos a ambos.
-- ============================================================
create or replace function public.aplicar_codigo_referido(p_codigo text)
returns void as $$
declare
  v_owner uuid;
  v_ya_referido uuid;
begin
  select referido_por into v_ya_referido from public.profiles where id = auth.uid();
  if v_ya_referido is not null then
    raise exception 'Ya has usado un código de referido';
  end if;

  select id into v_owner from public.profiles where codigo_referido = upper(trim(p_codigo));
  if v_owner is null then
    raise exception 'Código de referido no válido';
  end if;
  if v_owner = auth.uid() then
    raise exception 'No puedes usar tu propio código';
  end if;

  update public.profiles set referido_por = v_owner, puntos = puntos + 50 where id = auth.uid();
  update public.profiles set puntos = puntos + 50 where id = v_owner;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: enviar_desafio (ahora con modo)
-- ============================================================
create or replace function public.enviar_desafio(p_target_id uuid, p_modo text default 'tenis_1v1')
returns uuid as $$
declare
  v_chat_id uuid;
  v_a uuid;
  v_b uuid;
begin
  if p_target_id = auth.uid() then
    raise exception 'No puedes desafiarte a ti mismo';
  end if;

  if auth.uid() < p_target_id then
    v_a := auth.uid(); v_b := p_target_id;
  else
    v_a := p_target_id; v_b := auth.uid();
  end if;

  insert into public.chats (usuario_a, usuario_b, estado_desafio, desafio_iniciado_por, modo)
  values (v_a, v_b, 'pendiente', auth.uid(), p_modo)
  on conflict (usuario_a, usuario_b, modo) do update set archivado = false
  returning id into v_chat_id;

  insert into public.messages (chat_id, remitente_id, contenido, tipo)
  values (v_chat_id, auth.uid(), '¡Hola! Te desafío a un partido. ¿Aceptas el reto?', 'desafio');

  insert into public.swipes (swiper_id, target_id, accion, modo)
  values (auth.uid(), p_target_id, 'desafiado', p_modo)
  on conflict (swiper_id, target_id, modo) do update set accion = 'desafiado';

  update public.profiles
  set puntos = puntos + 10, desafios_enviados = desafios_enviados + 1
  where id = auth.uid();

  return v_chat_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: reportar_resultado (ahora guarda el modo del chat en el partido)
-- ============================================================
create or replace function public.reportar_resultado(p_chat_id uuid, p_perdedor_id uuid, p_resultado text)
returns uuid as $$
declare
  v_partido_id uuid;
  v_otro uuid;
  v_modo text;
begin
  select case when usuario_a = auth.uid() then usuario_b else usuario_a end, modo
  into v_otro, v_modo
  from public.chats where id = p_chat_id and (usuario_a = auth.uid() or usuario_b = auth.uid());

  if v_otro is null then
    raise exception 'No participas en este chat';
  end if;

  if p_perdedor_id <> auth.uid() and p_perdedor_id <> v_otro then
    raise exception 'El perdedor debe ser uno de los dos jugadores del chat';
  end if;

  insert into public.partidos (chat_id, reportado_por, ganador_id, perdedor_id, resultado, modo)
  values (
    p_chat_id, auth.uid(),
    case when p_perdedor_id = auth.uid() then v_otro else auth.uid() end,
    p_perdedor_id,
    p_resultado,
    coalesce(v_modo, 'tenis_1v1')
  )
  returning id into v_partido_id;

  insert into public.messages (chat_id, remitente_id, contenido, tipo, partido_id)
  values (p_chat_id, auth.uid(), '🏆 Resultado reportado: ' || p_resultado, 'partido', v_partido_id);

  return v_partido_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: valorar_partido
-- Valora deportividad y puntualidad del rival tras un partido
-- confirmado. Actualiza la media pública del rival.
-- ============================================================
create or replace function public.valorar_partido(p_partido_id uuid, p_deportividad int, p_puntualidad int)
returns void as $$
declare
  v_ganador uuid;
  v_perdedor uuid;
  v_para uuid;
begin
  select ganador_id, perdedor_id into v_ganador, v_perdedor
  from public.partidos where id = p_partido_id and estado = 'confirmado';

  if v_ganador is null then
    raise exception 'Partido no encontrado o no confirmado';
  end if;

  if auth.uid() = v_ganador then v_para := v_perdedor;
  elsif auth.uid() = v_perdedor then v_para := v_ganador;
  else raise exception 'No participas en este partido';
  end if;

  insert into public.valoraciones (partido_id, de_id, para_id, deportividad, puntualidad)
  values (p_partido_id, auth.uid(), v_para, p_deportividad, p_puntualidad)
  on conflict (partido_id, de_id) do update
    set deportividad = excluded.deportividad, puntualidad = excluded.puntualidad;

  update public.profiles p
  set deportividad_media = stats.media_dep,
      puntualidad_media = stats.media_pun,
      valoraciones_recibidas = stats.total
  from (
    select avg(deportividad)::numeric(3,2) as media_dep,
           avg(puntualidad)::numeric(3,2) as media_pun,
           count(*) as total
    from public.valoraciones where para_id = v_para
  ) stats
  where p.id = v_para;
end;
$$ language plpgsql security definer;
