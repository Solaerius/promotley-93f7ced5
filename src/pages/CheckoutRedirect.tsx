import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const CheckoutRedirect = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get("plan");
  const pkg = searchParams.get("package");
  const type = searchParams.get("type");

  useEffect(() => {
    const startCheckout = async () => {
      const planKey = plan || pkg;
      const purchaseType = type === "plan" ? "subscription" : "one_time";

      if (!planKey) {
        setError(t('checkout_redirect.invalid_link'));
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("billing", {
          body: { planKey, type: purchaseType },
        });

        if (fnError || !data?.url) {
          console.error("Checkout error:", fnError);
          setError(t('checkout_redirect.error_desc'));
          return;
        }

        window.location.href = data.url;
      } catch (err) {
        console.error("Checkout error:", err);
        setError(t('checkout_redirect.error_desc'));
      }
    };

    startCheckout();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-white">{t('checkout_redirect.error_title')}</h1>
          <p className="text-white/70">{error}</p>
          <Link to="/pricing">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              {t('checkout_redirect.back_to_pricing')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
        <p className="text-white/70">{t('checkout_redirect.preparing')}</p>
      </div>
    </div>
  );
};

export default CheckoutRedirect;
