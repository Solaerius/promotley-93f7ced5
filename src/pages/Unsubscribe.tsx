import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleUnsubscribe = async () => {
    setStatus("loading");
    // Update user email preferences directly - find by email
    const { error } = await supabase
      .from("users")
      .update({ email_newsletter: false, email_offers: false })
      .eq("email", email);
    
    setStatus("done");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <Card className="w-full max-w-sm p-8 text-center shadow-elegant">
        <img src={logo} alt="Promotley" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Avprenumerera</h1>

        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Vill du sluta ta emot mejl från Promotley till <strong>{email}</strong>?
            </p>
            <Button variant="destructive" className="w-full" onClick={handleUnsubscribe}>
              Ja, avprenumerera mig
            </Button>
          </div>
        )}
        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sparar...</span>
          </div>
        )}
        {status === "done" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Du har avprenumererats. Du kommer inte längre ta emot nyhetsbrev eller erbjudanden från oss.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
