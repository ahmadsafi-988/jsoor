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
      'job_locked',
      'job_unlocked',
      'forum_request_submitted',
      'forum_request_received',
      'forum_request_approved',
      'forum_request_rejected',
      'forum_post_commented',
      'forum_comment_replied',
      'forum_report_submitted'
    )
  );

alter table public.forum_memberships
  drop column if exists notifications_enabled;
