
-- 1. Fix live_chat_messages INSERT policy: enforce sender_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.live_chat_messages;

CREATE POLICY "Users can insert their own messages"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (
  (sender_type = 'user' AND sender_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Fix organizations SELECT policy: restrict to members + lookup by specific invite code via RPC
DROP POLICY IF EXISTS "Authenticated users can view orgs by invite code" ON public.organizations;

CREATE POLICY "Members can view their orgs"
ON public.organizations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_org_member(auth.uid(), id)
);

-- Create a SECURITY DEFINER function for invite code lookups (returns only safe fields)
CREATE OR REPLACE FUNCTION public.lookup_org_by_invite_code(_invite_code text)
RETURNS TABLE(id uuid, name text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.logo_url
  FROM public.organizations o
  WHERE o.invite_code = _invite_code
    AND o.invite_link_enabled = true
    AND o.invite_code IS NOT NULL;
$$;

-- 3. Fix function search_path on email queue functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;
