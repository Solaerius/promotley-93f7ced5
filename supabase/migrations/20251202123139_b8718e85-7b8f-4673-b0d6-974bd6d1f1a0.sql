-- Step 1: Add new enum values first
ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'growth';