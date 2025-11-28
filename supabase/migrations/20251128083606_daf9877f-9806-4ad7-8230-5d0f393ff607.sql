-- Add plan management columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS renewal_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');

-- Create ai_knowledge table for UF rules and documentation
CREATE TABLE IF NOT EXISTS public.ai_knowledge (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_knowledge
ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to ai_knowledge
CREATE POLICY "Service role full access to ai_knowledge"
ON public.ai_knowledge
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read ai_knowledge
CREATE POLICY "Authenticated users can read ai_knowledge"
ON public.ai_knowledge
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('promotley_knowledgebase', 'promotley_knowledgebase', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for knowledge bucket
CREATE POLICY "Authenticated users can read knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotley_knowledgebase' AND auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage knowledge files"
ON storage.objects FOR ALL
USING (bucket_id = 'promotley_knowledgebase');

-- Add comment on users columns
COMMENT ON COLUMN public.users.credits_used IS 'Number of AI credits used this month';
COMMENT ON COLUMN public.users.max_credits IS 'Maximum credits per month based on plan';
COMMENT ON COLUMN public.users.renewal_date IS 'Date when credits reset';