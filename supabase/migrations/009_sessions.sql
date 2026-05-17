CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_agent text,
  device_type text,
  os text,
  browser text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

GRANT SELECT, INSERT ON sessions TO authenticated;
