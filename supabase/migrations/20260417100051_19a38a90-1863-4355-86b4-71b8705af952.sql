-- Fix privilege escalation in organization_members INSERT
DROP POLICY IF EXISTS "Founders and admins can insert members" ON public.organization_members;

CREATE POLICY "Founders and admins can insert members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Founders/admins can add any user to their org
    get_org_role(auth.uid(), organization_id) = ANY (ARRAY['founder'::text, 'admin'::text])
    -- Or a user can add themselves IF they have a valid pending invite
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.organization_invites oi
        WHERE oi.organization_id = organization_members.organization_id
          AND oi.status = 'pending'
          AND oi.expires_at > now()
          AND (
            -- Either the invite is addressed to their email
            (oi.email IS NOT NULL AND lower(oi.email) = lower((SELECT auth.jwt() ->> 'email')))
            -- Or there's an active invite_code (link-based join, validated by edge function)
            OR oi.invite_code IS NOT NULL
          )
      )
    )
  )
);