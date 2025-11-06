-- Drop the existing unique constraint that includes account_id
ALTER TABLE public.connections 
DROP CONSTRAINT IF EXISTS connections_user_id_provider_account_id_key;

-- Add a new unique constraint on just user_id and provider
-- This allows upsert on these two columns and ensures one connection per provider per user
ALTER TABLE public.connections 
ADD CONSTRAINT connections_user_id_provider_key UNIQUE (user_id, provider);