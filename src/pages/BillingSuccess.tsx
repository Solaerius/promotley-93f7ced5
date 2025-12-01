import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";

const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/pricing");
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8 md:p-12">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center">
              <Check className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Välkommen till Promotely Pro! 🎉
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Ditt paket är nu aktivt och du kan börja använda alla funktioner direkt.
            </p>

            <div className="bg-muted/50 p-6 rounded-lg mb-8 text-left space-y-3">
              <h3 className="font-semibold mb-3">Vad händer nu?</h3>
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                onClick={() => navigate("/settings")}
              >
                Hantera paket
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;
