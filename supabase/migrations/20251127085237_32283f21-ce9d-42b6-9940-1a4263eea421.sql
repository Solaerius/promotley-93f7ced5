-- Skapa tabell för live chat sessioner med status
CREATE TABLE IF NOT EXISTS public.live_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  closed_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.live_chat_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create sessions
CREATE POLICY "Admins can create sessions"
ON public.live_chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update sessions (close them)
CREATE POLICY "Admins can update sessions"
ON public.live_chat_sessions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role full access to sessions"
ON public.live_chat_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index för snabbare queries
CREATE INDEX idx_live_chat_sessions_session_id ON public.live_chat_sessions(session_id);
CREATE INDEX idx_live_chat_sessions_status ON public.live_chat_sessions(status);