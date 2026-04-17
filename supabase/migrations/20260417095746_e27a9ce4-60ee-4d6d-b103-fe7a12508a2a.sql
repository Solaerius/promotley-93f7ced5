-- Recreate the broad realtime policies WITHOUT the live_chat_% clause.
-- The dedicated session-scoped live_chat policies (added earlier) handle that case.

DROP POLICY IF EXISTS "Users can subscribe to own notification channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() = 'notifications-realtime'
    AND EXISTS (SELECT 1 FROM public.notifications n WHERE n.user_id = auth.uid())
  )
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('chat:' || auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can send to own scoped channels" ON realtime.messages;
CREATE POLICY "Users can send to own scoped channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('chat:' || auth.uid()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
);