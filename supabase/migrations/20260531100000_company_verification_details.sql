create table if not exists public.company_verification_details (
  company_id uuid primary key references public.companies(id) on delete cascade,
  legal_company_name text not null,
  work_email text not null,
  contact_person_name text not null,
  contact_job_title text not null,
  phone_number text not null,
  country_of_registration text not null default 'Jordan',
  commercial_registration_number text not null,
  verification_status text not null default 'pending',
  review_message text null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_verification_country_check
    check (country_of_registration in ('Jordan')),
  constraint company_verification_status_check
    check (verification_status in ('pending', 'approved', 'rejected', 'needs_changes'))
);

create unique index if not exists company_verification_registration_unique
  on public.company_verification_details (
    country_of_registration,
    commercial_registration_number
  );

alter table public.company_verification_details enable row level security;

drop policy if exists "Company owners and admins can read verification details"
  on public.company_verification_details;
create policy "Company owners and admins can read verification details"
  on public.company_verification_details
  for select
  to authenticated
  using (
    (select auth.uid()) = company_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Company owners can insert verification details"
  on public.company_verification_details;
create policy "Company owners can insert verification details"
  on public.company_verification_details
  for insert
  to authenticated
  with check ((select auth.uid()) = company_id);

drop policy if exists "Company owners can resubmit unapproved verification details"
  on public.company_verification_details;
create policy "Company owners can resubmit unapproved verification details"
  on public.company_verification_details
  for update
  to authenticated
  using (
    (select auth.uid()) = company_id
    and verification_status in ('pending', 'rejected', 'needs_changes')
  )
  with check (
    (select auth.uid()) = company_id
    and verification_status = 'pending'
  );

drop policy if exists "Admins can update verification details"
  on public.company_verification_details;
create policy "Admins can update verification details"
  on public.company_verification_details
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );
