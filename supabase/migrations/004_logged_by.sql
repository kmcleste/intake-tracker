ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS logged_by uuid REFERENCES auth.users(id);
