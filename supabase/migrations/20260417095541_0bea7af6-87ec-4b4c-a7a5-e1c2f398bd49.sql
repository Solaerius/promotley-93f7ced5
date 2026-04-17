-- Fix 1: Restrict knowledge bucket storage policy to service_role only
DROP POLICY IF EXISTS "Service role can manage knowledge files" ON storage.objects;
CREATE POLICY "Service role can manage knowledge files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id IN ('promotley_knowledgebase', 'promotley-knowledgebase'))
WITH CHECK (bucket_id IN ('promotley_knowledgebase', 'promotley-knowledgebase'));

-- Fix 2: Restrict organization_invites SELECT - remove the broad "by code" policy
-- Lookup by invite code should go through a SECURITY DEFINER function or edge function
DROP POLICY IF EXISTS "Authenticated users can view pending invites by code" ON public.organization_invites;

-- Allow invited users to see invites addressed to their email
CREATE POLICY "Users can view invites addressed to their email"
ON public.organization_invites
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND expires_at > now()
  AND email IS NOT NULL
  AND lower(email) = lower((SELECT auth.jwt() ->> 'email'))
);

-- SECURITY DEFINER lookup function for invite-code redemption flow
CREATE OR REPLACE FUNCTION public.lookup_invite_by_code(_invite_code text)
RETURNS TABLE(id uuid, organization_id uuid, organization_name text, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.organization_id, o.name AS organization_name, oi.expires_at
  FROM public.organization_invites oi
  JOIN public.organizations o ON o.id = oi.organization_id
  WHERE oi.invite_code = _invite_code
    AND oi.status = 'pending'
    AND oi.expires_at > now()
  LIMIT 1;
$$;

-- Fix 3: Scope live_chat realtime policies to session owner / admin
DROP POLICY IF EXISTS "Users can subscribe to live chat" ON realtime.messages;
DROP POLICY IF EXISTS "Users can publish to live chat" ON realtime.messages;
DROP POLICY IF EXISTS "Allow live chat subscription" ON realtime.messages;
DROP POLICY IF EXISTS "Allow live chat broadcast" ON realtime.messages;

CREATE POLICY "Live chat: only session owner or admin can subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'live_chat_%'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.live_chat_sessions s
      WHERE s.session_id::text = substring(realtime.topic() FROM 'live_chat_(.+)')
        AND s.session_id = auth.uid()
    )
  )
);

CREATE POLICY "Live chat: only session owner or admin can publish"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'live_chat_%'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.live_chat_sessions s
      WHERE s.session_id::text = substring(realtime.topic() FROM 'live_chat_(.+)')
        AND s.session_id = auth.uid()
    )
  )
);

-- Fix 4: Add owner-readable SELECT policy on tokens table
CREATE POLICY "Users can view own tokens"
ON public.tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);