
-- Remove the broad org member policy (still exposes all columns)
DROP POLICY IF EXISTS "Org members can view other org members via view" ON public.users;

-- Drop the view (not needed with RPC approach)
DROP VIEW IF EXISTS public.users_org_visible;

-- Create a SECURITY DEFINER function that returns only id, email, avatar_url
-- for members of a given organization
CREATE OR REPLACE FUNCTION public.get_org_member_profiles(_org_id uuid)
RETURNS TABLE(id uuid, email text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.avatar_url
  FROM public.users u
  JOIN public.organization_members om ON om.user_id = u.id
  WHERE om.organization_id = _org_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
        AND organization_id = _org_id
    )
$$;
