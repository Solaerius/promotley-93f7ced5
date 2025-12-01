import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const planDetails: Record<string, { name: string; price: string; credits: string }> = {
  starter: { name: "UF Starter", price: "29", credits: "50" },
  growth: { name: "UF Growth", price: "49", credits: "100" },
  pro: { name: "UF Pro", price: "99", credits: "300" },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const plan = searchParams.get("plan") || "starter";
  const selectedPlan = planDetails[plan] || planDetails.starter;

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Logga in först",
          description: "Du måste vara inloggad för att köpa ett paket.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate, toast]);

  const handleCreateCheckout = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const successUrl = `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/pricing`;

      const { data, error } = await supabase.functions.invoke('billing/checkout', {
        method: 'POST',
        body: {
          plan,
          userId: session.user.id,
          successUrl,
          cancelUrl,
        }
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast({
        title: "Fel",
        description: "Kunde inte starta betalning. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till priser
          </Button>

          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-2">Bekräfta ditt val</h1>
            <p className="text-muted-foreground mb-8">
              Du är på väg att aktivera {selectedPlan.name}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.credits} AI-krediter per månad
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{selectedPlan.price} kr</p>
                  <p className="text-sm text-muted-foreground">per månad</p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p className="flex justify-between">
                  <span>Pris per månad:</span>
                  <span className="font-medium">{selectedPlan.price} kr</span>
                </p>
                <p className="flex justify-between">
                  <span>Moms (25%):</span>
                  <span className="font-medium">{(parseFloat(selectedPlan.price) * 0.25).toFixed(0)} kr</span>
                </p>
                <div className="border-t border-border pt-2 mt-2">
                  <p className="flex justify-between text-base font-bold">
                    <span>Totalt:</span>
                    <span>{(parseFloat(selectedPlan.price) * 1.25).toFixed(0)} kr/mån</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Avsluta när du vill</p>
                <p>✓ Säker betalning via Stripe</p>
                <p>✓ Faktura skickas via e-post</p>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleCreateCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Förbereder betalning...
                </>
              ) : (
                "Fortsätt till betalning"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Genom att fortsätta godkänner du våra{" "}
              <a href="/terms-of-service" className="underline">
                användarvillkor
              </a>{" "}
              och{" "}
              <a href="/privacy-policy" className="underline">
                integritetspolicy
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
