import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export default function VerifyEmail() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Get masked email
  const maskedEmail = user?.email
    ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "";

  // Check if already verified
  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check for stored countdown
  useEffect(() => {
    const storedCountdown = localStorage.getItem("verifyEmailCountdown");
    const storedTime = localStorage.getItem("verifyEmailCountdownTime");
    
    if (storedCountdown && storedTime) {
      const elapsed = Math.floor((Date.now() - parseInt(storedTime)) / 1000);
      const remaining = parseInt(storedCountdown) - elapsed;
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        localStorage.removeItem("verifyEmailCountdown");
        localStorage.removeItem("verifyEmailCountdownTime");
      }
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isResending || !user?.email) return;

    setIsResending(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("send-verification", {
        headers: currentSession?.access_token 
          ? { Authorization: `Bearer ${currentSession.access_token}` }
          : {},
        body: { email: user.email },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send");
      }

      const data = response.data;

      if (data.error === "rate_limited") {
        const retryAfter = data.retry_after || 60;
        setCountdown(retryAfter);
        localStorage.setItem("verifyEmailCountdown", String(retryAfter));
        localStorage.setItem("verifyEmailCountdownTime", String(Date.now()));
        
        toast({
          title: "Vänta lite",
          description: `Du kan skicka en ny länk om ${retryAfter} sekunder.`,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Start 60s countdown
      setCountdown(60);
      localStorage.setItem("verifyEmailCountdown", "60");
      localStorage.setItem("verifyEmailCountdownTime", String(Date.now()));

      toast({
        title: "E-post skickad!",
        description: "Kolla din inkorg för verifieringslänken.",
      });

    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Kunde inte skicka",
        description: error.message || "Försök igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, user?.email, toast]);

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@") || isChangingEmail) return;

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;

      toast({
        title: "E-post uppdaterad",
        description: "En verifieringslänk har skickats till din nya adress.",
      });
      
      setShowChangeEmail(false);
      setNewEmail("");
      setCountdown(60);
      localStorage.setItem("verifyEmailCountdown", "60");
      localStorage.setItem("verifyEmailCountdownTime", String(Date.now()));

    } catch (error: any) {
      toast({
        title: "Kunde inte ändra e-post",
        description: error.message || "Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifiera din e-post</CardTitle>
          <CardDescription className="text-base">
            Vi har skickat en verifieringslänk till{" "}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Kolla din inkorg och klicka på länken för att aktivera ditt konto.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Länken är giltig i 24 timmar.
              </p>
            </div>
          </div>

          {/* Resend Button */}
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="w-full"
              variant={countdown > 0 ? "outline" : "default"}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Skickar...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Skicka igen om {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Skicka ny länk
                </>
              )}
            </Button>

            {/* Status message */}
            <p 
              className="text-xs text-center text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {countdown > 0 
                ? "Du kan snart skicka en ny länk"
                : "Fick du inget mejl? Kolla skräpposten eller skicka igen."}
            </p>
          </div>

          {/* Change Email Section */}
          {!showChangeEmail ? (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowChangeEmail(true)}
            >
              Byt e-postadress
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <Label htmlFor="new-email">Ny e-postadress</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="ny@email.se"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowChangeEmail(false);
                    setNewEmail("");
                  }}
                >
                  Avbryt
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleChangeEmail}
                  disabled={!newEmail.includes("@") || isChangingEmail}
                >
                  {isChangingEmail ? "Uppdaterar..." : "Uppdatera"}
                </Button>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSignOut}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Logga ut och gå tillbaka
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
