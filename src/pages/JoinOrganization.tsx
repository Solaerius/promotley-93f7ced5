import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, LogIn, UserPlus } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function JoinOrganization() {
  const { code } = useParams<{ code: string }>();
  const { user, session, loading: authLoading } = useAuth();
  const { joinByCode, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"initializing" | "loading" | "success" | "error" | "auth_required">("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      setStatus("initializing");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("Ingen inbjudningskod angiven");
      return;
    }

    // If not logged in, show auth required
    if (!user || !session) {
      setStatus("auth_required");
      return;
    }

    // Wait for organization hook to load
    if (orgLoading) {
      setStatus("loading");
      return;
    }

    // Only attempt join once
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    setStatus("loading");

    const attemptJoin = async () => {
      try {
        const success = await joinByCode(code);
        if (success) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          setStatus("error");
          setErrorMessage("Ogiltig eller utgången inbjudningskod");
        }
      } catch (error) {
        console.error("Join error:", error);
        setStatus("error");
        setErrorMessage("Ett fel uppstod. Försök igen.");
      }
    };

    attemptJoin();
  }, [code, user, session, authLoading, orgLoading, joinByCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="Promotely Logo" className="w-12 h-12" />
            <span className="font-bold text-2xl">Promotely</span>
          </Link>
          <CardTitle className="text-xl">
            {status === "initializing" && "Laddar..."}
            {status === "loading" && "Ansluter till organisation..."}
            {status === "success" && "Välkommen!"}
            {status === "error" && "Något gick fel"}
            {status === "auth_required" && "Logga in för att fortsätta"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center py-8">
          {(status === "initializing" || status === "loading") && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                {status === "initializing" ? "Verifierar session..." : "Går med i organisationen..."}
              </p>
            </div>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-muted-foreground text-center">
                Du har gått med i organisationen!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Omdirigerar till dashboard...
              </p>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-muted-foreground text-center mb-6">
                {errorMessage}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  attemptedRef.current = false;
                  setStatus("loading");
                }}>
                  Försök igen
                </Button>
                <Button onClick={() => navigate("/organization/onboarding")}>
                  Gå vidare
                </Button>
              </div>
            </>
          )}
          
          {status === "auth_required" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-center mb-6">
                Du måste vara inloggad för att gå med i en organisation.
              </p>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/auth?redirect=/join/${code}`)}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Logga in
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/auth?redirect=/join/${code}&signup=true`)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Skapa konto
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
