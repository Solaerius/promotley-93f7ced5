-- Fix: Restrict knowledge base storage access to organization members only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read knowledge files" ON storage.objects;

-- Create a more restrictive policy for organization members with active plans
CREATE POLICY "Org members can read knowledge files"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('promotley_knowledgebase', 'promotley-knowledgebase')
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND o.plan IN ('starter', 'growth', 'pro')
  )
);

-- Also ensure admins can always access
CREATE POLICY "Admins can read knowledge files"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('promotley_knowledgebase', 'promotley-knowledgebase')
  AND public.has_role(auth.uid(), 'admin')
);