-- Run once in the Supabase SQL editor. Anonymous Auth users use the authenticated role.
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null check (
    char_length(player_name) between 2 and 18
    and player_name = btrim(player_name)
    and player_name ~ '^[[:alnum:] _-]+$'
  ),
  score integer not null check (score between 0 and 100000),
  survived_seconds integer not null check (survived_seconds between 0 and 90),
  issues_resolved integer not null check (issues_resolved between 0 and 1000),
  max_combo numeric not null check (max_combo in (1, 1.2, 1.5, 2, 2.5, 3)),
  boss_resolved boolean not null,
  result text not null check (result in ('survived', 'down')),
  created_at timestamptz not null default now(),
  check (result <> 'survived' or survived_seconds = 90)
);
create index scores_score_idx on public.scores (score desc);
create index scores_created_at_idx on public.scores (created_at desc);
create index scores_user_id_idx on public.scores (user_id, score desc);
alter table public.scores enable row level security;

-- Reading leaderboard scores requires an authenticated session (including anonymous sign-ins).
create policy "Authenticated players read scores"
  on public.scores for select to authenticated using (true);
-- A client can only submit a score for its own authenticated identity.
create policy "Players insert their own scores"
  on public.scores for insert to authenticated with check ((select auth.uid()) = user_id);
-- No UPDATE or DELETE policies. Revoke broad defaults as defense in depth.
revoke all on public.scores from anon, authenticated;
grant select on public.scores to authenticated;
-- Exclude id and created_at: clients cannot backdate scores or choose DB identifiers.
grant insert (user_id, player_name, score, survived_seconds, issues_resolved, max_combo, boss_resolved, result)
  on public.scores to authenticated;

-- SECURITY INVOKER keeps RLS in effect. Rank each player's best run, not duplicate runs.
create function public.get_leaderboard(weekly boolean default true)
returns setof public.scores
language sql stable security invoker set search_path = ''
as $$
  select (best.entry).* from (
    select distinct on (s.user_id) s as entry
    from public.scores s
    where not weekly or s.created_at >= (date_trunc('week', now() at time zone 'UTC') at time zone 'UTC')
    order by s.user_id, s.score desc, s.created_at asc, s.id asc
  ) best
  order by (best.entry).score desc, (best.entry).created_at asc, (best.entry).id asc
  limit 10;
$$;

-- Compute rank across all players, including those outside the top ten.
create function public.get_my_weekly_rank()
returns bigint
language sql stable security invoker set search_path = ''
as $$
  with best as (
    select distinct on (s.user_id) s.user_id, s.score, s.created_at, s.id
    from public.scores s
    where s.created_at >= (date_trunc('week', now() at time zone 'UTC') at time zone 'UTC')
    order by s.user_id, s.score desc, s.created_at asc, s.id asc
  ), ranked as (
    select user_id, row_number() over (order by score desc, created_at asc, id asc) as position from best
  )
  select position from ranked where user_id = (select auth.uid());
$$;
revoke all on function public.get_leaderboard(boolean) from public, anon;
revoke all on function public.get_my_weekly_rank() from public, anon;
grant execute on function public.get_leaderboard(boolean) to authenticated;
grant execute on function public.get_my_weekly_rank() to authenticated;
