-- Step 2: Update existing users to new plan names
UPDATE public.users SET plan = 'starter', credits_left = 50, max_credits = 50 WHERE plan = 'free_trial';
UPDATE public.users SET plan = 'growth', credits_left = 100, max_credits = 100 WHERE plan = 'pro';
UPDATE public.users SET plan = 'pro', credits_left = 300, max_credits = 300 WHERE plan IN ('pro_xl', 'pro_unlimited');