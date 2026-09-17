-- Схема Office Poker Club для будущего подключения Supabase.
-- Приложение сейчас использует mock-режим с той же моделью данных.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  player_id uuid,
  email text unique not null,
  name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'member', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id),
  name text not null,
  avatar_url text,
  department text not null,
  job_title text not null,
  role text not null,
  rating integer not null default 1000,
  games_played integer not null default 0,
  wins integer not null default 0,
  joined_at date not null default current_date
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  description text
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time text not null,
  duration integer not null,
  venue_id uuid references public.venues (id),
  venue_name text not null,
  address text not null,
  organizer_id uuid not null,
  participant_limit integer not null,
  buy_in integer not null,
  currency text not null default '₽',
  status text not null check (status in ('open', 'full', 'completed', 'cancelled')),
  notes text,
  allow_late_join boolean not null default false,
  notify_participants boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_participants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id),
  joined_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id),
  place integer not null,
  payout integer not null default 0,
  rating_delta integer not null default 0,
  is_winner boolean not null default false
);

create table if not exists public.rating_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id),
  game_id uuid references public.games (id),
  rating integer not null,
  delta integer not null,
  recorded_at timestamptz not null default now()
);
