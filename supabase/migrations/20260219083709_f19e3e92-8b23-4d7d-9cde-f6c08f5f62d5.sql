
CREATE OR REPLACE FUNCTION public.redeem_promotion(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promo promotion_links;
  v_user_id UUID;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Ej autentiserad');
  END IF;

  -- Normalize code
  _code := UPPER(TRIM(_code));

  -- Lock promotion row to prevent concurrent access
  SELECT * INTO v_promo
  FROM promotion_links
  WHERE code = _code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Ogiltig kod');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('error', 'Denna kod är inte längre aktiv');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN jsonb_build_object('error', 'Koden har redan använts maximalt antal gånger');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Koden har gått ut');
  END IF;

  BEGIN
    INSERT INTO promotion_redemptions (promotion_id, user_id)
    VALUES (v_promo.id, v_user_id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('error', 'Du har redan använt denna kod');
  END;

  UPDATE users
  SET credits_left = credits_left + v_promo.credits_amount
  WHERE id = v_user_id;

  UPDATE promotion_links
  SET current_uses = current_uses + 1
  WHERE id = v_promo.id;

  RETURN jsonb_build_object('success', true, 'credits_given', v_promo.credits_amount);
END;
$function$;
