import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { authSchema } from "@/lib/validations";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import PasswordRequirements from "@/components/PasswordRequirements";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const fromDemo = searchParams.get('from') === 'demo';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback and redirect if logged in
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check both hash fragments and query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const code = queryParams.get('code');
      
      if (accessToken || code) {
        console.log('OAuth callback detected, waiting for session...');
        
        // Give Supabase time to process the callback
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkSession = async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('Session established, redirecting to dashboard');
            navigate("/dashboard");
            return true;
          }
          
          if (error) {
            console.error('Session error:', error);
            toast({
              title: "Inloggning misslyckades",
              description: "Kunde inte hämta session från Google. Försök igen.",
              variant: "destructive",
            });
            return true;
          }
          
          return false;
        };
        
        // Retry mechanism
        const interval = setInterval(async () => {
          attempts++;
          const success = await checkSession();
          
          if (success || attempts >= maxAttempts) {
            clearInterval(interval);
            if (attempts >= maxAttempts) {
              toast({
                title: "Timeout",
                description: "Kunde inte slutföra inloggning. Försök igen.",
                variant: "destructive",
              });
            }
          }
        }, 500); // Check every 500ms
        
        return () => clearInterval(interval);
      } else if (user) {
        // Regular redirect for already logged in users
        navigate("/dashboard");
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Check password confirmation for signup
      if (!isLogin && password !== confirmPassword) {
        setErrors({ confirmPassword: "Lösenorden matchar inte" });
        setIsSubmitting(false);
        return;
      }

      // Validate input
      const validation = authSchema.safeParse({
        email,
        password,
        companyName: isLogin ? undefined : companyName,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Perform authentication
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, companyName);

      if (error) {
        // Handle specific error messages
        let errorMessage = "Ett fel uppstod. Försök igen.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Felaktig e-post eller lösenord.";
        } else if (error.message.includes("User already registered")) {
          errorMessage = "Ett konto med denna e-post finns redan.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Bekräfta din e-post innan du loggar in.";
        }

        toast({
          title: isLogin ? "Inloggning misslyckades" : "Registrering misslyckades",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (!isLogin) {
        // Send verification email and redirect to verify-email page
        try {
          await supabase.functions.invoke("send-verification", {
            body: { email },
          });
        } catch (emailError) {
          console.warn("Failed to send verification email:", emailError);
        }
        navigate("/verify-email");
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Fel vid inloggning",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fel vid inloggning",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    setIsResetting(true);
    try {
      if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
        toast({
          title: "Ogiltig e-post",
          description: "Ange en giltig e-postadress",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Fel",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email skickat!",
          description: "Kolla din inkorg för att återställa ditt lösenord",
        });
        setIsResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl">
            <img src={logo} alt="Promotley Logo" className="w-12 h-12" />
            <span>Promotley</span>
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

        {/* Demo notice */}
        {fromDemo && !isLogin && (
          <Alert className="mb-6 bg-gradient-primary/10 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Skapa ett konto</strong> för att testa demon och få din personliga AI-strategi
            </AlertDescription>
          </Alert>
        )}

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
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            {!isLogin && <PasswordRequirements password={password} />}
            
            {isLogin && (
              <div className="text-right">
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Glömt lösenord?
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Återställ lösenord</DialogTitle>
                      <DialogDescription>
                        Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">E-post</Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="namn@foretagsnamn.se"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handlePasswordReset}
                        disabled={isResetting}
                        variant="gradient"
                        className="w-full"
                      >
                        {isResetting ? "Skickar..." : "Skicka återställningslänk"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Jag accepterar{" "}
                <Link to="/terms-of-service" className="text-primary hover:underline">
                  användarvillkoren
                </Link>{" "}
                och{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  integritetspolicyn
                </Link>
              </label>
            </div>
          )}

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || (!isLogin && !acceptedTerms)}
          >
            {isSubmitting ? "Laddar..." : isLogin ? "Logga in" : "Skapa konto"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Eller fortsätt med
            </span>
          </div>
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Fortsätt med Google
        </Button>

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

      </Card>
    </div>
  );
};

export default Auth;
