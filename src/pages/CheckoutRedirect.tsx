import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const CheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get("plan");
  const pkg = searchParams.get("package");
  const type = searchParams.get("type"); // "plan" or "credits"

  useEffect(() => {
    const startCheckout = async () => {
      const planKey = plan || pkg;
      const purchaseType = type === "plan" ? "subscription" : "one_time";

      if (!planKey) {
        setError("Ogiltig betalningslänk. Välj ett paket från prissidan.");
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("billing", {
          body: { planKey, type: purchaseType },
        });

        if (fnError || !data?.url) {
          console.error("Checkout error:", fnError);
          setError("Något gick fel vid betalningen. Försök igen.");
          return;
        }

        window.location.href = data.url;
      } catch (err) {
        console.error("Checkout error:", err);
        setError("Något gick fel vid betalningen. Försök igen.");
      }
    };

    startCheckout();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-white">Något gick fel</h1>
          <p className="text-white/70">{error}</p>
          <Link to="/pricing">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Tillbaka till prissidan
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
        <p className="text-white/70">Förbereder betalning...</p>
      </div>
    </div>
  );
};

export default CheckoutRedirect;
