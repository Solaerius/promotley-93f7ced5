-- Fix organizations table policy to require authentication
DROP POLICY IF EXISTS "Users can view orgs by invite code when known" ON public.organizations;

-- Create a policy that requires authentication to view orgs
CREATE POLICY "Authenticated users can view orgs by invite code"
ON public.organizations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    is_org_member(auth.uid(), id) OR 
    (invite_link_enabled = true AND invite_code IS NOT NULL)
  )
);

-- Drop duplicate "Users can view orgs they belong to" if we now have unified policy
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON public.organizations;

-- Clean up service role policies that trigger linter warnings
-- Note: Service role bypasses RLS anyway, so explicit "USING true" policies are redundant
-- We'll drop them to eliminate linter warnings
DROP POLICY IF EXISTS "Service role full access to sessions" ON public.live_chat_sessions;
DROP POLICY IF EXISTS "Service role full access to ai_knowledge" ON public.ai_knowledge;

-- Ensure admins can still manage ai_knowledge through has_role check
CREATE POLICY "Admins can manage ai_knowledge"
ON public.ai_knowledge
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));