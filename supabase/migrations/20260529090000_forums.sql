create extension if not exists pgcrypto;

create table if not exists public.forums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_from_request_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forums_name_unique unique (name),
  constraint forums_slug_unique unique (slug),
  constraint forums_name_not_blank check (length(trim(name)) > 0),
  constraint forums_description_not_blank check (length(trim(description)) > 0)
);

create table if not exists public.forum_creation_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null,
  reason text not null,
  status text not null default 'pending',
  admin_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint forum_creation_requests_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint forum_creation_requests_name_not_blank check (length(trim(name)) > 0),
  constraint forum_creation_requests_description_not_blank check (length(trim(description)) > 0),
  constraint forum_creation_requests_reason_not_blank check (length(trim(reason)) > 0)
);

create unique index if not exists forum_creation_requests_pending_slug_idx
  on public.forum_creation_requests (slug)
  where status = 'pending';

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.forums(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  is_anonymous boolean not null default false,
  is_hidden boolean not null default false,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_posts_title_not_blank check (length(trim(title)) > 0)
);

create table if not exists public.forum_post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint forum_post_images_storage_path_unique unique (storage_path)
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.forum_comments(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  is_hidden boolean not null default false,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_comments_body_not_blank check (length(trim(body)) > 0)
);

create table if not exists public.forum_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  value integer not null,
  created_at timestamptz not null default now(),
  constraint forum_votes_target_type_check check (target_type in ('post', 'comment')),
  constraint forum_votes_value_check check (value in (-1, 1)),
  constraint forum_votes_one_per_target unique (user_id, target_type, target_id)
);

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'pending',
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint forum_reports_target_type_check check (target_type in ('post', 'comment')),
  constraint forum_reports_status_check check (status in ('pending', 'reviewed', 'dismissed')),
  constraint forum_reports_reason_not_blank check (length(trim(reason)) > 0),
  constraint forum_reports_one_pending_per_target unique (reporter_id, target_type, target_id, status)
);

create table if not exists public.forum_moderators (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.forums(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint forum_moderators_unique unique (forum_id, user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'forums_created_from_request_id_fkey'
      and conrelid = 'public.forums'::regclass
  ) then
    alter table public.forums
      add constraint forums_created_from_request_id_fkey
      foreign key (created_from_request_id)
      references public.forum_creation_requests(id)
      on delete set null;
  end if;
end $$;

create index if not exists forums_active_name_idx on public.forums (is_active, name);
create index if not exists forum_posts_forum_created_idx on public.forum_posts (forum_id, created_at desc);
create index if not exists forum_posts_forum_hidden_idx on public.forum_posts (forum_id, is_hidden);
create index if not exists forum_comments_post_created_idx on public.forum_comments (post_id, created_at asc);
create index if not exists forum_comments_parent_idx on public.forum_comments (parent_comment_id);
create index if not exists forum_votes_target_idx on public.forum_votes (target_type, target_id);
create index if not exists forum_reports_status_idx on public.forum_reports (status, created_at desc);

alter table public.forums enable row level security;
alter table public.forum_creation_requests enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_post_images enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_votes enable row level security;
alter table public.forum_reports enable row level security;
alter table public.forum_moderators enable row level security;

drop policy if exists "Job seekers read active forums" on public.forums;
drop policy if exists "Admins read all forums" on public.forums;
drop policy if exists "Admins manage forums" on public.forums;

create policy "Job seekers read active forums"
  on public.forums for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins read all forums"
  on public.forums for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Admins manage forums"
  on public.forums for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Requesters and admins read forum requests" on public.forum_creation_requests;
drop policy if exists "Job seekers create own forum requests" on public.forum_creation_requests;
drop policy if exists "Admins update forum requests" on public.forum_creation_requests;

create policy "Requesters and admins read forum requests"
  on public.forum_creation_requests for select
  to authenticated
  using (
    requested_by = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Job seekers create own forum requests"
  on public.forum_creation_requests for insert
  to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins update forum requests"
  on public.forum_creation_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Forum participants read visible posts" on public.forum_posts;
drop policy if exists "Admins read all forum posts" on public.forum_posts;
drop policy if exists "Job seekers create own forum posts" on public.forum_posts;
drop policy if exists "Authors update own forum posts" on public.forum_posts;
drop policy if exists "Authors delete own forum posts" on public.forum_posts;

create policy "Forum participants read visible posts"
  on public.forum_posts for select
  to authenticated
  using (
    is_hidden = false
    and exists (
      select 1 from public.forums
      where forums.id = forum_posts.forum_id
        and forums.is_active = true
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins read all forum posts"
  on public.forum_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Job seekers create own forum posts"
  on public.forum_posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
    and exists (
      select 1 from public.forums
      where forums.id = forum_posts.forum_id
        and forums.is_active = true
    )
  );

create policy "Authors update own forum posts"
  on public.forum_posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Authors delete own forum posts"
  on public.forum_posts for delete
  to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Forum participants read visible post images" on public.forum_post_images;
drop policy if exists "Post authors create post images" on public.forum_post_images;

create policy "Forum participants read visible post images"
  on public.forum_post_images for select
  to authenticated
  using (
    exists (
      select 1 from public.forum_posts
      join public.forums on forums.id = forum_posts.forum_id
      join public.profiles on profiles.id = (select auth.uid())
      where forum_posts.id = forum_post_images.post_id
        and (
          profiles.role = 'admin'
          or (profiles.role = 'job_seeker' and forum_posts.is_hidden = false and forums.is_active = true)
        )
    )
  );

create policy "Post authors create post images"
  on public.forum_post_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.forum_posts
      where forum_posts.id = forum_post_images.post_id
        and forum_posts.author_id = (select auth.uid())
    )
  );

drop policy if exists "Forum participants read visible comments" on public.forum_comments;
drop policy if exists "Admins read all forum comments" on public.forum_comments;
drop policy if exists "Job seekers create own comments" on public.forum_comments;
drop policy if exists "Authors update own comments" on public.forum_comments;
drop policy if exists "Authors delete own comments" on public.forum_comments;

create policy "Forum participants read visible comments"
  on public.forum_comments for select
  to authenticated
  using (
    is_hidden = false
    and exists (
      select 1 from public.forum_posts
      join public.forums on forums.id = forum_posts.forum_id
      where forum_posts.id = forum_comments.post_id
        and forum_posts.is_hidden = false
        and forums.is_active = true
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins read all forum comments"
  on public.forum_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Job seekers create own comments"
  on public.forum_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Authors update own comments"
  on public.forum_comments for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Authors delete own comments"
  on public.forum_comments for delete
  to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists "Forum participants manage own votes" on public.forum_votes;
drop policy if exists "Admins read votes" on public.forum_votes;

create policy "Forum participants manage own votes"
  on public.forum_votes for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins read votes"
  on public.forum_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Users and admins read forum reports" on public.forum_reports;
drop policy if exists "Job seekers create own forum reports" on public.forum_reports;
drop policy if exists "Admins update forum reports" on public.forum_reports;

create policy "Users and admins read forum reports"
  on public.forum_reports for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Job seekers create own forum reports"
  on public.forum_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Admins update forum reports"
  on public.forum_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins read forum moderators" on public.forum_moderators;
drop policy if exists "Admins manage forum moderators" on public.forum_moderators;

create policy "Admins read forum moderators"
  on public.forum_moderators for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

create policy "Admins manage forum moderators"
  on public.forum_moderators for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

revoke all on table
  public.forums,
  public.forum_creation_requests,
  public.forum_posts,
  public.forum_post_images,
  public.forum_comments,
  public.forum_votes,
  public.forum_reports,
  public.forum_moderators
from anon, authenticated;

grant select on table public.forums to authenticated;
grant select, insert, update on table public.forum_creation_requests to authenticated;
grant select, insert, delete on table public.forum_posts to authenticated;
grant update (title, body, is_anonymous, updated_at) on table public.forum_posts to authenticated;
grant select, insert on table public.forum_post_images to authenticated;
grant select, insert, delete on table public.forum_comments to authenticated;
grant update (body, is_anonymous, updated_at) on table public.forum_comments to authenticated;
grant select, insert, update, delete on table public.forum_votes to authenticated;
grant select, insert, update on table public.forum_reports to authenticated;
grant select on table public.forum_moderators to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'forum-media',
  'forum-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Job seekers upload forum media" on storage.objects;
drop policy if exists "Forum media owners read own objects" on storage.objects;
drop policy if exists "Forum media owners delete own objects" on storage.objects;

create policy "Job seekers upload forum media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'forum-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'job_seeker'
    )
  );

create policy "Forum media owners read own objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'forum-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'admin'
      )
    )
  );

create policy "Forum media owners delete own objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'forum-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

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
      'job_report_submitted',
      'forum_request_submitted',
      'forum_request_received',
      'forum_request_approved',
      'forum_request_rejected',
      'forum_post_commented',
      'forum_comment_replied',
      'forum_report_submitted'
    )
  );
