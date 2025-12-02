-- Update the handle_new_user function to use 'starter' plan for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.users (id, email, plan, credits_left, max_credits, trial_used)
  VALUES (
    new.id,
    new.email,
    'starter',
    50,
    50,
    false
  );
  RETURN new;
END;
$function$;