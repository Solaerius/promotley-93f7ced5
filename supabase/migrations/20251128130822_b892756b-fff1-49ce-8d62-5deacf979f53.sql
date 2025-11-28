-- Add scopes column to tokens table to store granted OAuth scopes
ALTER TABLE public.tokens
ADD COLUMN IF NOT EXISTS scopes text;

COMMENT ON COLUMN public.tokens.scopes IS 'Comma-separated list of granted OAuth scopes (e.g., user.info.basic,video.list)';