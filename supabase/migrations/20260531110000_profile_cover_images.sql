alter table public.profiles
  add column if not exists cover_url text;

alter table public.companies
  add column if not exists cover_url text;

comment on column public.profiles.cover_url is 'Public profile background image URL from Supabase Storage.';
comment on column public.companies.cover_url is 'Public company profile background image URL from Supabase Storage.';
