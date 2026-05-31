create table if not exists public.forum_memberships (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.forums(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint forum_memberships_unique unique (forum_id, user_id)
);

create index if not exists forum_memberships_user_idx on public.forum_memberships (user_id, created_at desc);
create index if not exists forum_memberships_forum_idx on public.forum_memberships (forum_id, created_at desc);

alter table public.forum_memberships enable row level security;

drop policy if exists "Participants read active forum memberships" on public.forum_memberships;
drop policy if exists "Participants create own forum memberships" on public.forum_memberships;
drop policy if exists "Participants delete own forum memberships" on public.forum_memberships;
drop policy if exists "Admins read forum memberships" on public.forum_memberships;

create policy "Participants read active forum memberships"
  on public.forum_memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.forums
      where forums.id = forum_memberships.forum_id
        and forums.is_active = true
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Participants create own forum memberships"
  on public.forum_memberships for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.forums
      where forums.id = forum_memberships.forum_id
        and forums.is_active = true
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Participants delete own forum memberships"
  on public.forum_memberships for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Admins read forum memberships"
  on public.forum_memberships for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Job seekers read active forums" on public.forums;
drop policy if exists "Participants read active forums" on public.forums;

create policy "Participants read active forums"
  on public.forums for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

drop policy if exists "Job seekers create own forum requests" on public.forum_creation_requests;
drop policy if exists "Participants create own forum requests" on public.forum_creation_requests;

create policy "Participants create own forum requests"
  on public.forum_creation_requests for insert
  to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

drop policy if exists "Forum participants read visible posts" on public.forum_posts;
drop policy if exists "Job seekers create own forum posts" on public.forum_posts;
drop policy if exists "Participants create own forum posts" on public.forum_posts;

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
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Participants create own forum posts"
  on public.forum_posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
    and exists (
      select 1 from public.forums
      where forums.id = forum_posts.forum_id
        and forums.is_active = true
    )
  );

drop policy if exists "Forum participants read visible post images" on public.forum_post_images;

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
          or (profiles.role in ('job_seeker', 'company') and forum_posts.is_hidden = false and forums.is_active = true)
        )
    )
  );

drop policy if exists "Forum participants read visible comments" on public.forum_comments;
drop policy if exists "Job seekers create own comments" on public.forum_comments;
drop policy if exists "Participants create own comments" on public.forum_comments;

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
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Participants create own comments"
  on public.forum_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

drop policy if exists "Forum participants manage own votes" on public.forum_votes;

create policy "Forum participants manage own votes"
  on public.forum_votes for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

drop policy if exists "Job seekers create own forum reports" on public.forum_reports;
drop policy if exists "Participants create own forum reports" on public.forum_reports;

create policy "Participants create own forum reports"
  on public.forum_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

drop policy if exists "Job seekers upload forum media" on storage.objects;
drop policy if exists "Participants upload forum media" on storage.objects;
drop policy if exists "Forum media owners read own objects" on storage.objects;
drop policy if exists "Forum participants read visible media" on storage.objects;

create policy "Participants upload forum media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'forum-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('job_seeker', 'company')
    )
  );

create policy "Forum participants read visible media"
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
      or exists (
        select 1 from public.forum_post_images
        join public.forum_posts on forum_posts.id = forum_post_images.post_id
        join public.forums on forums.id = forum_posts.forum_id
        join public.profiles on profiles.id = (select auth.uid())
        where forum_post_images.storage_path = storage.objects.name
          and forum_posts.is_hidden = false
          and forums.is_active = true
          and profiles.role in ('job_seeker', 'company')
      )
    )
  );

grant select, insert, delete on table public.forum_memberships to authenticated;
