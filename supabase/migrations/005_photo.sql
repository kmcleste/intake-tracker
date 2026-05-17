-- After running this migration, create a Storage bucket named "entry-photos" in the
-- Supabase dashboard with public access enabled.
-- Add this RLS policy to the bucket:
--   Policy name: Users can manage own photos
--   Allowed operations: SELECT, INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS photo_url text;
