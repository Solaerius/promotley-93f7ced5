-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Org members can view other org members basic info" ON public.users;

-- Create a permissive policy so org members can view each other
CREATE POLICY "Org members can view other org members basic info"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() 
      AND om2.user_id = users.id
  )
);