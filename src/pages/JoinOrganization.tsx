import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function JoinOrganization() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { joinByCode, loading } = useOrganization();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMessage("Ingen inbjudningskod angiven");
      return;
    }

    if (!user) {
      setStatus("auth_required");
      return;
    }

    if (loading) return;

    const attemptJoin = async () => {
      const success = await joinByCode(code);
      if (success) {
        setStatus("success");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setStatus("error");
        setErrorMessage("Ogiltig eller utgången inbjudningskod");
      }
    };

    attemptJoin();
  }, [code, user, loading, joinByCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="Promotley Logo" className="w-12 h-12" />
            <span className="font-bold text-2xl">Promotley</span>
          </Link>
          <CardTitle className="text-2xl">
            {status === "loading" && "Ansluter till organisation..."}
            {status === "success" && "Välkommen!"}
            {status === "error" && "Något gick fel"}
            {status === "auth_required" && "Logga in först"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center py-8">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground text-center">
                Du har gått med i organisationen! Omdirigerar...
              </p>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                {errorMessage}
              </p>
              <Button onClick={() => navigate("/organization/onboarding")}>
                Gå till organisationsval
              </Button>
            </>
          )}
          
          {status === "auth_required" && (
            <>
              <p className="text-muted-foreground text-center mb-4">
                Du måste vara inloggad för att gå med i en organisation.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Logga in
                </Button>
                <Button onClick={() => navigate(`/auth?redirect=/join/${code}`)}>
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
