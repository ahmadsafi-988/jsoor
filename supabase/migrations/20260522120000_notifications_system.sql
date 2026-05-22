create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  link text,
  job_id uuid references public.jobs(id) on delete set null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists job_id uuid references public.jobs(id) on delete set null,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists read_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_actor_id_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_actor_id_fkey
      foreign key (actor_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_job_id_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_job_id_fkey
      foreign key (job_id) references public.jobs(id) on delete set null;
  end if;
end $$;

update public.notifications
set
  is_read = coalesce(is_read, false),
  created_at = coalesce(created_at, now()),
  metadata = coalesce(metadata, '{}'::jsonb);

alter table public.notifications
  alter column is_read set default false,
  alter column is_read set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'application_status_changed',
      'assessment_sent',
      'assessment_results_released',
      'new_application',
      'assessment_submitted',
      'new_message',
      'company_approval_requested',
      'job_report_submitted'
    )
  );

create index if not exists notifications_user_unread_created_idx
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_type_idx
  on public.notifications (type);

create index if not exists notifications_entity_idx
  on public.notifications (entity_type, entity_id);

create index if not exists notifications_job_id_idx
  on public.notifications (job_id);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can update own notification read state" on public.notifications;

create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update own notification read state"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (is_read, read_at) on table public.notifications to authenticated;
