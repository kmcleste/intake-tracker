CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM caregiver_notes WHERE caregiver_id = auth.uid() OR patient_id = auth.uid();
  DELETE FROM caregiver_links WHERE patient_id = auth.uid() OR caregiver_id = auth.uid();
  DELETE FROM entries WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
