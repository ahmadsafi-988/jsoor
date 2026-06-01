alter table public.forums
  add column if not exists image_url text;

alter table public.forum_creation_requests
  add column if not exists image_url text;

comment on column public.forums.image_url is 'Optional community image URL shown in community cards and headers.';
comment on column public.forum_creation_requests.image_url is 'Optional requested community image URL copied when the request is approved.';
