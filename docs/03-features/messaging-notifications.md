# Feature: Messaging & Notifications

> ⚠️ **LEGACY — OUTDATED.** Use `docs/05-features-specification.md` (F-15, F-16) instead. Both messaging and notifications are now IN SCOPE and fully designed. See Round 2B and 2C decisions in `docs/09-decisions-log.md`.

**Status:** UI placeholder only — out of scope for MVP  
**Source:** Confirmed by user.

---

## Current State

- `job-seeker/messages/page.tsx` — UI shell exists, no backend
- `job-seeker/notifications/page.tsx` — UI shell exists, no backend
- No `messages` or `notifications` tables in the database

## Decision

These features are **out of scope for the MVP**.
They may be implemented post-launch using Supabase Realtime.

## Post-MVP Notes

When implemented, they should use:
- Supabase Realtime subscriptions for live updates
- New `messages` table: sender_id, recipient_id, content, read_at, created_at
- New `notifications` table: user_id, type, content, read_at, reference_id, created_at
- Push notifications (browser or mobile — TBD)
