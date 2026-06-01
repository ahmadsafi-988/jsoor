drop policy if exists "Participants create own forum posts" on public.forum_posts;

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
    and exists (
      select 1 from public.forum_memberships
      where forum_memberships.forum_id = forum_posts.forum_id
        and forum_memberships.user_id = (select auth.uid())
    )
  );
