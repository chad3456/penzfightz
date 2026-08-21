-- ============================================================
-- PEN FIGHT :: core schema
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- pens catalog (the 90s roster) ----------
-- Rows are generated from src/game/pens.ts by scripts/gen-pen-seed.mjs;
-- see 0002_seed_pens.sql.
create table if not exists public.pens (
  id            text primary key,
  name          text not null,
  brand         text not null,
  tier          smallint not null default 1,          -- 1 common .. 5 legendary
  blurb         text not null default '',
  -- physics profile (grams / cm here; the engine works in kg / m)
  mass          real not null default 9,
  length        real not null default 14,
  radius        real not null default 0.45,
  friction      real not null default 0.35,
  restitution   real not null default 0.25,
  balance       real not null default 0.5,            -- 0 nose heavy .. 1 tail heavy
  -- flavour, shown on the team sheet
  weight_label  text not null default 'middling',
  wood_label    text not null default 'steady',
  habit_label   text not null default 'dead touch',
  -- looks
  body_color    text not null default '#1f4fd8',
  cap_color     text not null default '#12307f',
  grip_color    text not null default '#1a1a1a',
  accent_color  text not null default '#e8e8e8',
  barrel_style  text not null default 'round',        -- round | hex | tapered | stepped
  transparent   boolean not null default false,
  unlock_points integer not null default 0,
  sort_order    smallint not null default 0
);

-- ---------- players ----------
create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  handle            text not null,
  points            integer not null default 0,
  wins              integer not null default 0,
  losses            integer not null default 0,
  matches_played    integer not null default 0,
  practice_matches  integer not null default 0,
  friend_matches    integer not null default 0,
  pens_won          integer not null default 0,
  pens_lost         integer not null default 0,
  best_streak       integer not null default 0,
  streak            integer not null default 0,
  current_pen       text not null default 'reynolds045' references public.pens(id),
  owned_pens        text[] not null default array['reynolds045','cello_gripper'],
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

create unique index if not exists players_handle_lower_idx on public.players (lower(handle));
create index if not exists players_rank_idx on public.players (points desc, wins desc, created_at asc);

-- ---------- matches ----------
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  mode          text not null check (mode in ('practice','friend','ranked')),
  format        smallint not null default 5,          -- best of N
  host_id       uuid references public.players(id) on delete set null,
  guest_id      uuid references public.players(id) on delete set null,
  host_name     text not null default 'Laddu',
  guest_name    text not null default 'Bunty',
  host_pen      text,
  guest_pen     text,
  host_score    smallint not null default 0,
  guest_score   smallint not null default 0,
  winner_id     uuid references public.players(id) on delete set null,
  winner_side   text check (winner_side in ('host','guest')),
  pen_captured  text,
  shots         integer not null default 0,
  duration_ms   integer not null default 0,
  status        text not null default 'finished' check (status in ('live','finished','abandoned')),
  created_at    timestamptz not null default now()
);

create index if not exists matches_created_idx on public.matches (created_at desc);
create index if not exists matches_host_idx on public.matches (host_id);
create index if not exists matches_guest_idx on public.matches (guest_id);

-- ---------- per-shot log (replays / analytics) ----------
create table if not exists public.match_shots (
  id         bigserial primary key,
  match_id   uuid not null references public.matches(id) on delete cascade,
  turn       smallint not null,
  side       text not null check (side in ('host','guest')),
  power      real not null,
  angle      real not null,
  outcome    text not null default 'none' check (outcome in ('none','hit','knockout','self_out')),
  created_at timestamptz not null default now()
);

create index if not exists match_shots_match_idx on public.match_shots (match_id);

-- ---------- friend rooms (shareable links) ----------
create table if not exists public.rooms (
  code        text primary key,
  host_id     uuid references public.players(id) on delete cascade,
  host_name   text not null default 'Laddu',
  host_pen    text not null default 'reynolds045',
  guest_id    uuid references public.players(id) on delete set null,
  guest_name  text,
  guest_pen   text,
  format      smallint not null default 5,
  status      text not null default 'waiting' check (status in ('waiting','playing','finished','expired')),
  challenge   boolean not null default false,        -- created by a rank+1 challenge
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '3 hours')
);

create index if not exists rooms_status_idx on public.rooms (status, created_at desc);

-- ---------- platform counters (single row) ----------
create table if not exists public.platform_stats (
  id                integer primary key default 1 check (id = 1),
  total_matches     bigint not null default 0,
  practice_matches  bigint not null default 0,
  friend_matches    bigint not null default 0,
  ranked_matches    bigint not null default 0,
  unique_users      bigint not null default 0,
  total_shots       bigint not null default 0,
  pens_captured     bigint not null default 0,
  pens_knocked_off  bigint not null default 0,
  updated_at        timestamptz not null default now()
);

insert into public.platform_stats (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- RLS : reads are public, every write goes through a SECURITY
-- DEFINER rpc (see 0003) so a browser console can never award
-- itself a Trimax and forty thousand points.
-- ============================================================
alter table public.pens            enable row level security;
alter table public.players         enable row level security;
alter table public.matches         enable row level security;
alter table public.match_shots     enable row level security;
alter table public.rooms           enable row level security;
alter table public.platform_stats  enable row level security;

drop policy if exists pens_read on public.pens;
create policy pens_read on public.pens for select using (true);

drop policy if exists players_read on public.players;
create policy players_read on public.players for select using (true);

drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select using (true);

drop policy if exists shots_read on public.match_shots;
create policy shots_read on public.match_shots for select using (true);

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select using (true);

drop policy if exists stats_read on public.platform_stats;
create policy stats_read on public.platform_stats for select using (true);
