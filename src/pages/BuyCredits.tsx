import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertCircle, CreditCard, Shield, Lock, Zap } from "lucide-react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const creditPackages: Record<string, { name: string; price: string; credits: string }> = {
  mini: { name: "Mini", price: "9", credits: "10" },
  small: { name: "Small", price: "19", credits: "25" },
  medium: { name: "Medium", price: "35", credits: "50" },
  large: { name: "Large", price: "59", credits: "100" },
};

const BuyCredits = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const packageId = searchParams.get("package") || "mini";
  const selectedPackage = creditPackages[packageId] || creditPackages.mini;

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: t('credits.login_first_title'),
            description: t('credits.login_first_desc'),
            variant: "destructive",
          });
          navigate("/auth?redirect=/buy-credits?package=" + packageId);
          return;
        }

        const accessToken = session.access_token;

        // Fetch Stripe publishable key
        const { data: configData, error: configError } = await supabase.functions.invoke('billing', {
          body: { route: 'config' }
        });

        if (configError || !configData?.publishableKey) {
          setError(t('credits.stripe_not_configured'));
          setLoading(false);
          return;
        }

        const stripeP = loadStripe(configData.publishableKey);
        setStripePromise(stripeP);

        // Create credits checkout session
        const successUrl = `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&type=credits`;
        const cancelUrl = `${window.location.origin}/buy-credits?cancelled=true`;

        const { data, error: invokeError } = await supabase.functions.invoke('billing', {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: {
            route: 'create-credits-checkout',
            packageId,
            userId: session.user.id,
            successUrl,
            cancelUrl,
          }
        });

        if (invokeError) {
          throw new Error(invokeError.message || t('credits.start_payment_error'));
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(t('credits.no_session_error'));
        }

      } catch (err: any) {
        console.error('Credits checkout init error:', err);
        setError(err.message || t('credits.start_payment_retry'));
        toast({
          title: t('credits.error_title'),
          description: err.message || t('credits.start_payment_retry'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [packageId, navigate, toast]);

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
            <p className="text-muted-foreground">{t('credits.preparing')}</p>
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
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('credits.back_to_settings')}
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
            onClick={() => navigate("/settings")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('credits.back')}
          </Button>

          <div className="grid md:grid-cols-5 gap-6 md:gap-8">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card className="p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">{t('credits.order_summary')}</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        {selectedPackage.name} {t('credits.credit_package')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPackage.credits} {t('credits.ai_credits')}
                      </p>
                    </div>
                    <p className="font-bold">{selectedPackage.price} kr</p>
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('credits.price')}</span>
                      <span>{selectedPackage.price} kr</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('credits.vat')}</span>
                      <span>{(parseFloat(selectedPackage.price) * 0.25).toFixed(0)} kr</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>{t('credits.total')}</span>
                      <span>{(parseFloat(selectedPackage.price) * 1.25).toFixed(0)} kr</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>{t('credits.secure_stripe')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>{t('credits.one_time')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>{t('credits.data_encrypted')}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="md:col-span-3">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('credits.payment_heading')}
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
                    <p className="text-muted-foreground">{t('credits.loading_form')}</p>
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

export default BuyCredits;
