-- Skapa enum för providers
CREATE TYPE public.social_provider AS ENUM ('meta_ig', 'meta_fb', 'tiktok');

-- Skapa connections-tabell för anslutna sociala konton
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider public.social_provider NOT NULL,
  account_id TEXT NOT NULL,
  username TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, provider, account_id)
);

-- Skapa tokens-tabell för krypterade OAuth-tokens
CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider public.social_provider NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, provider)
);

-- Skapa metrics-tabell för statistik från plattformar
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  provider public.social_provider NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  period TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies för connections
CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies för tokens (extra strikta - endast backend ska läsa)
CREATE POLICY "No direct token access"
  ON public.tokens FOR SELECT
  TO authenticated
  USING (false);

-- RLS policies för metrics
CREATE POLICY "Users can view own metrics"
  ON public.metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own metrics"
  ON public.metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger för tokens updated_at
CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();