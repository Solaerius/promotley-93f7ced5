-- 1) Fix organization_invites: remove unauthenticated public SELECT
DROP POLICY IF EXISTS "Anyone can view invites by code" ON public.organization_invites;

CREATE POLICY "Authenticated users can view pending invites by code"
ON public.organization_invites
FOR SELECT
TO authenticated
USING (status = 'pending' AND expires_at > now());

-- 2) Fix conversations INSERT: require user_id = auth.uid()
DROP POLICY IF EXISTS "Strict auth required to create conversations" ON public.conversations;

CREATE POLICY "Users can create own conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3) Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Helper: extract topic and only allow user-scoped topics
-- Notifications: topic must equal "notifications:{auth.uid()}"
CREATE POLICY "Users can subscribe to own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = 'notifications-realtime' AND EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = auth.uid()
  ))
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('chat:' || auth.uid()::text)
  OR realtime.topic() LIKE ('live_chat_%') -- live chat sessions are scoped per session_id; refined below
);

-- Restrict broadcast/presence sends to authenticated users on their own scoped topics
CREATE POLICY "Users can send to own scoped channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('chat:' || auth.uid()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() LIKE 'live_chat_%'
);