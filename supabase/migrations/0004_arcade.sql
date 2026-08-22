-- ============================================================
-- PEN FIGHT :: becoming an arcade
--
-- One game became four, and three of the new ones seat more than two people.
-- Rather than bolt a second schema alongside the first, `rooms` and `matches`
-- both learn which game they belong to, results learn to describe N players
-- instead of exactly two, and ranking becomes per-game.
--
-- Everything already recorded is Pen Fight, which is why `game` defaults to it.
-- ============================================================

alter table public.rooms    add column if not exists game      text not null default 'penfight';
alter table public.rooms    add column if not exists max_seats smallint not null default 2;
alter table public.rooms    add column if not exists seats     jsonb not null default '[]'::jsonb;

alter table public.matches  add column if not exists game         text not null default 'penfight';
alter table public.matches  add column if not exists participants jsonb;
alter table public.matches  add column if not exists rounds       smallint;

-- host_id/guest_id only make sense for a two-player game; N-player results
-- live in `participants` and leave them null.
alter table public.matches  alter column mode drop not null;

create index if not exists rooms_game_idx   on public.rooms (game, status);
create index if not exists matches_game_idx on public.matches (game, created_at desc);

-- ---------- per-game standing ----------
create table if not exists public.player_games (
  player_id      uuid not null references public.players(id) on delete cascade,
  game           text not null,
  points         integer not null default 0,
  wins           integer not null default 0,
  losses         integer not null default 0,
  played         integer not null default 0,
  streak         integer not null default 0,
  best_streak    integer not null default 0,
  last_played_at timestamptz not null default now(),
  primary key (player_id, game)
);

create index if not exists player_games_rank_idx
  on public.player_games (game, points desc, wins desc);

alter table public.player_games enable row level security;
drop policy if exists player_games_read on public.player_games;
create policy player_games_read on public.player_games for select using (true);

-- ---------- rooms, now game-aware ----------
create or replace function public.create_room(
  p_host_id   uuid,
  p_host_name text,
  p_host_pen  text,
  p_format    integer default 5,
  p_challenge boolean default false,
  p_game      text default 'penfight',
  p_max_seats integer default 2
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
begin
  update public.rooms
     set status = 'expired'
   where host_id = p_host_id and status = 'waiting' and game = coalesce(p_game, 'penfight');

  insert into public.rooms (code, host_id, host_name, host_pen, format, challenge, game, max_seats)
  values (
    public.pf_room_code(),
    p_host_id,
    coalesce(nullif(btrim(p_host_name), ''), 'Laddu'),
    coalesce(p_host_pen, 'reynolds045'),
    coalesce(p_format, 5),
    coalesce(p_challenge, false),
    coalesce(p_game, 'penfight'),
    greatest(2, least(coalesce(p_max_seats, 2), 12))
  )
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.join_room(
  p_code       text,
  p_guest_id   uuid,
  p_guest_name text,
  p_guest_pen  text,
  p_game       text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_seats jsonb;
begin
  select * into v_room from public.rooms
   where code = upper(btrim(p_code)) for update;

  if not found then
    raise exception 'no such room' using errcode = 'P0002';
  end if;
  if v_room.expires_at < now() then
    update public.rooms set status = 'expired' where code = v_room.code;
    raise exception 'room expired' using errcode = 'P0003';
  end if;
  if p_game is not null and v_room.game <> p_game then
    raise exception 'wrong game' using errcode = 'P0005';
  end if;

  -- Two-player games keep the original host/guest shape; anything wider keeps
  -- a seat list so a fifth person is turned away rather than silently dropped.
  if v_room.max_seats <= 2 then
    if v_room.host_id = p_guest_id then
      return v_room;
    end if;
    if v_room.guest_id is not null and v_room.guest_id <> p_guest_id then
      raise exception 'room full' using errcode = 'P0004';
    end if;
    update public.rooms
       set guest_id   = p_guest_id,
           guest_name = coalesce(nullif(btrim(p_guest_name), ''), 'Bunty'),
           guest_pen  = coalesce(p_guest_pen, 'reynolds045'),
           status     = 'playing'
     where code = v_room.code
     returning * into v_room;
    return v_room;
  end if;

  v_seats := v_room.seats;
  if not (v_seats @> jsonb_build_array(jsonb_build_object('id', p_guest_id::text))) then
    if jsonb_array_length(v_seats) >= v_room.max_seats - 1 then
      raise exception 'room full' using errcode = 'P0004';
    end if;
    v_seats := v_seats || jsonb_build_array(
      jsonb_build_object('id', p_guest_id::text,
                         'name', coalesce(nullif(btrim(p_guest_name), ''), 'Player'))
    );
  end if;

  update public.rooms
     set seats  = v_seats,
         status = 'playing'
   where code = v_room.code
   returning * into v_room;

  return v_room;
end;
$$;

-- ---------- N-player results ----------
/**
 * Book any game with any number of seats.
 *
 * `p_participants` is an ordered array of
 *   { id: uuid|null, name: text, score: number, place: int }
 * with bots carrying a null id so they take up a place without earning points.
 * Points fall off by finishing position, and practice is worth a fraction of a
 * real game against people.
 */
create or replace function public.record_game(
  p_game         text,
  p_mode         text,
  p_rounds       integer,
  p_participants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id uuid;
  v_n        integer := jsonb_array_length(coalesce(p_participants, '[]'::jsonb));
  v_row      jsonb;
  v_id       uuid;
  v_place    integer;
  v_award    integer;
  v_base     integer;
  v_humans   integer := 0;
begin
  if v_n = 0 then
    raise exception 'no participants';
  end if;
  if p_mode not in ('practice', 'friend', 'ranked') then
    raise exception 'unknown mode %', p_mode;
  end if;

  v_base := case when p_mode = 'practice' then 3 else 12 end;

  insert into public.matches (game, mode, format, rounds, participants, status, winner_side)
  values (p_game, p_mode, coalesce(p_rounds, 1), p_rounds, p_participants, 'finished', null)
  returning id into v_match_id;

  for v_row in select * from jsonb_array_elements(p_participants) loop
    v_id := nullif(v_row->>'id', '')::uuid;
    if v_id is null then
      continue;  -- a computer player: it plays, it does not collect
    end if;
    v_humans := v_humans + 1;
    v_place := coalesce((v_row->>'place')::int, v_n);

    -- Last place scores nothing; every step up the table is worth `v_base`.
    v_award := greatest(0, (v_n - v_place) * v_base);

    insert into public.player_games (player_id, game, points, wins, losses, played, streak, best_streak)
    values (v_id, p_game, v_award,
            case when v_place = 1 then 1 else 0 end,
            case when v_place = 1 then 0 else 1 end,
            1,
            case when v_place = 1 then 1 else 0 end,
            case when v_place = 1 then 1 else 0 end)
    on conflict (player_id, game) do update set
      points         = public.player_games.points + v_award,
      wins           = public.player_games.wins   + case when v_place = 1 then 1 else 0 end,
      losses         = public.player_games.losses + case when v_place = 1 then 0 else 1 end,
      played         = public.player_games.played + 1,
      streak         = case when v_place = 1 then public.player_games.streak + 1 else 0 end,
      best_streak    = greatest(public.player_games.best_streak,
                                case when v_place = 1 then public.player_games.streak + 1 else 0 end),
      last_played_at = now();

    update public.players
       set points         = greatest(0, points + v_award),
           wins           = wins   + case when v_place = 1 then 1 else 0 end,
           losses         = losses + case when v_place = 1 then 0 else 1 end,
           matches_played = matches_played + 1,
           practice_matches = practice_matches + case when p_mode = 'practice' then 1 else 0 end,
           friend_matches   = friend_matches   + case when p_mode <> 'practice' then 1 else 0 end,
           last_seen_at   = now()
     where id = v_id;
  end loop;

  update public.platform_stats
     set total_matches    = total_matches + 1,
         practice_matches = practice_matches + case when p_mode = 'practice' then 1 else 0 end,
         friend_matches   = friend_matches   + case when p_mode = 'friend'   then 1 else 0 end,
         ranked_matches   = ranked_matches   + case when p_mode = 'ranked'   then 1 else 0 end,
         updated_at       = now()
   where id = 1;

  return jsonb_build_object('match_id', v_match_id, 'players', v_humans);
end;
$$;

-- Pen Fight keeps its own richer bookkeeping, but should also appear on the
-- per-game board, so mirror its result into player_games.
create or replace function public.pf_mirror_match() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_win uuid := new.winner_id;
  v_lose uuid := case when new.winner_side = 'host' then new.guest_id else new.host_id end;
begin
  if new.game <> 'penfight' or new.winner_side is null then
    return new;
  end if;

  if v_win is not null then
    insert into public.player_games (player_id, game, points, wins, played, streak, best_streak)
    values (v_win, 'penfight', public.pf_points_for(new.mode, true), 1, 1, 1, 1)
    on conflict (player_id, game) do update set
      points = public.player_games.points + public.pf_points_for(new.mode, true),
      wins   = public.player_games.wins + 1,
      played = public.player_games.played + 1,
      streak = public.player_games.streak + 1,
      best_streak = greatest(public.player_games.best_streak, public.player_games.streak + 1),
      last_played_at = now();
  end if;

  if v_lose is not null then
    insert into public.player_games (player_id, game, points, losses, played)
    values (v_lose, 'penfight', greatest(0, public.pf_points_for(new.mode, false)), 1, 1)
    on conflict (player_id, game) do update set
      points = greatest(0, public.player_games.points + public.pf_points_for(new.mode, false)),
      losses = public.player_games.losses + 1,
      played = public.player_games.played + 1,
      streak = 0,
      last_played_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists pf_mirror_match_tr on public.matches;
create trigger pf_mirror_match_tr after insert on public.matches
  for each row execute function public.pf_mirror_match();

-- ---------- per-game ranking ----------
create or replace view public.game_leaderboard as
select
  pg.game,
  rank() over (partition by pg.game order by pg.points desc, pg.wins desc, p.created_at asc) as rank,
  p.id, p.handle, pg.points, pg.wins, pg.losses, pg.played, pg.best_streak, p.current_pen
from public.player_games pg
join public.players p on p.id = pg.player_id
where pg.played > 0;

create or replace function public.top_players_for(p_game text, p_limit integer default 10)
returns table (rank bigint, id uuid, handle text, points integer, wins integer,
               losses integer, played integer, best_streak integer, current_pen text)
language sql stable security definer set search_path = '' as $$
  select l.rank, l.id, l.handle, l.points, l.wins, l.losses, l.played, l.best_streak, l.current_pen
    from public.game_leaderboard l
   where l.game = p_game
   order by l.rank
   limit least(greatest(coalesce(p_limit, 10), 1), 100);
$$;

grant execute on function public.create_room(uuid, text, text, integer, boolean, text, integer) to anon, authenticated;
grant execute on function public.join_room(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.record_game(text, text, integer, jsonb) to anon, authenticated;
grant execute on function public.top_players_for(text, integer) to anon, authenticated;
grant select on public.game_leaderboard to anon, authenticated;
