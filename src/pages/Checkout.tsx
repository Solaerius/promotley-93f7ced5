import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertCircle, CreditCard, Shield, Lock } from "lucide-react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const planDetails: Record<string, { name: string; price: string; credits: string; lookupKey: string }> = {
  starter: { name: "UF Starter", price: "29", credits: "50", lookupKey: "starter_monthly_sek" },
  growth: { name: "UF Growth", price: "49", credits: "100", lookupKey: "growth_monthly_sek" },
  pro: { name: "UF Pro", price: "99", credits: "300", lookupKey: "pro_monthly_sek" },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const plan = searchParams.get("plan") || "starter";
  const selectedPlan = planDetails[plan] || planDetails.starter;

  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Logga in först",
            description: "Du måste vara inloggad för att köpa ett paket.",
            variant: "destructive",
          });
          navigate("/auth?redirect=/checkout?plan=" + plan);
          return;
        }

        const accessToken = session.access_token;
        setUserId(session.user.id);

        // Fetch Stripe publishable key from server (public endpoint)
        const { data: configData, error: configError } = await supabase.functions.invoke('billing', {
          body: { route: 'config' }
        });

        if (configError || !configData?.publishableKey) {
          console.error('Config error:', configError, configData);
          setError("Stripe är inte konfigurerat. Kontakta administratören.");
          setLoading(false);
          return;
        }

        // Initialize Stripe with the key from server
        const stripeP = loadStripe(configData.publishableKey);
        setStripePromise(stripeP);

        // Create checkout session with JWT auth
        const successUrl = `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/pricing?cancelled=true`;

        const { data, error: invokeError } = await supabase.functions.invoke('billing', {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: {
            route: 'create-checkout-session',
            plan,
            planLookupKey: selectedPlan.lookupKey,
            userId: session.user.id,
            successUrl,
            cancelUrl,
          }
        });

        if (invokeError) {
          console.error('Checkout error:', invokeError);
          throw new Error(invokeError.message || 'Kunde inte starta betalning');
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data?.checkoutUrl) {
          // Fallback to hosted checkout if embedded not available
          window.location.href = data.checkoutUrl;
          return;
        } else {
          throw new Error('Ingen checkout-session skapad');
        }

      } catch (err: any) {
        console.error('Checkout init error:', err);
        setError(err.message || 'Ett fel uppstod vid betalning');
        toast({
          title: "Fel",
          description: err.message || "Kunde inte starta betalning. Försök igen.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [plan, navigate, toast, selectedPlan.lookupKey]);

  // Handle checkout completion
  const onComplete = useCallback(() => {
    // EmbeddedCheckout handles redirect via return_url
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Förbereder betalning...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => navigate("/pricing")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till priser
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till priser
          </Button>

          <div className="grid md:grid-cols-5 gap-6 md:gap-8">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card className="p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Din beställning</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{selectedPlan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.credits} AI-krediter/månad
                      </p>
                    </div>
                    <p className="font-bold">{selectedPlan.price} kr</p>
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pris per månad</span>
                      <span>{selectedPlan.price} kr</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Moms (25%)</span>
                      <span>{(parseFloat(selectedPlan.price) * 0.25).toFixed(0)} kr</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Totalt</span>
                      <span>{(parseFloat(selectedPlan.price) * 1.25).toFixed(0)} kr/mån</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Säker betalning via Stripe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Avsluta när du vill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>Dina uppgifter är krypterade</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="md:col-span-3">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Betalning
                </h2>

                {clientSecret && stripePromise ? (
                  <div className="stripe-checkout-container">
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{ clientSecret, onComplete }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Laddar betalningsformulär...</p>
                  </div>
                )}
              </Card>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Genom att fortsätta godkänner du våra{" "}
                <a href="/terms-of-service" className="underline hover:text-primary">
                  användarvillkor
                </a>{" "}
                och{" "}
                <a href="/privacy-policy" className="underline hover:text-primary">
                  integritetspolicy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
