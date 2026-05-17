CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own audit records" ON audit_log FOR SELECT USING (actor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Authenticated users insert audit records" ON audit_log FOR INSERT WITH CHECK (actor_id = auth.uid());
GRANT SELECT, INSERT ON audit_log TO authenticated;
