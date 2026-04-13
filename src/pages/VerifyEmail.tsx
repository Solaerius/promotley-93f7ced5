import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Email can come from logged-in user or from navigation state (after signup)
  const emailFromState = (location.state as { email?: string })?.email;
  const email = user?.email || emailFromState;

  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [verified, setVerified] = useState(false);

  // Get masked email
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "";

  // Redirect if no email to verify
  useEffect(() => {
    if (!email) {
      navigate("/auth", { replace: true });
    }
  }, [email, navigate]);

  // Check if already verified (only for logged in users)
  useEffect(() => {
    if (user?.email_confirmed_at) {
      const checkOnboarding = async () => {
        const { data: profile } = await supabase
          .from('ai_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();
        setVerified(true);
        setTimeout(() => {
          navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
        }, 2000);
      };
      checkOnboarding();
    }
  }, [user, navigate]);

  // Poll for session when user is null (post-signup: user is signed out until email click)
  useEffect(() => {
    if (user?.email_confirmed_at) return; // already handled above
    if (!email) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval);
        setVerified(true);
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('ai_profiles')
            .select('onboarding_completed')
            .eq('user_id', session.user.id)
            .single();
          navigate(profile?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, email, navigate]);

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
    if (countdown > 0 || isResending || !email) return;

    setIsResending(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("send-verification", {
        headers: currentSession?.access_token
          ? { Authorization: `Bearer ${currentSession.access_token}` }
          : {},
        body: { email },
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
        title: t('toasts.could_not_send_verification'),
        description: error.message || "Försök igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, email, toast]);

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
        title: t('toasts.could_not_change_email'),
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
        {verified ? (
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-green-600">{t('verify.verified')}</h2>
                <p className="text-muted-foreground mt-2">{t('verify.redirecting')}</p>
              </motion.div>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('verify.title')}</CardTitle>
              <CardDescription className="text-base">
                {t('verify.description')}{" "}
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
                      {t('verify.resend_wait', { seconds: countdown })}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('verify.resend')}
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

              {/* Change Email Section - only show if user is logged in */}
              {user && !showChangeEmail && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowChangeEmail(true)}
                >
                  Byt e-postadress
                </Button>
              )}
              {user && showChangeEmail && (
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

              {/* Back to Login / Sign Out */}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={user ? handleSignOut : () => navigate("/auth")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {user ? "Logga ut och gå tillbaka" : "Tillbaka till inloggning"}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
