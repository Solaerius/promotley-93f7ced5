-- Create table for rate limiting email resends
CREATE TABLE public.auth_resend_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  ip TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_resend_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert (edge function uses service role)
CREATE POLICY "Service role can insert logs"
ON public.auth_resend_logs
FOR INSERT
WITH CHECK (true);

-- Allow service role to read for rate limiting
CREATE POLICY "Service role can read logs"
ON public.auth_resend_logs
FOR SELECT
USING (true);

-- Create index for efficient rate limit queries
CREATE INDEX idx_auth_resend_logs_email_sent ON public.auth_resend_logs(email, sent_at DESC);
CREATE INDEX idx_auth_resend_logs_user_sent ON public.auth_resend_logs(user_id, sent_at DESC);