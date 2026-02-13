-- Analytics events table for tracking key user actions
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own events
CREATE POLICY "Users can view own events"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
  ON public.analytics_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast querying
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);