begin;

create extension if not exists pgcrypto;

create type public.pledge_tier as enum ('GREEN', 'ORANGE', 'RED');
create type public.pledge_state as enum (
  'MURMUR', 'APPARITION', 'HAUNTING', 'KEPT', 'BROKEN', 'INCONCLUSIVE'
);
create type public.stake_side as enum ('KEPT', 'BROKEN');
create type public.decision_actor as enum ('ai', 'human');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  souls integer not null default 1000 check (souls >= 0),
  daily_stake_cap integer not null default 500 check (daily_stake_cap between 10 and 5000),
  prophet_rank numeric(5, 2) not null default 50 check (prophet_rank between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pledges (
  id text primary key,
  question text not null check (length(trim(question)) > 0),
  criteria text not null check (length(trim(criteria)) > 0),
  deadline timestamptz not null,
  tier public.pledge_tier not null,
  state public.pledge_state not null default 'MURMUR',
  evidence_level smallint not null default 0 check (evidence_level between 0 and 4),
  outcome public.stake_side,
  ai_confidence numeric(5, 4) check (ai_confidence between 0 and 1),
  category text not null default 'WORLD' check (category in ('SPORT', 'POLITICS', 'CELEBRITIES', 'WORLD')),
  scenario_label text,
  unconfirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (state = 'KEPT' and outcome = 'KEPT' and evidence_level >= 3) or
    (state = 'BROKEN' and outcome = 'BROKEN' and evidence_level >= 3) or
    (state not in ('KEPT', 'BROKEN') and outcome is null)
  ),
  check (tier <> 'ORANGE' or unconfirmed = true)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  pledge_id text not null references public.pledges(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  kind text not null check (kind in ('statement', 'reliable', 'official')),
  independent_group text not null check (length(trim(independent_group)) > 0),
  label text not null check (length(trim(label)) > 0),
  fetched_at timestamptz not null default now(),
  unique (pledge_id, url, independent_group)
);

create table public.stakes (
  id uuid primary key default gen_random_uuid(),
  pledge_id text not null references public.pledges(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  side public.stake_side not null,
  amount integer not null check (amount >= 10),
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  pledge_id text references public.pledges(id) on delete set null,
  draft_id text,
  actor public.decision_actor not null,
  action text not null check (length(trim(action)) > 0),
  reason text not null check (length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

create table public.tombstones (
  id uuid primary key default gen_random_uuid(),
  pledge_id text not null references public.pledges(id) on delete restrict,
  ai_claim public.pledge_state not null check (ai_claim in ('KEPT', 'BROKEN', 'INCONCLUSIVE')),
  human_override public.pledge_state not null check (human_override in ('KEPT', 'BROKEN', 'INCONCLUSIVE')),
  reason text not null check (length(trim(reason)) > 0),
  created_at timestamptz not null default now(),
  check (ai_claim <> human_override)
);

create index stakes_user_created_idx on public.stakes(user_id, created_at desc);
create index stakes_pledge_idx on public.stakes(pledge_id);
create index sources_pledge_idx on public.sources(pledge_id);
create index pledges_state_deadline_idx on public.pledges(state, deadline);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, souls) values (new.id, 1000)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.place_stake(
  pledge_id_input text,
  side_input public.stake_side,
  amount_input integer
)
returns public.stakes
language plpgsql
security definer
set search_path = public
as $$
declare
  player_id uuid := auth.uid();
  pledge_row public.pledges;
  profile_row public.profiles;
  staked_today bigint;
  created_stake public.stakes;
begin
  if player_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if amount_input < 10 then raise exception 'BELOW_MINIMUM'; end if;

  select * into pledge_row from public.pledges
  where id = pledge_id_input for update;
  if not found then raise exception 'PLEDGE_NOT_FOUND'; end if;
  if pledge_row.state not in ('APPARITION', 'HAUNTING') or
     pledge_row.deadline <= now() or pledge_row.outcome is not null then
    raise exception 'PLEDGE_CLOSED';
  end if;

  select * into profile_row from public.profiles
  where id = player_id for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if profile_row.souls < amount_input then raise exception 'ABOVE_BALANCE'; end if;

  select coalesce(sum(amount), 0) into staked_today
  from public.stakes
  where user_id = player_id and created_at >= date_trunc('day', now());
  if staked_today + amount_input > profile_row.daily_stake_cap then
    raise exception 'DAILY_CAP_EXCEEDED';
  end if;

  update public.profiles
  set souls = souls - amount_input, updated_at = now()
  where id = player_id;

  insert into public.stakes (pledge_id, user_id, side, amount)
  values (pledge_id_input, player_id, side_input, amount_input)
  returning * into created_stake;
  return created_stake;
end;
$$;

alter table public.profiles enable row level security;
alter table public.pledges enable row level security;
alter table public.sources enable row level security;
alter table public.stakes enable row level security;
alter table public.decisions enable row level security;
alter table public.tombstones enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "public_read_published_pledges" on public.pledges
for select to anon, authenticated using (state <> 'MURMUR');
create policy "public_read_sources" on public.sources
for select to anon, authenticated using (
  exists (select 1 from public.pledges p where p.id = pledge_id and p.state <> 'MURMUR')
);
create policy "players_read_own_stakes" on public.stakes
for select to authenticated using (user_id = auth.uid());
create policy "public_read_decisions" on public.decisions
for select to anon, authenticated using (true);
create policy "public_read_tombstones" on public.tombstones
for select to anon, authenticated using (true);

revoke all on public.profiles, public.pledges, public.sources, public.stakes,
  public.decisions, public.tombstones from anon, authenticated;
grant select on public.pledges, public.sources, public.decisions, public.tombstones to anon, authenticated;
grant select on public.profiles, public.stakes to authenticated;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.place_stake(text, public.stake_side, integer) from public, anon;
grant execute on function public.place_stake(text, public.stake_side, integer) to authenticated;

commit;
