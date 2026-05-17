ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS wellbeing smallint CHECK (wellbeing BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS symptoms  text[]   NOT NULL DEFAULT '{}';
