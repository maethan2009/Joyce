/*
# EduCampus — Multi-Portal Architecture

Extends the initial schema with:
- Roles: super_admin, student_free, student_verified, school_admin, pro_recruiter
- Schools + module toggles (elections / mentorship)
- Orientation: scholarships, careers (métiers A–Z)
- EduAmis: posts, follows, likes
- Messaging (direct conversations)
- Professional courses & certifications
- Academic modules / grades / assignments
- Account validation workflow for school_admin & pro_recruiter
- Events calendar table used by the Events page
- Anti-spam helpers + notifications
- Updated RLS for role-based access
*/

-- ---------------------------------------------------------------------------
-- 1. Role enum evolution (keep legacy values for compatibility)
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.user_role add value if not exists 'super_admin';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type public.user_role add value if not exists 'student_free';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type public.user_role add value if not exists 'student_verified';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type public.user_role add value if not exists 'school_admin';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type public.user_role add value if not exists 'pro_recruiter';
exception when duplicate_object then null;
end $$;

create type public.account_status as enum ('pending', 'approved', 'rejected');
create type public.scholarship_region as enum ('cameroun', 'afrique', 'international');
create type public.post_visibility as enum ('public', 'followers', 'school');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.certification_status as enum ('pending', 'validated', 'rejected');

-- ---------------------------------------------------------------------------
-- 2. Schools
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,
  country             text not null default 'Cameroun',
  city                text,
  category            text not null default 'TIC',
  ranking_position    integer,
  why_top             text,
  advantages          text[] default '{}',
  disadvantages       text[] default '{}',
  admission_info      text,
  description         text,
  logo_url            text,
  website             text,
  elections_enabled   boolean not null default false,
  mentorship_enabled  boolean not null default false,
  is_published        boolean not null default false,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_schools_published on public.schools (is_published, ranking_position);

-- ---------------------------------------------------------------------------
-- 3. Profiles: support free accounts + school link + validation
-- ---------------------------------------------------------------------------
alter table public.profiles
  alter column matricule drop not null;

alter table public.profiles
  drop constraint if exists profiles_matricule_fkey;

alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null,
  add column if not exists account_status public.account_status not null default 'approved',
  add column if not exists company_name text,
  add column if not exists bio text,
  add column if not exists headline text,
  add column if not exists skills text[] default '{}',
  add column if not exists website_url text,
  add column if not exists validated_by uuid references auth.users(id),
  add column if not exists validated_at timestamptz;

-- Allow null matricule uniqueness (partial unique already via unique constraint — recreate)
alter table public.profiles drop constraint if exists profiles_matricule_key;
create unique index if not exists profiles_matricule_unique
  on public.profiles (matricule) where matricule is not null;

create index if not exists idx_profiles_school on public.profiles (school_id);
create index if not exists idx_profiles_account_status on public.profiles (account_status, role);

-- Migrate legacy student → student_verified when matricule present
update public.profiles
set role = 'student_verified'
where role::text = 'student' and matricule is not null;

-- ---------------------------------------------------------------------------
-- 4. Eligible students: bind to school
-- ---------------------------------------------------------------------------
alter table public.eligible_students
  add column if not exists school_id uuid references public.schools(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 5. Orientation — Scholarships & Careers
-- ---------------------------------------------------------------------------
create table if not exists public.scholarships (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  region          public.scholarship_region not null,
  country         text,
  description     text,
  eligibility     text,
  amount          text,
  deadline        date,
  application_url text,
  is_published    boolean not null default false,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_scholarships_region on public.scholarships (region, is_published);

create table if not exists public.careers (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  slug                  text not null unique,
  letter                char(1) not null,
  missions              text,
  limits_notes          text,
  advantages            text[] default '{}',
  disadvantages         text[] default '{}',
  study_duration        text,
  professionalization   text,
  avg_retirement_age    integer,
  is_published          boolean not null default false,
  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_careers_letter check (letter ~ '^[A-Z]$')
);

create index if not exists idx_careers_letter on public.careers (letter, is_published);

-- ---------------------------------------------------------------------------
-- 6. EduAmis — social graph & posts
-- ---------------------------------------------------------------------------
create table if not exists public.social_follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint chk_no_self_follow check (follower_id <> following_id)
);

create table if not exists public.social_posts (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  body          text not null,
  image_url     text,
  visibility    public.post_visibility not null default 'public',
  achievement_type text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_post_body_len check (char_length(body) between 1 and 4000)
);

create table if not exists public.social_likes (
  post_id     uuid not null references public.social_posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_social_posts_created on public.social_posts (created_at desc);
create index if not exists idx_social_follows_following on public.social_follows (following_id);

-- ---------------------------------------------------------------------------
-- 7. Messaging (direct, beyond SkillLink offer threads)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  subject       text,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);

create table if not exists public.direct_messages (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint chk_dm_body check (char_length(body) between 1 and 5000)
);

create index if not exists idx_dm_conversation on public.direct_messages (conversation_id, created_at);

do $$ begin
  alter publication supabase_realtime add table public.direct_messages;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Professional courses & certifications (Academic Hub tab)
-- ---------------------------------------------------------------------------
create table if not exists public.professional_courses (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  skills        text[] default '{}',
  media_url     text,
  duration_hours numeric,
  status        public.course_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.certifications (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid references public.professional_courses(id) on delete set null,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  validator_id  uuid references public.profiles(id),
  title         text not null,
  skills        text[] default '{}',
  status        public.certification_status not null default 'pending',
  issued_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_courses_status on public.professional_courses (status);
create index if not exists idx_certs_student on public.certifications (student_id, status);

-- ---------------------------------------------------------------------------
-- 9. Academic Hub — modules, grades, assignments
-- ---------------------------------------------------------------------------
create table if not exists public.academic_modules (
  id            uuid primary key default uuid_generate_v4(),
  school_id     uuid references public.schools(id) on delete cascade,
  code          text not null,
  title         text not null,
  filiere       text,
  niveau        text,
  ects          numeric(4,1) not null default 0,
  semester      text,
  academic_year text,
  created_at    timestamptz not null default now()
);

create table if not exists public.academic_grades (
  id            uuid primary key default uuid_generate_v4(),
  module_id     uuid not null references public.academic_modules(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  grade         numeric(5,2),
  ects_earned   numeric(4,1) default 0,
  created_at    timestamptz not null default now(),
  unique (module_id, student_id)
);

create table if not exists public.academic_assignments (
  id            uuid primary key default uuid_generate_v4(),
  module_id     uuid references public.academic_modules(id) on delete set null,
  school_id     uuid references public.schools(id) on delete cascade,
  title         text not null,
  description   text,
  due_at        timestamptz,
  assignment_type text not null default 'devoir',
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. Events calendar (used by EventsPage)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                    uuid primary key default uuid_generate_v4(),
  school_id             uuid references public.schools(id) on delete set null,
  title                 text not null,
  category              text not null default 'ACADEMIQUE',
  organizer             text,
  date                  date not null,
  time                  text,
  location              text,
  image                 text,
  description           text,
  program               text[] default '{}',
  is_contest            boolean not null default false,
  requires_registration boolean not null default false,
  created_by            uuid references public.profiles(id),
  created_at            timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id            uuid primary key default uuid_generate_v4(),
  event_id      uuid not null references public.events(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  kind          text not null default 'ticket',
  payload       jsonb default '{}',
  created_at    timestamptz not null default now(),
  unique (event_id, profile_id, kind)
);

create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  category      text not null default 'system',
  type          text not null default 'info',
  description   text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 11. Anti-spam / rate limiting helpers
-- ---------------------------------------------------------------------------
create table if not exists public.form_submissions (
  id            uuid primary key default uuid_generate_v4(),
  form_key      text not null,
  user_id       uuid references auth.users(id),
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_form_submissions_key_time
  on public.form_submissions (form_key, created_at desc);

create or replace function public.check_rate_limit(
  p_form_key text,
  p_max_per_minute integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  select count(*) into v_count
  from public.form_submissions
  where form_key = p_form_key
    and user_id = auth.uid()
    and created_at > now() - interval '1 minute';

  if v_count >= p_max_per_minute then
    return false;
  end if;

  insert into public.form_submissions (form_key, user_id)
  values (p_form_key, auth.uid());

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. Helper: current profile role / school
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and account_status = 'approved'
  );
$$;

create or replace function public.is_school_admin_of(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'school_admin'
      and account_status = 'approved'
      and school_id = p_school_id
  );
$$;

create or replace function public.my_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.school_module_enabled(p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    case p_module
      when 'elections' then s.elections_enabled
      when 'mentorship' then s.mentorship_enabled
      else false
    end,
    false
  )
  from public.profiles p
  left join public.schools s on s.id = p.school_id
  where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 13. Auth RPCs — free signup + verified activation + pro/school requests
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'student_free');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_status public.account_status := 'approved';
begin
  if v_role in ('school_admin', 'pro_recruiter') then
    v_status := 'pending';
  end if;
  if v_role not in ('student_free', 'student_verified', 'school_admin', 'pro_recruiter', 'super_admin') then
    v_role := 'student_free';
  end if;
  -- Never allow self-assigning super_admin via signup metadata
  if v_role = 'super_admin' then
    v_role := 'student_free';
    v_status := 'approved';
  end if;

  insert into public.profiles (id, matricule, full_name, role, account_status, company_name)
  values (
    new.id,
    null,
    v_name,
    v_role::public.user_role,
    v_status,
    new.raw_user_meta_data->>'company_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.activate_student(p_matricule text, p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eligible public.eligible_students%rowtype;
begin
  select * into v_eligible
  from public.eligible_students
  where matricule = p_matricule and is_activated = false;

  if not found then
    raise exception 'Matricule not eligible or already activated';
  end if;

  insert into public.profiles (
    id, matricule, full_name, role, filiere, niveau, school_id, account_status
  ) values (
    auth.uid(), p_matricule, p_full_name, 'student_verified',
    v_eligible.filiere, v_eligible.niveau, v_eligible.school_id, 'approved'
  )
  on conflict (id) do update set
    matricule = excluded.matricule,
    full_name = excluded.full_name,
    role = 'student_verified',
    filiere = excluded.filiere,
    niveau = excluded.niveau,
    school_id = excluded.school_id,
    account_status = 'approved',
    updated_at = now();

  update public.eligible_students
  set is_activated = true, activated_at = now()
  where matricule = p_matricule;
end;
$$;

create or replace function public.validate_account(p_user_id uuid, p_approve boolean, p_school_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super_admin can validate accounts';
  end if;

  update public.profiles
  set
    account_status = case when p_approve then 'approved'::public.account_status else 'rejected'::public.account_status end,
    school_id = coalesce(p_school_id, school_id),
    validated_by = auth.uid(),
    validated_at = now(),
    updated_at = now()
  where id = p_user_id
    and role in ('school_admin', 'pro_recruiter');
end;
$$;

create or replace function public.start_direct_conversation(p_other_user uuid, p_subject text default null, p_body text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
begin
  if auth.uid() is null or p_other_user = auth.uid() then
    raise exception 'Invalid conversation participants';
  end if;

  if not public.check_rate_limit('start_conversation', 10) then
    raise exception 'Rate limit exceeded';
  end if;

  insert into public.conversations (created_by, subject)
  values (auth.uid(), p_subject)
  returning id into v_conv_id;

  insert into public.conversation_participants (conversation_id, profile_id)
  values (v_conv_id, auth.uid()), (v_conv_id, p_other_user);

  if p_body is not null and length(trim(p_body)) > 0 then
    insert into public.direct_messages (conversation_id, sender_id, body)
    values (v_conv_id, auth.uid(), trim(p_body));
  end if;

  return v_conv_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 14. RLS — enable + policies
-- ---------------------------------------------------------------------------
alter table public.schools enable row level security;
alter table public.scholarships enable row level security;
alter table public.careers enable row level security;
alter table public.social_follows enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_likes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.direct_messages enable row level security;
alter table public.professional_courses enable row level security;
alter table public.certifications enable row level security;
alter table public.academic_modules enable row level security;
alter table public.academic_grades enable row level security;
alter table public.academic_assignments enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.notifications enable row level security;
alter table public.form_submissions enable row level security;

-- Schools
drop policy if exists schools_public_read on public.schools;
create policy schools_public_read on public.schools for select
  using (is_published = true or public.is_super_admin() or public.is_school_admin_of(id));

drop policy if exists schools_super_write on public.schools;
create policy schools_super_write on public.schools for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists schools_admin_update_own on public.schools;
create policy schools_admin_update_own on public.schools for update
  using (public.is_school_admin_of(id))
  with check (public.is_school_admin_of(id));

-- Scholarships / careers: published read; super_admin write
drop policy if exists scholarships_read on public.scholarships;
create policy scholarships_read on public.scholarships for select
  using (is_published = true or public.is_super_admin());

drop policy if exists scholarships_write on public.scholarships;
create policy scholarships_write on public.scholarships for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists careers_read on public.careers;
create policy careers_read on public.careers for select
  using (is_published = true or public.is_super_admin());

drop policy if exists careers_write on public.careers;
create policy careers_write on public.careers for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Profiles: broaden select for social / messaging (approved accounts)
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy profiles_select_authenticated on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or account_status = 'approved'
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy profiles_update_own on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Social
drop policy if exists social_follows_read on public.social_follows;
create policy social_follows_read on public.social_follows for select to authenticated using (true);

drop policy if exists social_follows_write on public.social_follows;
create policy social_follows_write on public.social_follows for insert to authenticated
  with check (follower_id = auth.uid());

drop policy if exists social_follows_delete on public.social_follows;
create policy social_follows_delete on public.social_follows for delete to authenticated
  using (follower_id = auth.uid());

drop policy if exists social_posts_read on public.social_posts;
create policy social_posts_read on public.social_posts for select to authenticated
  using (
    visibility = 'public'
    or author_id = auth.uid()
    or (visibility = 'followers' and exists (
      select 1 from public.social_follows f
      where f.follower_id = auth.uid() and f.following_id = author_id
    ))
  );

drop policy if exists social_posts_insert on public.social_posts;
create policy social_posts_insert on public.social_posts for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists social_posts_update on public.social_posts;
create policy social_posts_update on public.social_posts for update to authenticated
  using (author_id = auth.uid());

drop policy if exists social_posts_delete on public.social_posts;
create policy social_posts_delete on public.social_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_super_admin());

drop policy if exists social_likes_all on public.social_likes;
create policy social_likes_all on public.social_likes for all to authenticated
  using (true) with check (user_id = auth.uid());

-- Messaging
drop policy if exists conversations_participants_select on public.conversations;
create policy conversations_participants_select on public.conversations for select to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.profile_id = auth.uid()
  ));

drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select on public.conversation_participants for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );

drop policy if exists dm_select on public.direct_messages;
create policy dm_select on public.direct_messages for select to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
  ));

drop policy if exists dm_insert on public.direct_messages;
create policy dm_insert on public.direct_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.profile_id = auth.uid()
    )
  );

-- Courses / certifications
drop policy if exists courses_read on public.professional_courses;
create policy courses_read on public.professional_courses for select to authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_super_admin());

drop policy if exists courses_write_pro on public.professional_courses;
create policy courses_write_pro on public.professional_courses for all to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'pro_recruiter' and p.account_status = 'approved'
    )
  )
  with check (author_id = auth.uid());

drop policy if exists certs_read on public.certifications;
create policy certs_read on public.certifications for select to authenticated
  using (student_id = auth.uid() or validator_id = auth.uid() or public.is_super_admin());

drop policy if exists certs_insert_student on public.certifications;
create policy certs_insert_student on public.certifications for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists certs_validate_pro on public.certifications;
create policy certs_validate_pro on public.certifications for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'pro_recruiter' and p.account_status = 'approved'
    )
  );

-- Academic (verified students + school admins)
drop policy if exists academic_modules_read on public.academic_modules;
create policy academic_modules_read on public.academic_modules for select to authenticated
  using (
    school_id is null
    or school_id = public.my_school_id()
    or public.is_super_admin()
  );

drop policy if exists academic_grades_read on public.academic_grades;
create policy academic_grades_read on public.academic_grades for select to authenticated
  using (student_id = auth.uid() or public.is_super_admin() or public.is_school_admin_of(public.my_school_id()));

drop policy if exists academic_assignments_read on public.academic_assignments;
create policy academic_assignments_read on public.academic_assignments for select to authenticated
  using (
    school_id is null
    or school_id = public.my_school_id()
    or public.is_super_admin()
  );

-- Events
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated
  using (true);

drop policy if exists events_write_school on public.events;
create policy events_write_school on public.events for all to authenticated
  using (
    public.is_super_admin()
    or (school_id is not null and public.is_school_admin_of(school_id))
  )
  with check (
    public.is_super_admin()
    or (school_id is not null and public.is_school_admin_of(school_id))
  );

drop policy if exists event_reg_own on public.event_registrations;
create policy event_reg_own on public.event_registrations for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Notifications
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid());

-- Form submissions: no client read
drop policy if exists form_submissions_deny on public.form_submissions;
create policy form_submissions_deny on public.form_submissions for all
  using (false) with check (false);

-- Elections: gate by school module when profile has a school
drop policy if exists "elections_select_all_auth" on public.elections;
create policy elections_select_gated on public.elections for select to authenticated
  using (
    public.is_super_admin()
    or public.current_role() = 'school_admin'
    or public.school_module_enabled('elections')
    or public.my_school_id() is null
  );

-- Mentorship: gate similarly via existing table policies (select remains participant-based)
-- Skill offers: also readable by approved pro_recruiter
drop policy if exists "offers_select_auth" on public.skill_offers;
create policy offers_select_auth on public.skill_offers for select to authenticated
  using (auth.role() = 'authenticated');

-- Eligible students: school_admin can manage via security definer RPCs only (keep deny-all)
-- Add school_admin RPC to upsert eligible students
create or replace function public.upsert_eligible_student(
  p_matricule text,
  p_email text,
  p_full_name text,
  p_filiere text,
  p_niveau text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.profiles
  where id = auth.uid() and role = 'school_admin' and account_status = 'approved';

  if v_school is null and not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  if public.is_super_admin() and v_school is null then
    raise exception 'school_id required for super_admin via profile or school context';
  end if;

  insert into public.eligible_students (matricule, official_email, full_name, filiere, niveau, school_id)
  values (p_matricule, lower(p_email), p_full_name, p_filiere, p_niveau, v_school)
  on conflict (matricule) do update set
    official_email = excluded.official_email,
    full_name = excluded.full_name,
    filiere = excluded.filiere,
    niveau = excluded.niveau,
    school_id = coalesce(excluded.school_id, public.eligible_students.school_id);
end;
$$;

create or replace function public.list_school_eligible()
returns setof public.eligible_students
language sql
security definer
set search_path = public
as $$
  select e.*
  from public.eligible_students e
  where e.school_id = public.my_school_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'school_admin' and p.account_status = 'approved'
    );
$$;

create or replace function public.set_school_modules(
  p_elections boolean,
  p_mentorship boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.schools
  set
    elections_enabled = p_elections,
    mentorship_enabled = p_mentorship,
    updated_at = now()
  where id = public.my_school_id()
    and public.is_school_admin_of(id);
end;
$$;

-- Grants
grant usage on schema public to authenticated, anon;
grant select on public.schools, public.scholarships, public.careers to anon, authenticated;
grant execute on function public.verify_eligibility(text, text) to anon, authenticated;
grant execute on function public.activate_student(text, text) to authenticated;
grant execute on function public.validate_account(uuid, boolean, uuid) to authenticated;
grant execute on function public.start_direct_conversation(uuid, text, text) to authenticated;
grant execute on function public.check_rate_limit(text, integer) to authenticated;
grant execute on function public.upsert_eligible_student(text, text, text, text, text) to authenticated;
grant execute on function public.list_school_eligible() to authenticated;
grant execute on function public.set_school_modules(boolean, boolean) to authenticated;
grant execute on function public.school_module_enabled(text) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
