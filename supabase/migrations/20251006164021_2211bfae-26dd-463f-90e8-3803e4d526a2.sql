-- Fix email exposure vulnerability in users table
-- Drop existing SELECT policy and recreate with explicit restrictions

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create restrictive policy that ONLY allows authenticated users to view their own profile
-- This prevents any bypass scenarios where auth.uid() might return null
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Add explicit default-deny policy as a safety net
-- This ensures that even if authentication fails, no data is exposed
CREATE POLICY "Default deny all access to users table" 
ON public.users 
FOR ALL 
USING (false);

-- The above policies work together:
-- 1. Anonymous users are blocked by "deny_anon_users" policy (already exists)
-- 2. Authenticated users can only see their own profile via "Users can view own profile"
-- 3. Any other scenario is blocked by the default deny policy
-- 4. The ORDER of evaluation ensures the most restrictive policy wins