-- ============================================================
-- CHAT DEL PLAYA — esquema Supabase
-- Correr UNA SOLA VEZ en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Mensajes
create table if not exists chat_messages (
  id           uuid primary key default gen_random_uuid(),
  client_id    text not null,
  nombre       text not null check (char_length(nombre) between 1 and 40),
  tipo         text not null check (tipo in ('texto', 'audio')),
  contenido    text check (tipo != 'texto' or char_length(contenido) between 1 and 500),
  audio_url    text check (tipo != 'audio' or audio_url is not null),
  audio_seg    integer check (audio_seg is null or audio_seg <= 30),
  created_at   timestamptz not null default now(),
  deleted      boolean not null default false
);

create index if not exists chat_messages_created_at_idx on chat_messages (created_at desc);

-- Reacciones
create table if not exists chat_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references chat_messages(id) on delete cascade,
  client_id   text not null,
  emoji       text not null check (emoji in ('corazon', 'pulgar', 'aplauso', 'pelota', 'trapo')),
  created_at  timestamptz not null default now(),
  unique (message_id, client_id, emoji)
);

create index if not exists chat_reactions_message_idx on chat_reactions (message_id);

-- ============================================================
-- RLS: sitio público sin login — lectura abierta, escritura
-- controlada por funciones (no updates/deletes directos)
-- ============================================================
alter table chat_messages enable row level security;
alter table chat_reactions enable row level security;

create policy "leer mensajes" on chat_messages for select using (true);
create policy "insertar mensajes" on chat_messages for insert with check (true);
-- Sin policy de UPDATE/DELETE directo: el borrado pasa por la función soft_delete_message.

create policy "leer reacciones" on chat_reactions for select using (true);
-- Sin policy de INSERT/DELETE directo: pasa por la función toggle_reaction.

-- ============================================================
-- Borrado (soft delete) — solo el mismo client_id que lo creó
-- ============================================================
create or replace function soft_delete_message(p_message_id uuid, p_client_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update chat_messages
    set deleted = true
    where id = p_message_id
      and client_id = p_client_id
      and deleted = false;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function soft_delete_message(uuid, text) to anon, authenticated;

-- ============================================================
-- Reacciones — togglear (marcar/sacar) de forma atómica
-- ============================================================
create or replace function toggle_reaction(p_message_id uuid, p_client_id text, p_emoji text)
returns boolean -- true = quedó puesta, false = se sacó
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from chat_reactions
    where message_id = p_message_id and client_id = p_client_id and emoji = p_emoji;
  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    return false;
  end if;

  insert into chat_reactions (message_id, client_id, emoji)
    values (p_message_id, p_client_id, p_emoji);
  return true;
end;
$$;

grant execute on function toggle_reaction(uuid, text, text) to anon, authenticated;

-- ============================================================
-- Realtime: publicar cambios de estas tablas
-- ============================================================
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table chat_reactions;

-- ============================================================
-- Storage: bucket público para audios (máx 2MB, ~30seg comprimido)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-audio', 'chat-audio', true, 2097152, array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'])
on conflict (id) do nothing;

create policy "subir audio" on storage.objects for insert
  with check (bucket_id = 'chat-audio');
