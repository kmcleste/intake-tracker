# Database Migrations

Run these in order in the Supabase SQL Editor. Each file is idempotent where possible (`IF NOT EXISTS`, `CREATE OR REPLACE`).

---

## 001_initial.sql
Core `entries` table with Row Level Security. Users can only read/write their own entries.

## 002_caregiver.sql
Adds the caregiver system:
- `caregiver_links` — connects patients to caregivers (pending → active)
- `caregiver_notes` — private per-entry notes written by caregivers, with a visibility toggle for sharing back to the patient
- RLS policy allowing active caregivers to read their patient's entries

**After running:** If you see "permission denied" errors on entry insert, run:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON entries, caregiver_links, caregiver_notes TO authenticated;
```

**Fix for accept invite bug** (if accept button does nothing):
```sql
DROP POLICY IF EXISTS "caregivers_update_links" ON caregiver_links;
CREATE POLICY "caregivers_update_links" ON caregiver_links
  FOR UPDATE
  USING (caregiver_email = (auth.jwt()->>'email') AND status = 'pending')
  WITH CHECK (caregiver_email = (auth.jwt()->>'email'));
```

## 003_symptoms.sql
Adds `wellbeing` (1–5 scale) and `symptoms` (text array) columns to entries.

## 004_logged_by.sql
Adds `logged_by` column to entries so caregivers can log on behalf of a patient. Tracks which user created the entry.

## 005_photo.sql
Adds `photo_url` column to entries for meal photos.

**Manual step required — Supabase Storage:**
1. Go to Storage → New bucket → name it `entry-photos` → enable Public
2. In the bucket, go to Policies → New policy → For full customization:
   - Name: `Users manage own photos`
   - Operations: SELECT, INSERT, UPDATE, DELETE
   - Target roles: `authenticated`
   - USING expression: `(storage.foldername(name))[1] = auth.uid()::text`
   - WITH CHECK expression: `(storage.foldername(name))[1] = auth.uid()::text`

## 006_delete_account_fn.sql
Creates the `delete_user_account()` Postgres function. Called from the app when a user deletes their account from Settings → Data & Privacy. Cascades through all user data and removes the auth record.

## 007_audit_log.sql
Creates the `audit_log` table. Tracks key events:
- `entry.create` / `entry.soft_delete` / `entry.restore` / `entry.hard_delete`
- `entries.view` — when a caregiver loads a patient's journal
- `note.create` / `note.share` / `note.hide` / `note.delete`

Query example:
```sql
SELECT action, count(*), date_trunc('day', created_at) as day
FROM audit_log
GROUP BY action, day
ORDER BY day DESC, count DESC;
```

## 008_soft_delete.sql
Adds `deleted_at` column to entries and creates `purge_old_deleted_entries()` function. Entries are soft-deleted (deleted_at set) rather than hard-deleted, giving a 30-day recovery window. The purge function is called on every login to clean up entries older than 30 days.

## 009_sessions.sql
Creates the `sessions` table. Records device type, OS, browser, and raw user agent on every sign-in. Useful for understanding which platforms to prioritize.

Query example:
```sql
SELECT browser, os, device_type, count(*)
FROM sessions
GROUP BY browser, os, device_type
ORDER BY count DESC;
```

---

## Setting up a fresh Supabase project

1. Run migrations 001–009 in order
2. In Authentication → Settings → disable email confirmation
3. Complete the manual Storage setup from migration 005
4. Add environment variables to Vercel:
   - `VITE_SUPABASE_URL` — your project URL
   - `VITE_SUPABASE_ANON_KEY` — your anon/public key
5. In Supabase → Project Settings → General → disable auto-pause
