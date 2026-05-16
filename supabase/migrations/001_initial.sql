-- Run this in the Supabase SQL editor for your project.

CREATE TABLE IF NOT EXISTS entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  meal        TEXT        NOT NULL,
  foods       TEXT        NOT NULL,
  notes       TEXT        NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  severity    INTEGER     CHECK (severity BETWEEN 1 AND 5)
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX entries_user_timestamp ON entries (user_id, timestamp DESC);
