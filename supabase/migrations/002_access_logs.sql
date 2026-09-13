-- Apply after 001_initial_schema.sql. This migration does not modify existing scores.
begin;

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address inet,
  browser text not null,
  user_agent text check (char_length(user_agent) <= 512),
  created_at timestamptz not null default now()
);
create index access_logs_created_at_idx on public.access_logs (created_at desc);
create index access_logs_user_id_idx on public.access_logs (user_id, created_at desc);

-- Read metadata at the database boundary. No external IP lookup or client metadata fields.
-- Header availability depends on the gateway. A missing/invalid IP is stored as NULL.
create function public.capture_access_metadata()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  raw_ip text := nullif(btrim(split_part(headers->>'x-forwarded-for', ',', 1)), '');
  agent text := left(headers->>'user-agent', 512);
begin
  -- Always replace metadata, even if a privileged caller passes explicit values.
  new.ip_address := null;
  begin
    new.ip_address := raw_ip::inet;
  exception when invalid_text_representation then
    new.ip_address := null;
  end;
  new.user_agent := agent;
  new.browser := case
    when agent ~* '(Edg/|EdgA/|EdgiOS/)' then 'Edge'
    when agent ~* '(OPR/|OPiOS/|Opera)' then 'Opera'
    when agent ~* 'SamsungBrowser/' then 'Samsung Internet'
    when agent ~* '(Firefox/|FxiOS/)' then 'Firefox'
    when agent ~* '(Chrome/|CriOS/|Chromium/)' then 'Chrome / Chromium'
    when agent ~* 'Safari/' then 'Safari'
    else 'Otro / desconocido'
  end;
  new.created_at := now();
  return new;
end;
$$;
create trigger capture_access_metadata_before_insert
  before insert on public.access_logs
  for each row execute function public.capture_access_metadata();
revoke all on function public.capture_access_metadata() from public, anon, authenticated;

alter table public.access_logs enable row level security;
-- Authenticated visitors can log only their own access. No client may read these rows.
create policy "Players record their own access"
  on public.access_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
revoke all on public.access_logs from public, anon, authenticated;
-- IP, browser, user agent, ID and time cannot be supplied through the frontend API.
grant insert (user_id) on public.access_logs to authenticated;
-- Administrative access only; never place the service role key in the frontend.
grant select, delete on public.access_logs to service_role;

comment on table public.access_logs is
  'Access metadata for authenticated app visits. Private to administrators, never included in the leaderboard.';
comment on column public.access_logs.ip_address is
  'First X-Forwarded-For address received by Supabase, IPv4 or IPv6. NULL if unavailable; not an identity or anti-cheat proof.';
comment on column public.access_logs.browser is
  'Best-effort family inferred from User-Agent. Browsers and proxies may modify these headers.';

commit;
