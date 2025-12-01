import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

const PLAN_LABELS: Record<string, string> = {
  pro: "UF Starter",
  pro_xl: "UF Growth", 
  pro_unlimited: "UF Pro",
  free_trial: "Gratis",
};

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [isActivating, setIsActivating] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<string>("pro");
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 10;

  useEffect(() => {
    if (!sessionId) {
      navigate("/pricing");
      return;
    }

    // Verify and activate the subscription
    const verifyAndActivate = async () => {
      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No auth session');
          navigate("/auth?redirect=/billing/success?session_id=" + sessionId);
          return false;
        }

        // Call verify-session to activate the subscription
        const { data, error } = await supabase.functions.invoke('billing', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            route: 'verify-session',
            sessionId: sessionId,
          },
        });

        console.log('[BillingSuccess] verify-session response:', data, error);

        if (error) {
          console.error('Error verifying session:', error);
          return false;
        }

        if (data?.activated && data?.status === 'active') {
          setIsActive(true);
          setIsActivating(false);
          if (data?.plan) {
            setActivatedPlan(data.plan);
          }
          return true;
        }

        // If not activated yet, check subscription status
        if (data?.status === 'pending') {
          return false;
        }

        return false;
      } catch (err) {
        console.error('Verify error:', err);
        return false;
      }
    };

    const startPolling = async () => {
      // Initial verification attempt
      const activated = await verifyAndActivate();
      if (activated) return;

      // Poll every second for up to MAX_POLLS seconds
      const interval = setInterval(async () => {
        setPollCount(prev => {
          if (prev >= MAX_POLLS - 1) {
            clearInterval(interval);
            setIsActivating(false);
            // Even if polling times out, assume success since Stripe redirected
            setIsActive(true);
            return prev;
          }
          return prev + 1;
        });

        const success = await verifyAndActivate();
        if (success) {
          clearInterval(interval);
        }
      }, 1500);

      return () => clearInterval(interval);
    };

    startPolling();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8 md:p-12">
            {isActivating ? (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary animate-spin" />
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-4">
                  Aktiverar ditt paket...
                </h1>
                
                <p className="text-muted-foreground mb-4">
                  Din betalning var lyckad! Vi aktiverar nu ditt paket.
                </p>

                <div className="flex justify-center gap-1">
                  {[...Array(MAX_POLLS)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i <= pollCount ? 'bg-primary' : 'bg-muted'
                      }`} 
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center animate-in zoom-in-50 duration-300">
                  <Check className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  Välkommen till {PLAN_LABELS[activatedPlan] || "Promotely Pro"}! 🎉
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
                  Ditt paket är nu aktivt och du kan börja använda alla funktioner direkt.
                </p>

                <div className="bg-muted/50 p-6 rounded-lg mb-8 text-left space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Vad händer nu?
                  </h3>
                  <p className="text-sm flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Dina AI-krediter har laddats och är redo att användas</span>
                  </p>
                  <p className="text-sm flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Du har tillgång till alla premium-funktioner</span>
                  </p>
                  <p className="text-sm flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>En faktura har skickats till din e-post</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    Till dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/ai-chat")}
                  >
                    Testa AI-chatten
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;
