ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION purge_old_deleted_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM entries
  WHERE user_id = auth.uid()
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days';
END;
$$;
