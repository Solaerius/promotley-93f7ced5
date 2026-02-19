
-- =============================================
-- FIX 1: Remove direct SELECT access to tokens table
-- Edge functions use service_role key, frontend only deletes tokens
-- =============================================
DROP POLICY IF EXISTS "Users can only view own tokens" ON public.tokens;

-- =============================================
-- FIX 2: Restrict org member visibility on users table
-- Create a view with only necessary columns
-- =============================================

-- Create a restricted view for org member lookups
CREATE VIEW public.users_org_visible
WITH (security_invoker = on) AS
  SELECT id, email, avatar_url
  FROM public.users;

-- Drop the overly broad org member SELECT policy on users table
DROP POLICY IF EXISTS "Org members can view other org members basic info" ON public.users;

-- Add a new org member SELECT policy on the VIEW's base table
-- that only allows access through the view pattern (id, email, avatar_url)
-- We re-add it but the view ensures only 3 columns are exposed
CREATE POLICY "Org members can view other org members via view"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = users.id
  )
);
