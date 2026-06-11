-- DietaIA · Esquema completo para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PERFILES
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  edad int not null default 20 check (edad between 14 and 100),
  peso_inicial numeric(5, 2) not null default 64.00,
  altura numeric(5, 2) not null default 168.00,
  kcal_objetivo int not null default 1900,
  macros jsonb not null default '{"proteinas_g": 140, "carbohidratos_g": 200, "grasas_g": 60}'::jsonb,
  restricciones text[] not null default array[
    'sin_avena_ni_texturas_similares',
    'pure_calabacin_verdura_base_comidas_principales',
    'sin_proteina_en_polvo_solo_comida_real'
  ],
  pasos_min int not null default 8000,
  pasos_max int not null default 10000,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- LOGS DIARIOS
-- ---------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  fecha date not null default current_date,
  desayuno_ok boolean not null default false,
  m_manana_ok boolean not null default false,
  comida_ok boolean not null default false,
  cena_ok boolean not null default false,
  pesas_ok boolean not null default false,
  cardio_ok boolean not null default false,
  desayuno_opcion smallint check (desayuno_opcion in (1, 2)),
  m_manana_opcion smallint check (m_manana_opcion in (1, 2)),
  comida_opcion smallint check (comida_opcion in (1, 2)),
  cena_opcion smallint check (cena_opcion in (1, 2)),
  pasos int not null default 0 check (pasos >= 0),
  peso_ayunas numeric(5, 2) check (peso_ayunas between 30 and 200),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_logs_user_fecha_unique unique (user_id, fecha)
);

create index idx_daily_logs_user_fecha on public.daily_logs (user_id, fecha desc);
create index idx_daily_logs_fecha on public.daily_logs (fecha);

-- ---------------------------------------------------------------------------
-- OPCIONES DE DIETA REESCRITAS POR LA IA (/api/chat)
-- ---------------------------------------------------------------------------
create table public.diet_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dia text not null check (dia in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  comida text not null check (comida in ('desayuno','m_manana','comida','cena')),
  opcion smallint not null check (opcion in (1, 2)),
  contenido jsonb not null,
  updated_at timestamptz not null default now(),
  constraint diet_overrides_slot_unique unique (user_id, dia, comida, opcion)
);

create index idx_diet_overrides_user on public.diet_overrides (user_id);

-- ---------------------------------------------------------------------------
-- ALIMENTOS DETECTADOS POR VISIÓN (/api/vision)
-- ---------------------------------------------------------------------------
create table public.ai_meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  fecha date not null default current_date,
  name text not null,
  estimated_weight_g int not null,
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  confidence text not null,
  created_at timestamptz not null default now()
);

create index idx_ai_meal_logs_user_fecha on public.ai_meal_logs (user_id, fecha desc);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_daily_logs_updated_at
before update on public.daily_logs
for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.diet_overrides enable row level security;
alter table public.ai_meal_logs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "daily_logs_select_own" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on public.daily_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete_own" on public.daily_logs
  for delete using (auth.uid() = user_id);

create policy "diet_overrides_select_own" on public.diet_overrides
  for select using (auth.uid() = user_id);
create policy "diet_overrides_insert_own" on public.diet_overrides
  for insert with check (auth.uid() = user_id);
create policy "diet_overrides_update_own" on public.diet_overrides
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diet_overrides_delete_own" on public.diet_overrides
  for delete using (auth.uid() = user_id);

create policy "ai_meal_logs_select_own" on public.ai_meal_logs
  for select using (auth.uid() = user_id);
create policy "ai_meal_logs_insert_own" on public.ai_meal_logs
  for insert with check (auth.uid() = user_id);
create policy "ai_meal_logs_delete_own" on public.ai_meal_logs
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RESUMEN SEMANAL: media de peso, suma de pasos y % adherencia a la dieta
-- ---------------------------------------------------------------------------
create or replace function public.resumen_semanal(p_inicio date)
returns table (
  semana_inicio date,
  semana_fin date,
  peso_medio numeric,
  pasos_totales bigint,
  adherencia_dieta_pct numeric,
  dias_pesas int,
  dias_cardio int
)
language plpgsql
security invoker
as $$
begin
  return query
  select
    p_inicio,
    p_inicio + 6,
    round(avg(dl.peso_ayunas) filter (where dl.peso_ayunas is not null), 2),
    coalesce(sum(dl.pasos), 0)::bigint,
    round(
      100.0 * sum(
        (dl.desayuno_ok)::int + (dl.m_manana_ok)::int +
        (dl.comida_ok)::int + (dl.cena_ok)::int
      ) / nullif(count(*) * 4, 0),
      1
    ),
    count(*) filter (where dl.pesas_ok)::int,
    count(*) filter (where dl.cardio_ok)::int
  from public.daily_logs dl
  where dl.user_id = auth.uid()
    and dl.fecha between p_inicio and p_inicio + 6;
end;
$$;

grant execute on function public.resumen_semanal(date) to authenticated;
