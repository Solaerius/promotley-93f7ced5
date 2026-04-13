import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Loader2, CheckCircle2, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const RedeemPromotion = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");
  const [creditsGiven, setCreditsGiven] = useState(0);

  const redeem = async () => {
    if (!user) {
      navigate(`/auth?redirect=/promo/${code}`);
      return;
    }
    setStatus("loading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("redeem-promotion", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { code },
      });
      if (error || data?.error) {
        setStatus("error");
        setMessage(data?.error || error?.message || "Något gick fel");
      } else {
        setStatus("success");
        setCreditsGiven(data.credits_given);
        setMessage(`Du fick ${data.credits_given} gratiskrediter!`);
      }
    } catch {
      setStatus("error");
      setMessage(t('toasts.could_not_redeem'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <Card className="w-full max-w-sm p-8 text-center shadow-elegant">
        <img src={logo} alt="Promotley" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Promotionskod</h1>
        <p className="text-lg font-mono font-bold text-primary mb-6">{code?.toUpperCase()}</p>

        {status === "idle" && (
          <Button variant="gradient" size="lg" className="w-full" onClick={redeem}>
            <Gift className="w-5 h-5 mr-2" />
            {user ? "Lös in" : "Logga in för att lösa in"}
          </Button>
        )}
        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Löser in...</span>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">{message}</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">Gå till Dashboard</Button>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{message}</p>
            <Button variant="outline" onClick={() => setStatus("idle")} className="w-full">Försök igen</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RedeemPromotion;
