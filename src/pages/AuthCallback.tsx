import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        if (error) {
          if (error === "access_denied" || errorDescription?.includes("expired")) {
            setStatus("expired");
            setErrorMessage("Verifieringslänken har gått ut.");
          } else {
            setStatus("error");
            setErrorMessage(errorDescription || "Ett fel uppstod vid verifieringen.");
          }
          return;
        }

        // Exchange code for session if present
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (exchangeError.message?.includes("expired")) {
              setStatus("expired");
              setErrorMessage("Verifieringslänken har gått ut.");
            } else {
              setStatus("error");
              setErrorMessage(exchangeError.message);
            }
            return;
          }
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus("error");
          setErrorMessage(sessionError.message);
          return;
        }

        if (session?.user) {
          // Check if email is now verified
          if (session.user.email_confirmed_at) {
            setStatus("success");
            toast({
              title: "E-post verifierad!",
              description: "Ditt konto är nu aktiverat.",
            });
            
            // Redirect after showing success
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 2000);
          } else {
            // Refresh user to get latest confirmation status
            const { data: { user }, error: refreshError } = await supabase.auth.getUser();
            
            if (refreshError) {
              setStatus("error");
              setErrorMessage(refreshError.message);
              return;
            }

            if (user?.email_confirmed_at) {
              setStatus("success");
              toast({
                title: "E-post verifierad!",
                description: "Ditt konto är nu aktiverat.",
              });
              setTimeout(() => {
                navigate("/dashboard", { replace: true });
              }, 2000);
            } else {
              // Still not verified, redirect to verify page
              navigate("/verify-email", { replace: true });
            }
          }
        } else {
          // No session, redirect to auth
          navigate("/auth", { replace: true });
        }

      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Ett oväntat fel uppstod.");
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  const handleResendVerification = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      navigate("/verify-email");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-xl">Verifierar...</CardTitle>
              <CardDescription>Vänta medan vi bekräftar din e-post.</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-xl text-green-600">E-post verifierad!</CardTitle>
              <CardDescription>Ditt konto är nu aktiverat. Du omdirigeras...</CardDescription>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-xl text-amber-600">Länken har gått ut</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Något gick fel</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>

        {(status === "expired" || status === "error") && (
          <CardContent className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              className="w-full"
            >
              Skicka ny verifieringslänk
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Tillbaka till inloggning
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
