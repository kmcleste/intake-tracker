-- Run after 001_initial.sql

CREATE TABLE IF NOT EXISTS caregiver_links (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_email   TEXT        NOT NULL,
  caregiver_email TEXT        NOT NULL,
  caregiver_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, caregiver_email)
);

CREATE TABLE IF NOT EXISTS caregiver_notes (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id           UUID        NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  caregiver_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note               TEXT        NOT NULL,
  visible_to_patient BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: caregiver_links
ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

-- Patients manage their own links
CREATE POLICY "patients_manage_links" ON caregiver_links
  FOR ALL USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

-- Caregivers see and update links where they are the caregiver (active) or invited (pending by email)
CREATE POLICY "caregivers_read_active_links" ON caregiver_links
  FOR SELECT USING (caregiver_id = auth.uid());

CREATE POLICY "caregivers_accept_pending_links" ON caregiver_links
  FOR SELECT USING (status = 'pending' AND caregiver_email = (auth.jwt()->>'email'));

CREATE POLICY "caregivers_update_links" ON caregiver_links
  FOR UPDATE USING (caregiver_email = (auth.jwt()->>'email') AND status = 'pending');

-- RLS: allow caregivers to read their patients' entries
CREATE POLICY "caregivers_read_patient_entries" ON entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_links.patient_id = entries.user_id
        AND caregiver_links.caregiver_id = auth.uid()
        AND caregiver_links.status = 'active'
    )
  );

-- RLS: caregiver_notes
ALTER TABLE caregiver_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregivers_manage_notes" ON caregiver_notes
  FOR ALL USING (caregiver_id = auth.uid()) WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "patients_read_visible_notes" ON caregiver_notes
  FOR SELECT USING (patient_id = auth.uid() AND visible_to_patient = true);

-- Indexes
CREATE INDEX caregiver_links_patient_idx   ON caregiver_links (patient_id);
CREATE INDEX caregiver_links_caregiver_idx ON caregiver_links (caregiver_id);
CREATE INDEX caregiver_notes_entry_idx     ON caregiver_notes (entry_id);
CREATE INDEX caregiver_notes_patient_idx   ON caregiver_notes (patient_id, visible_to_patient);
