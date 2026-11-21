/*
# EduCampus — Initial Schema

## Overview
Creates the complete database schema for the EduCampus campus PWA: student enrollment,
elections with anonymous voting, academic resource hub, skill marketplace, mentorship
matching, and TOTP-based event passes.

## New Tables
1. `eligible_students` — whitelist of students allowed to enroll (admin-managed)
2. `profiles` — 1:1 extension of auth.users with role, filiere, TOTP secret
3. `elections` — election metadata with status and time window
4. `candidates` — candidates per election
5. `election_voters` — voter registry (who is eligible, who has voted)
6. `election_ballots` — anonymous ballots (NO user_id column, ever)
7. `academic_resources` — file metadata for the academic hub
8. `skill_offers` — marketplace offers
9. `skill_conversations` — 1:1 conversations between offer owner and requester
10. `skill_messages` — messages within conversations (realtime-enabled)
11. `mentorship_matches` — mentor/mentee match proposals with scores
12. `event_passes` — event metadata for TOTP QR access
13. `event_checkins` — check-in records

## Security
- RLS enabled on ALL tables
- `eligible_students` has NO direct access (deny-all policy) — only accessible via
  security-definer RPC functions
- Ballots are fully anonymous: no user_id, day-truncated timestamps, randomized delay
  in cast_ballot RPC to prevent timing correlation
- Profiles: users read/update own row; campus_admin reads all
- Skill conversations/messages: only participants can read/write
- Mentorship matches: only matched parties can see their matches

## RPC Functions
- `verify_eligibility(matricule, email)` — checks enrollment whitelist
- `activate_student(matricule, full_name)` — creates profile, flips is_activated
- `enroll_totp(secret)` — encrypts TOTP secret with pgcrypto
- `cast_ballot(election_id, candidate_id)` — anonymous vote casting
- `generate_mentor_matches(mentee_id)` — auto-matching with scoring
*/

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type user_role as enum ('student', 'candidate', 'election_admin', 'campus_admin');
create type resource_type as enum ('course', 'past_exam', 'summary', 'other');
create type skill_category as enum ('tutoring', 'network_support', 'graphic_design', 'other');
create type offer_status as enum ('open', 'in_progress', 'closed');
create type election_status as enum ('draft', 'open', 'closed', 'archived');

-- eligible_students: whitelist, never directly accessible by clients
create table if not exists public.eligible_students (
  matricule           text primary key,
  official_email      text not null unique,
  full_name           text not null,
  filiere             text not null,
  niveau              text not null,
  is_activated        boolean not null default false,
  activated_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_eligible_students_email on public.eligible_students (lower(official_email));
create index if not exists idx_eligible_students_filiere on public.eligible_students (filiere);

-- profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  matricule      text not null unique references public.eligible_students(matricule),
  full_name      text not null,
  role           user_role not null default 'student',
  filiere        text,
  niveau         text,
  avatar_url     text,
  totp_secret    text,
  totp_enrolled_at timestamptz,
  interests      text[] default '{}',
  is_mentor_opt_in boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_filiere on public.profiles(filiere);

-- elections
create table if not exists public.elections (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  status       election_status not null default 'draft',
  opens_at     timestamptz not null,
  closes_at    timestamptz not null,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  constraint chk_dates check (closes_at > opens_at)
);

create table if not exists public.candidates (
  id            uuid primary key default uuid_generate_v4(),
  election_id   uuid not null references public.elections(id) on delete cascade,
  profile_id    uuid references public.profiles(id),
  display_name  text not null,
  program_url   text,
  photo_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.election_voters (
  election_id   uuid not null references public.elections(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  has_voted     boolean not null default false,
  voted_at      timestamptz,
  primary key (election_id, user_id)
);

-- election_ballots: NO user_id column — anonymity by design
create table if not exists public.election_ballots (
  id               uuid primary key default uuid_generate_v4(),
  election_id      uuid not null references public.elections(id) on delete cascade,
  candidate_id     uuid not null references public.candidates(id) on delete cascade,
  vote_batch_date  date not null default current_date
);

create index if not exists idx_ballots_election_candidate on public.election_ballots(election_id, candidate_id);
create index if not exists idx_voters_election on public.election_voters(election_id);

-- academic_resources
create table if not exists public.academic_resources (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  resource_type resource_type not null,
  filiere       text not null,
  niveau        text not null,
  matiere       text not null,
  academic_year text,
  storage_path  text not null,
  file_size_kb  integer,
  uploaded_by   uuid references public.profiles(id),
  download_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_resources_filters on public.academic_resources(filiere, niveau, matiere);

-- skill_offers + conversations + messages
create table if not exists public.skill_offers (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  category      skill_category not null,
  title         text not null,
  description   text not null,
  status        offer_status not null default 'open',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.skill_conversations (
  id            uuid primary key default uuid_generate_v4(),
  offer_id      uuid not null references public.skill_offers(id) on delete cascade,
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (offer_id, requester_id)
);

create table if not exists public.skill_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.skill_conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id),
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_offers_category on public.skill_offers(category, status);
create index if not exists idx_messages_conversation on public.skill_messages(conversation_id, created_at);

alter publication supabase_realtime add table public.skill_messages;

-- mentorship_matches
create table if not exists public.mentorship_matches (
  id            uuid primary key default uuid_generate_v4(),
  mentor_id     uuid not null references public.profiles(id) on delete cascade,
  mentee_id     uuid not null references public.profiles(id) on delete cascade,
  match_score   numeric not null,
  matched_on    text[],
  status        text not null default 'proposed',
  created_at    timestamptz not null default now(),
  unique (mentor_id, mentee_id)
);

-- event_passes + event_checkins
create table if not exists public.event_passes (
  id            uuid primary key default uuid_generate_v4(),
  event_name    text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create table if not exists public.event_checkins (
  id            uuid primary key default uuid_generate_v4(),
  event_id      uuid not null references public.event_passes(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  scanned_by    uuid references public.profiles(id),
  unique (event_id, profile_id)
);

-- updated_at trigger for profiles
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- RPC: verify_eligibility
create or replace function public.verify_eligibility(p_matricule text, p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.eligible_students
    where matricule = p_matricule
      and lower(official_email) = lower(p_email)
      and is_activated = false
  );
$$;

-- RPC: activate_student
create or replace function public.activate_student(p_matricule text, p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.eligible_students
    where matricule = p_matricule and is_activated = false
  ) then
    raise exception 'Matricule not eligible or already activated';
  end if;

  insert into public.profiles (id, matricule, full_name)
  values (auth.uid(), p_matricule, p_full_name);

  update public.eligible_students
  set is_activated = true, activated_at = now()
  where matricule = p_matricule;
end;
$$;

-- RPC: enroll_totp (encrypts secret at rest)
create or replace function public.enroll_totp(p_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set totp_secret = pgp_sym_encrypt(p_secret, current_setting('app.totp_enc_key', true)),
      totp_enrolled_at = now()
  where id = auth.uid();
end;
$$;

-- RPC: cast_ballot (anonymous voting)
create or replace function public.cast_ballot(p_election_id uuid, p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_voted boolean;
  v_election_open boolean;
begin
  select has_voted into v_already_voted
  from public.election_voters
  where election_id = p_election_id and user_id = auth.uid();

  if v_already_voted is null then
    raise exception 'User is not registered to vote in this election';
  end if;

  if v_already_voted then
    raise exception 'Ballot already cast';
  end if;

  select (status = 'open' and now() between opens_at and closes_at)
  into v_election_open
  from public.elections where id = p_election_id;

  if not v_election_open then
    raise exception 'Election is not currently open';
  end if;

  perform pg_sleep(random() * 0.4);

  insert into public.election_ballots (election_id, candidate_id)
  values (p_election_id, p_candidate_id);

  update public.election_voters
  set has_voted = true, voted_at = now()
  where election_id = p_election_id and user_id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$;

-- RPC: generate_mentor_matches
create or replace function public.generate_mentor_matches(p_mentee_id uuid)
returns setof public.mentorship_matches
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.mentorship_matches (mentor_id, mentee_id, match_score, matched_on)
  select
    m.id,
    p_mentee_id,
    (
      (case when m.filiere = e.filiere then 0.5 else 0 end) +
      (cardinality(array(select unnest(m.interests) intersect select unnest(e.interests)))::numeric
        / greatest(cardinality(e.interests), 1) * 0.5)
    ) as score,
    array_remove(array[
      case when m.filiere = e.filiere then 'filiere:' || m.filiere end
    ], null) || (select array_agg('interest:' || x) from unnest(
      array(select unnest(m.interests) intersect select unnest(e.interests))
    ) as x)
  from public.profiles m
  cross join (select * from public.profiles where id = p_mentee_id) e
  where m.is_mentor_opt_in = true and m.id <> p_mentee_id
  order by score desc
  limit 5
  on conflict (mentor_id, mentee_id) do nothing
  returning *;
end;
$$;

-- Enable RLS on all tables
alter table public.eligible_students enable row level security;
alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.election_voters enable row level security;
alter table public.election_ballots enable row level security;
alter table public.academic_resources enable row level security;
alter table public.skill_offers enable row level security;
alter table public.skill_conversations enable row level security;
alter table public.skill_messages enable row level security;
alter table public.mentorship_matches enable row level security;
alter table public.event_passes enable row level security;
alter table public.event_checkins enable row level security;

-- eligible_students: deny all direct access
drop policy if exists "no_direct_access_eligible_students" on public.eligible_students;
create policy "no_direct_access_eligible_students"
  on public.eligible_students for all
  using (false) with check (false);

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'campus_admin'
  ));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- elections
drop policy if exists "elections_select_all_auth" on public.elections;
create policy "elections_select_all_auth"
  on public.elections for select
  to authenticated
  using (auth.role() = 'authenticated');

drop policy if exists "elections_write_admin" on public.elections;
create policy "elections_write_admin"
  on public.elections for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('election_admin','campus_admin')));

-- candidates
drop policy if exists "candidates_select_all_auth" on public.candidates;
create policy "candidates_select_all_auth"
  on public.candidates for select
  to authenticated
  using (auth.role() = 'authenticated');

-- election_voters: only see own status
drop policy if exists "voters_select_self" on public.election_voters;
create policy "voters_select_self"
  on public.election_voters for select
  to authenticated
  using (user_id = auth.uid());

-- election_ballots: admin-only raw access
drop policy if exists "ballots_select_admin_only" on public.election_ballots;
create policy "ballots_select_admin_only"
  on public.election_ballots for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'campus_admin'));

-- academic_resources
drop policy if exists "resources_select_auth" on public.academic_resources;
create policy "resources_select_auth"
  on public.academic_resources for select
  to authenticated
  using (auth.role() = 'authenticated');

drop policy if exists "resources_insert_own" on public.academic_resources;
create policy "resources_insert_own"
  on public.academic_resources for insert
  to authenticated
  with check (uploaded_by = auth.uid());

-- skill_offers
drop policy if exists "offers_select_auth" on public.skill_offers;
create policy "offers_select_auth"
  on public.skill_offers for select
  to authenticated
  using (auth.role() = 'authenticated');

drop policy if exists "offers_write_owner" on public.skill_offers;
create policy "offers_write_owner"
  on public.skill_offers for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "offers_update_owner" on public.skill_offers;
create policy "offers_update_owner"
  on public.skill_offers for update
  to authenticated
  using (owner_id = auth.uid());

-- skill_conversations
drop policy if exists "conversations_participants" on public.skill_conversations;
create policy "conversations_participants"
  on public.skill_conversations for select
  to authenticated
  using (requester_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "conversations_insert_requester" on public.skill_conversations;
create policy "conversations_insert_requester"
  on public.skill_conversations for insert
  to authenticated
  with check (requester_id = auth.uid());

-- skill_messages
drop policy if exists "messages_participants_select" on public.skill_messages;
create policy "messages_participants_select"
  on public.skill_messages for select
  to authenticated
  using (exists (
    select 1 from public.skill_conversations c
    where c.id = conversation_id
      and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
  ));

drop policy if exists "messages_participants_insert" on public.skill_messages;
create policy "messages_participants_insert"
  on public.skill_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.skill_conversations c
      where c.id = conversation_id
        and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- mentorship_matches
drop policy if exists "matches_select_participants" on public.mentorship_matches;
create policy "matches_select_participants"
  on public.mentorship_matches for select
  to authenticated
  using (mentor_id = auth.uid() or mentee_id = auth.uid());

drop policy if exists "matches_update_participants" on public.mentorship_matches;
create policy "matches_update_participants"
  on public.mentorship_matches for update
  to authenticated
  using (mentor_id = auth.uid() or mentee_id = auth.uid());

-- event_passes
drop policy if exists "events_select_auth" on public.event_passes;
create policy "events_select_auth"
  on public.event_passes for select
  to authenticated
  using (auth.role() = 'authenticated');

-- event_checkins
drop policy if exists "checkins_select_own_or_admin" on public.event_checkins;
create policy "checkins_select_own_or_admin"
  on public.event_checkins for select
  to authenticated
  using (profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('campus_admin','election_admin')
  ));

drop policy if exists "checkins_insert_staff" on public.event_checkins;
create policy "checkins_insert_staff"
  on public.event_checkins for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('campus_admin','election_admin')
  ));

-- Aggregated results view
create or replace view public.election_results as
select
  election_id,
  candidate_id,
  count(*)::int as vote_count
from public.election_ballots
group by election_id, candidate_id;

alter view public.election_results set (security_invoker = true);

grant select on public.election_results to authenticated;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('academic-resources', 'academic-resources', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "resources_bucket_read_auth" on storage.objects;
create policy "resources_bucket_read_auth"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'academic-resources');

drop policy if exists "resources_bucket_insert_auth" on storage.objects;
create policy "resources_bucket_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'academic-resources');

drop policy if exists "avatars_bucket_public_read" on storage.objects;
create policy "avatars_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_bucket_insert_own" on storage.objects;
create policy "avatars_bucket_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
