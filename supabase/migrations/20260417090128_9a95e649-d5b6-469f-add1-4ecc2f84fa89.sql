
-- 1) Add new plan value 'max' to user_plan enum
ALTER TYPE public.user_plan ADD VALUE IF NOT EXISTS 'max';

-- 2) credit_transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  function_name text NOT NULL,
  credits_used integer NOT NULL,
  model text,
  cost_usd numeric(10, 6),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created ON public.credit_transactions(user_id, created_at DESC);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit history"
ON public.credit_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts credit transactions"
ON public.credit_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3) ai_routing_log (admin only)
CREATE TABLE IF NOT EXISTS public.ai_routing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  function_name text NOT NULL,
  selected_model text NOT NULL,
  reasoning text,
  skills_injected text[],
  estimated_credits integer,
  actual_credits integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routing_log_created ON public.ai_routing_log(created_at DESC);
ALTER TABLE public.ai_routing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view routing logs"
ON public.ai_routing_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4) app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read app settings"
ON public.app_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage app settings"
ON public.app_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default USD->SEK rate (will be refreshed daily by edge function)
INSERT INTO public.app_settings (key, value)
VALUES ('usd_to_sek', '{"rate": 10.5, "fetched_at": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5) feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL,
  enabled_globally boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flag_key, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(flag_key);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read feature flags"
ON public.feature_flags FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage feature flags"
ON public.feature_flags FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default flags (all "coming soon" features start disabled)
INSERT INTO public.feature_flags (flag_key, enabled_globally, description) VALUES
  ('video_upload', false, 'Video-upload till TikTok/Meta'),
  ('video_ai_analysis', false, 'AI-analys av uppladdade videos'),
  ('auto_publish_meta', false, 'Auto-publicera till Instagram/Facebook'),
  ('auto_publish_tiktok', false, 'Auto-publicera till TikTok'),
  ('tiktok_sound_library', false, 'Sound-bibliotek från TikTok'),
  ('web_search_sales_radar', false, 'Webbsökning för Säljradar (Tavily)')
ON CONFLICT DO NOTHING;

-- 6) Helper function for feature flag checks
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_flag_key text, _user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- user-specific override wins
    (SELECT enabled_globally FROM public.feature_flags
     WHERE flag_key = _flag_key AND user_id = COALESCE(_user_id, auth.uid())
     LIMIT 1),
    -- fall back to global flag
    (SELECT enabled_globally FROM public.feature_flags
     WHERE flag_key = _flag_key AND user_id IS NULL
     LIMIT 1),
    false
  )
$$;

-- 7) updated_at trigger for feature_flags
CREATE TRIGGER feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
