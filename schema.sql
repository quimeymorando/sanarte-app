
-- 1. Aseguramos que la extensión de UUID esté habilitada
create extension if not exists "uuid-ossp";

-- 2. TABLA PROFILES
-- Esta tabla extiende la información del usuario de Supabase (auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  join_date timestamptz default now(),
  is_premium boolean default false,
  xp integer default 0,
  level integer default 1,
  role text default 'user',
  badges text[] default '{}',
  daily_message_count integer default 0,
  last_message_date text, 
  updated_at timestamptz default now()
);

-- 3. TABLA ROUTINES (Rutinas del usuario)
create table routines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  time text not null,
  completed boolean default false,
  category text not null check (category in ('meditation', 'infusion', 'movement', 'spiritual', 'general')),
  source text,
  created_at timestamptz default now()
);

-- 4. TABLA SYMPTOM_LOGS (Diario de síntomas)
create table symptom_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date text not null,
  intensity integer check (intensity >= 1 and intensity <= 10),
  duration text,
  notes text,
  created_at timestamptz default now()
);

-- 5. TABLA INTENTIONS (Comunidad - Posts)
create table intentions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete set null,
  author_name text,
  text text not null,
  candles integer default 0,
  loves integer default 0,
  theme text check (theme in ('healing', 'gratitude', 'release', 'feedback')),
  created_at timestamptz default now()
);

-- 6. TABLA COMMENTS (Comentarios en intenciones)
create table comments (
  id uuid default uuid_generate_v4() primary key,
  intention_id uuid references intentions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  author_name text,
  text text not null,
  created_at timestamptz default now()
);

-- 7. TABLA FAVORITES (Síntomas guardados)
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symptom_name text not null,
  description text,
  created_at timestamptz default now(),
  unique(user_id, symptom_name)
);

-- --- SEGURIDAD (Row Level Security) ---
alter table profiles enable row level security;
alter table routines enable row level security;
alter table symptom_logs enable row level security;
alter table intentions enable row level security;
alter table comments enable row level security;
alter table favorites enable row level security;

-- POLÍTICAS DE ACCESO

-- Profiles: Cada quien ve y edita lo suyo
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Routines: Privado
create policy "Users can CRUD own routines" on routines for all using (auth.uid() = user_id);

-- Symptom Logs: Privado
create policy "Users can CRUD own symptoms" on symptom_logs for all using (auth.uid() = user_id);

-- Favorites: Privado
create policy "Users can CRUD own favorites" on favorites for all using (auth.uid() = user_id);

-- Intentions (Comunidad):
-- Todos los autenticados pueden leer todas las intenciones
create policy "Anyone can read intentions" on intentions for select to authenticated using (true);
-- Solo puedes crear intenciones a tu nombre
create policy "Users can create intentions" on intentions for insert to authenticated with check (auth.uid() = user_id);
-- Solo puedes editar/borrar tus propias intenciones
create policy "Users can update own intentions" on intentions for update using (auth.uid() = user_id);
create policy "Users can delete own intentions" on intentions for delete using (auth.uid() = user_id);

-- Comments:
create policy "Anyone can read comments" on comments for select to authenticated using (true);
create policy "Users can create comments" on comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- --- TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE ---
-- Esta función se ejecuta cada vez que un usuario se registra en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, join_date, is_premium, xp, level, badges, daily_message_count, last_message_date)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name', -- Toma el nombre de los metadatos
    now(),
    false,
    0,
    1,
    'user',
    '{}',
    0,
    to_char(now(), 'Dy Mon DD YYYY')
  );
  return new;
end;
$$ language plpgsql security definer;

-- El trigger en sí
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
