-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'inactive',
  plan text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all stripe subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage stripe subscriptions"
  ON public.stripe_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create organization_profiles table
CREATE TABLE IF NOT EXISTS public.organization_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  industry text,
  website text,
  city text,
  target_audience text,
  unique_properties text,
  tone text,
  goals text,
  instagram_handle text,
  tiktok_handle text,
  facebook_page text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.organization_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org profiles"
  ON public.organization_profiles FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert org profiles"
  ON public.organization_profiles FOR INSERT
  WITH CHECK (public.get_org_role(auth.uid(), organization_id) IN ('founder', 'admin'));

CREATE POLICY "Org admins can update org profiles"
  ON public.organization_profiles FOR UPDATE
  USING (public.get_org_role(auth.uid(), organization_id) IN ('founder', 'admin'));