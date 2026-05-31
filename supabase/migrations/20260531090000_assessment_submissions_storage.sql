insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assessment-submissions',
  'assessment-submissions',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Job seekers can upload own assessment submission files" on storage.objects;
drop policy if exists "Companies can read own assessment submission files" on storage.objects;

create policy "Job seekers can upload own assessment submission files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assessment-submissions'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1
      from public.assessments a
      join public.job_applications ja on ja.id = a.application_id
      where a.id::text = (storage.foldername(name))[1]
        and ja.applicant_id = (select auth.uid())
        and a.status = 'pending'
    )
  );

create policy "Companies can read own assessment submission files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assessment-submissions'
    and exists (
      select 1
      from public.assessments a
      where a.id::text = (storage.foldername(name))[1]
        and a.company_id = (select auth.uid())
    )
  );
