
CREATE OR REPLACE FUNCTION public.soft_delete_user_account(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure caller is deleting their own account OR is admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;

  -- Mark user as deleted with 30-day grace period
  UPDATE public.users
  SET deleted_at = now(),
      deletion_scheduled_at = now() + interval '30 days'
  WHERE id = _user_id;
  
  -- Anonymize connections (keep for audit but remove identifiable info)
  UPDATE public.connections
  SET username = 'deleted_user_' || LEFT(id::text, 8)
  WHERE user_id = _user_id;
  
  -- Mark tokens for deletion (keep encrypted tokens for security audit)
  UPDATE public.tokens
  SET updated_at = now()
  WHERE user_id = _user_id;
END;
$$;
