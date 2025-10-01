import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo implementation - would connect to Lovable Cloud auth
    toast({
      title: isLogin ? "Inloggning lyckades!" : "Konto skapat!",
      description: "Du omdirigeras till dashboard...",
    });

    // In production: redirect to dashboard after successful auth
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>Promotely</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? "Välkommen tillbaka" : "Kom igång gratis"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Logga in för att fortsätta till din dashboard"
              : "Skapa ditt konto och få 1 gratis AI-förslag"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Företagsnamn</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Mitt UF-företag"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="namn@foretagsnamn.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full" size="lg">
            {isLogin ? "Logga in" : "Skapa konto"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? (
              <>
                Inget konto?{" "}
                <span className="text-primary font-medium">Registrera dig</span>
              </>
            ) : (
              <>
                Har redan konto?{" "}
                <span className="text-primary font-medium">Logga in</span>
              </>
            )}
          </button>
        </div>

        {/* Note */}
        {!isLogin && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Genom att skapa ett konto godkänner du våra villkor och integritetspolicy
          </p>
        )}
      </Card>
    </div>
  );
};

export default Auth;
