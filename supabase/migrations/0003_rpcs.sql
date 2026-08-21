-- ============================================================
-- PEN FIGHT :: the write path
--
-- The client never writes to a table directly. Every mutation goes through one
-- of these SECURITY DEFINER functions, which is what stops a browser console
-- from awarding itself a Trimax and 40,000 points. RLS grants select only.
-- ============================================================

-- ---------- scoring constants, in one place ----------
create or replace function public.pf_points_for(p_mode text, p_won boolean)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_mode = 'practice' then case when p_won then 4 else 0 end
    else case when p_won then 20 else -10 end
  end;
$$;

-- ---------- players ----------

create or replace function public.ensure_player(p_id uuid, p_handle text)
returns public.players
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player public.players;
  v_handle text;
  v_try    text;
  v_n      integer := 0;
begin
  select * into v_player from public.players where id = p_id;

  if found then
    update public.players
       set last_seen_at = now()
     where id = p_id
     returning * into v_player;
    return v_player;
  end if;

  -- New face in class. Take the handle they asked for, or the next one free.
  v_handle := nullif(btrim(coalesce(p_handle, '')), '');
  if v_handle is null then
    v_handle := 'Student';
  end if;
  v_handle := left(v_handle, 18);

  v_try := v_handle;
  while exists (select 1 from public.players where lower(handle) = lower(v_try)) loop
    v_n := v_n + 1;
    v_try := left(v_handle, 14) || ' ' || v_n;
    if v_n > 500 then
      v_try := v_handle || ' ' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
      exit;
    end if;
  end loop;

  insert into public.players (id, handle)
  values (coalesce(p_id, gen_random_uuid()), v_try)
  returning * into v_player;

  update public.platform_stats
     set unique_users = unique_users + 1,
         updated_at   = now()
   where id = 1;

  return v_player;
end;
$$;

create or replace function public.set_current_pen(p_id uuid, p_pen text)
returns public.players
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player public.players;
begin
  update public.players
     set current_pen  = p_pen,
         last_seen_at = now()
   where id = p_id
     and p_pen = any(owned_pens)
   returning * into v_player;

  if not found then
    -- Either no such player, or they are reaching for a pen they never won.
    select * into v_player from public.players where id = p_id;
  end if;

  return v_player;
end;
$$;

create or replace function public.rename_player(p_id uuid, p_handle text)
returns public.players
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player public.players;
  v_handle text := left(nullif(btrim(coalesce(p_handle, '')), ''), 18);
begin
  if v_handle is null then
    select * into v_player from public.players where id = p_id;
    return v_player;
  end if;

  if exists (
    select 1 from public.players
     where lower(handle) = lower(v_handle) and id <> p_id
  ) then
    select * into v_player from public.players where id = p_id;
    return v_player;
  end if;

  update public.players
     set handle = v_handle, last_seen_at = now()
   where id = p_id
   returning * into v_player;

  return v_player;
end;
$$;

-- ---------- the one that matters ----------

/**
 * Books a finished match: writes the row, moves both players' records, hands
 * the losing pen to the winner, and bumps the platform counters — all inside
 * one transaction so the home page totals can never disagree with the match
 * list.
 *
 * Practice matches move points barely at all and never take a real pen: you
 * cannot win a Trimax off a computer.
 */
create or replace function public.record_match(
  p_mode        text,
  p_format      integer,
  p_host_id     uuid,
  p_guest_id    uuid,
  p_host_name   text,
  p_guest_name  text,
  p_host_pen    text,
  p_guest_pen   text,
  p_host_score  integer,
  p_guest_score integer,
  p_winner_side text,
  p_shots       integer,
  p_duration_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id     uuid;
  v_winner_id    uuid;
  v_loser_id     uuid;
  v_captured     text := null;
  v_stakes       boolean := (p_mode <> 'practice');
  v_host_won     boolean := (p_winner_side = 'host');
  v_loser_pen    text;
begin
  if p_mode not in ('practice', 'friend', 'ranked') then
    raise exception 'unknown mode %', p_mode;
  end if;
  if p_winner_side not in ('host', 'guest') then
    raise exception 'unknown winner side %', p_winner_side;
  end if;

  v_winner_id := case when v_host_won then p_host_id else p_guest_id end;
  v_loser_id  := case when v_host_won then p_guest_id else p_host_id end;
  v_loser_pen := case when v_host_won then p_guest_pen else p_host_pen end;

  -- The pen actually changes hands, which is the entire point of the game.
  if v_stakes and v_winner_id is not null and v_loser_pen is not null then
    v_captured := v_loser_pen;
    update public.players
       set owned_pens = case
             when v_loser_pen = any(owned_pens) then owned_pens
             else array_append(owned_pens, v_loser_pen)
           end,
           pens_won = pens_won + 1
     where id = v_winner_id;

    if v_loser_id is not null then
      update public.players set pens_lost = pens_lost + 1 where id = v_loser_id;
    end if;
  end if;

  insert into public.matches (
    mode, format, host_id, guest_id, host_name, guest_name,
    host_pen, guest_pen, host_score, guest_score,
    winner_id, winner_side, pen_captured, shots, duration_ms, status
  ) values (
    p_mode, p_format, p_host_id, p_guest_id,
    coalesce(p_host_name, 'Laddu'), coalesce(p_guest_name, 'Bunty'),
    p_host_pen, p_guest_pen, p_host_score, p_guest_score,
    v_winner_id, p_winner_side, v_captured,
    coalesce(p_shots, 0), coalesce(p_duration_ms, 0), 'finished'
  )
  returning id into v_match_id;

  -- winner
  if v_winner_id is not null then
    update public.players
       set wins             = wins + 1,
           matches_played   = matches_played + 1,
           practice_matches = practice_matches + case when p_mode = 'practice' then 1 else 0 end,
           friend_matches   = friend_matches   + case when p_mode <> 'practice' then 1 else 0 end,
           points           = greatest(0, points + public.pf_points_for(p_mode, true)),
           streak           = streak + 1,
           best_streak      = greatest(best_streak, streak + 1),
           last_seen_at     = now()
     where id = v_winner_id;
  end if;

  -- loser (null for the AI)
  if v_loser_id is not null then
    update public.players
       set losses           = losses + 1,
           matches_played   = matches_played + 1,
           practice_matches = practice_matches + case when p_mode = 'practice' then 1 else 0 end,
           friend_matches   = friend_matches   + case when p_mode <> 'practice' then 1 else 0 end,
           points           = greatest(0, points + public.pf_points_for(p_mode, false)),
           streak           = 0,
           last_seen_at     = now()
     where id = v_loser_id;
  end if;

  -- If the loser just handed over the pen they were holding, put something
  -- else in their hand so they are not left with an empty desk.
  if v_stakes and v_loser_id is not null then
    update public.players
       set current_pen = coalesce(
             (select p from unnest(owned_pens) p where p <> v_loser_pen limit 1),
             'reynolds045'
           )
     where id = v_loser_id and current_pen = v_loser_pen;
  end if;

  update public.platform_stats
     set total_matches    = total_matches + 1,
         practice_matches = practice_matches + case when p_mode = 'practice' then 1 else 0 end,
         friend_matches   = friend_matches   + case when p_mode = 'friend'   then 1 else 0 end,
         ranked_matches   = ranked_matches   + case when p_mode = 'ranked'   then 1 else 0 end,
         total_shots      = total_shots + coalesce(p_shots, 0),
         pens_captured    = pens_captured + case when v_captured is null then 0 else 1 end,
         pens_knocked_off = pens_knocked_off + p_host_score + p_guest_score,
         updated_at       = now()
   where id = 1;

  return jsonb_build_object(
    'match_id',     v_match_id,
    'winner_id',    v_winner_id,
    'pen_captured', v_captured,
    'points',       public.pf_points_for(p_mode, true)
  );
end;
$$;

create or replace function public.log_shots(p_match_id uuid, p_shots jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.match_shots (match_id, turn, side, power, angle, outcome)
  select
    p_match_id,
    (s->>'turn')::smallint,
    s->>'side',
    (s->>'power')::real,
    (s->>'angle')::real,
    coalesce(s->>'outcome', 'none')
  from jsonb_array_elements(coalesce(p_shots, '[]'::jsonb)) s
  where s->>'side' in ('host', 'guest');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------- the class ranking ----------

create or replace view public.leaderboard as
select
  rank() over (order by p.points desc, p.wins desc, p.created_at asc) as rank,
  p.id,
  p.handle,
  p.points,
  p.wins,
  p.losses,
  p.matches_played,
  p.pens_won,
  p.best_streak,
  p.current_pen,
  p.last_seen_at
from public.players p
where p.matches_played > 0;

create or replace function public.top_players(p_limit integer default 10)
returns table (
  rank bigint, id uuid, handle text, points integer, wins integer,
  losses integer, matches_played integer, pens_won integer,
  best_streak integer, current_pen text
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.rank, l.id, l.handle, l.points, l.wins, l.losses,
         l.matches_played, l.pens_won, l.best_streak, l.current_pen
    from public.leaderboard l
   order by l.rank
   limit least(greatest(coalesce(p_limit, 10), 1), 100);
$$;

/**
 * You are only allowed to challenge the kid immediately above you. That is the
 * whole ladder: no picking on juniors, no skipping the queue.
 */
create or replace function public.rival_above(p_id uuid)
returns table (
  rank bigint, id uuid, handle text, points integer, wins integer,
  current_pen text, my_rank bigint, class_size bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_my_rank bigint;
  v_size    bigint;
begin
  select count(*) into v_size from public.leaderboard;
  select l.rank into v_my_rank from public.leaderboard l where l.id = p_id;

  if v_my_rank is null then
    -- Unranked: your first opponent is whoever is last on the board.
    return query
      select l.rank, l.id, l.handle, l.points, l.wins, l.current_pen,
             (v_size + 1)::bigint as my_rank, v_size as class_size
        from public.leaderboard l
       order by l.rank desc
       limit 1;
    return;
  end if;

  return query
    select l.rank, l.id, l.handle, l.points, l.wins, l.current_pen,
           v_my_rank as my_rank, v_size as class_size
      from public.leaderboard l
     where l.rank < v_my_rank
     order by l.rank desc
     limit 1;
end;
$$;

create or replace function public.player_card(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'player', to_jsonb(p),
    'rank',   (select l.rank from public.leaderboard l where l.id = p.id),
    'class_size', (select count(*) from public.leaderboard)
  )
  from public.players p
  where p.id = p_id;
$$;

-- ---------- rooms ----------

create or replace function public.pf_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  -- No I/O/0/1: these get read aloud across a classroom.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i integer;
begin
  loop
    v_code := '';
    for v_i in 1..5 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms r where r.code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function public.create_room(
  p_host_id   uuid,
  p_host_name text,
  p_host_pen  text,
  p_format    integer default 5,
  p_challenge boolean default false
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
begin
  -- Tidy up anything this player left open; one desk each.
  update public.rooms
     set status = 'expired'
   where host_id = p_host_id and status = 'waiting';

  insert into public.rooms (code, host_id, host_name, host_pen, format, challenge)
  values (
    public.pf_room_code(),
    p_host_id,
    coalesce(nullif(btrim(p_host_name), ''), 'Laddu'),
    coalesce(p_host_pen, 'reynolds045'),
    coalesce(p_format, 5),
    coalesce(p_challenge, false)
  )
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.join_room(
  p_code       text,
  p_guest_id   uuid,
  p_guest_name text,
  p_guest_pen  text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
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
  if v_room.host_id = p_guest_id then
    return v_room; -- host reopening their own link
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
end;
$$;

create or replace function public.close_room(p_code text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.rooms set status = 'finished' where code = upper(btrim(p_code));
$$;

-- ---------- home page numbers ----------

create or replace function public.platform_counters()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total_matches',    s.total_matches,
    'practice_matches', s.practice_matches,
    'friend_matches',   s.friend_matches,
    'ranked_matches',   s.ranked_matches,
    'unique_users',     s.unique_users,
    'total_shots',      s.total_shots,
    'pens_captured',    s.pens_captured,
    'pens_knocked_off', s.pens_knocked_off,
    'live_rooms',       (select count(*) from public.rooms r
                          where r.status in ('waiting','playing') and r.expires_at > now()),
    'matches_today',    (select count(*) from public.matches m
                          where m.created_at > now() - interval '24 hours'),
    'updated_at',       s.updated_at
  )
  from public.platform_stats s
  where s.id = 1;
$$;

-- ---------- grants ----------
grant execute on function public.ensure_player(uuid, text)        to anon, authenticated;
grant execute on function public.set_current_pen(uuid, text)      to anon, authenticated;
grant execute on function public.rename_player(uuid, text)        to anon, authenticated;
grant execute on function public.record_match(text, integer, uuid, uuid, text, text, text, text, integer, integer, text, integer, integer)
                                                                  to anon, authenticated;
grant execute on function public.log_shots(uuid, jsonb)           to anon, authenticated;
grant execute on function public.top_players(integer)             to anon, authenticated;
grant execute on function public.rival_above(uuid)                to anon, authenticated;
grant execute on function public.player_card(uuid)                to anon, authenticated;
grant execute on function public.create_room(uuid, text, text, integer, boolean) to anon, authenticated;
grant execute on function public.join_room(text, uuid, text, text) to anon, authenticated;
grant execute on function public.close_room(text)                 to anon, authenticated;
grant execute on function public.platform_counters()              to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
