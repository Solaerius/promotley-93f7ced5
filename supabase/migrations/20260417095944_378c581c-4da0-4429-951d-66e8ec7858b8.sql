-- 1) Add owner column to live_chat_sessions (nullable for anonymous chats)
ALTER TABLE public.live_chat_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_user_id ON public.live_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_session_id ON public.live_chat_sessions(session_id);

-- 2) Allow session owners to view & update their own sessions
DROP POLICY IF EXISTS "Session owners can view their sessions" ON public.live_chat_sessions;
CREATE POLICY "Session owners can view their sessions"
ON public.live_chat_sessions
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Allow setting user_id on insert (already covered by existing INSERT policy)
DROP POLICY IF EXISTS "Authenticated users can create chat sessions" ON public.live_chat_sessions;
CREATE POLICY "Authenticated users can create chat sessions"
ON public.live_chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Owners can update their own sessions (e.g. mark closed)
DROP POLICY IF EXISTS "Session owners can update their sessions" ON public.live_chat_sessions;
CREATE POLICY "Session owners can update their sessions"
ON public.live_chat_sessions
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid())
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- 3) Add SELECT policy on live_chat_messages for session owners
DROP POLICY IF EXISTS "Session owners can view their messages" ON public.live_chat_messages;
CREATE POLICY "Session owners can view their messages"
ON public.live_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.live_chat_sessions s
    WHERE s.session_id = live_chat_messages.session_id
      AND s.user_id IS NOT NULL
      AND s.user_id = auth.uid()
  )
);

-- 4) Fix the realtime live_chat policies: check session OWNER (user_id), not session_id
DROP POLICY IF EXISTS "Live chat: only session owner or admin can subscribe" ON realtime.messages;
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
        AND s.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Live chat: only session owner or admin can publish" ON realtime.messages;
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
        AND s.user_id = auth.uid()
    )
  )
);

-- 5) Tighten the notifications realtime policy: drop the shared 'notifications-realtime' topic.
-- Notifications use postgres_changes which respects the notifications table RLS,
-- so this topic is not actually needed.
DROP POLICY IF EXISTS "Users can subscribe to own notification channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('chat:' || auth.uid()::text)
);