
-- Step 3: Promotion system tables
CREATE TABLE public.promotion_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  credits_amount INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promotion_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promotion_links" ON public.promotion_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES public.promotion_links(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promotion_id, user_id)
);

ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view redemptions" ON public.promotion_redemptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own redemptions" ON public.promotion_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own redemptions" ON public.promotion_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Step 5: Email preferences
ALTER TABLE public.users ADD COLUMN email_newsletter BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN email_offers BOOLEAN DEFAULT true;
