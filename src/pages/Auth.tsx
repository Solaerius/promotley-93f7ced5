import { useState, useEffect } from "react";
import { useTranslation, Trans } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { authSchema } from "@/lib/validations";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, ArrowLeft, Ban } from "lucide-react";
import AppleIcon from "@/components/icons/AppleIcon";
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const fromDemo = searchParams.get('from') === 'demo';
  // After login, redirect back to where the user was heading (preserved by ProtectedRoute)
  const redirectTo = (location.state as any)?.from || "/dashboard";

  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [emailOffers, setEmailOffers] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState("");
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Check if email is banned
  const checkBanStatus = async (emailToCheck: string): Promise<{ banned: boolean; reason?: string }> => {
    try {
      const { data, error } = await supabase
        .from("banned_users")
        .select("reason, is_permanent, expires_at")
        .eq("email", emailToCheck.toLowerCase())
        .maybeSingle();

      if (error || !data) return { banned: false };

      // Check if ban has expired
      if (!data.is_permanent && data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          return { banned: false };
        }
      }

      return { banned: true, reason: data.reason };
    } catch {
      return { banned: false };
    }
  };

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
            console.log('Session established, redirecting to', redirectTo);
            navigate(redirectTo);
            return true;
          }
          
          if (error) {
            console.error('Session error:', error);
            toast({
              title: "Inloggning misslyckades",
              description: t('toasts.google_session_error'),
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
                description: t('toasts.google_session_error'),
                variant: "destructive",
              });
            }
          }
        }, 500); // Check every 500ms
        
        return () => clearInterval(interval);
      } else if (user) {
        // Regular redirect for already logged in users
        navigate(redirectTo);
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsBanned(false);
    setBanReason("");
    setIsSubmitting(true);

    try {
      // Check if user is banned
      const banStatus = await checkBanStatus(email);
      if (banStatus.banned) {
        setIsBanned(true);
        setBanReason(banStatus.reason || "Brott mot användarvillkor");
        setIsSubmitting(false);
        return;
      }

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
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, undefined, undefined, { newsletter: emailNewsletter, offers: emailOffers }, promoCode.trim() || undefined);

      if (result.error) {
        // Handle specific error messages
        let errorMessage = "Ett fel uppstod. Försök igen.";
        
        if (result.error.message.includes("Invalid login credentials")) {
          errorMessage = t('errors.invalid_credentials');
        } else if (result.error.message.includes("User already registered")) {
          errorMessage = "Ett konto med denna e-post finns redan.";
        } else if (result.error.message.includes("Email not confirmed")) {
          errorMessage = "Bekräfta din e-post innan du loggar in.";
        }

        toast({
          title: isLogin ? "Inloggning misslyckades" : "Registrering misslyckades",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (!isLogin) {
        // Sign out the user immediately - they must verify email first
        await supabase.auth.signOut();
        
        // Send verification email with mode: signup to trigger email_confirm: false
        try {
          await supabase.functions.invoke("send-verification", {
            body: { email, mode: "signup" },
          });
        } catch (emailError) {
          console.warn("Failed to send verification email:", emailError);
        }
        
        toast({
          title: "Konto skapat!",
          description: "Kolla din inkorg och klicka på länken för att verifiera din e-post.",
        });
        
        // Redirect to verify-email with email in state
        navigate("/verify-email", { state: { email } });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.error_generic'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        toast({
          title: t('toasts.login_failed'),
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

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        toast({
          title: t('toasts.login_failed'),
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
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('toasts.email_sent'),
          description: "Kolla din inkorg för att återställa ditt lösenord",
        });
        setIsResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.error_generic'),
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-gradient-to-br from-[hsl(347,45%,8%)] via-[hsl(326,56%,20%)] to-[hsl(10,84%,30%)] relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[hsl(var(--primary)/0.2)] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[hsl(var(--accent-brand)/0.15)] blur-3xl" />
        {/* Content */}
        <div className="relative z-10 text-center text-white">
          <img src={logo} alt="Promotley" className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Promotley</h2>
          <p className="text-white/70 text-lg max-w-sm">
            {t('auth.brand_tagline')}
          </p>
          <div className="mt-8 flex flex-col gap-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent-brand))]" />
              <span>{t('auth.brand_feature_1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent-brand))]" />
              <span>{t('auth.brand_feature_2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent-brand))]" />
              <span>{t('auth.brand_feature_3')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
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
            {isLogin ? t('auth.login_title') : t('auth.register_title')}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? t('auth.login_subtitle')
              : t('auth.register_subtitle')}
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

        {/* Banned user notice */}
        {isBanned && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <Ban className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Ditt konto har blivit spärrat.</strong>
              <br />
              <span className="text-sm">Anledning: {banReason}</span>
              <br />
              <span className="text-sm mt-2 block">
                Kontakta <a href="mailto:support@promotley.se" className="underline">support@promotley.se</a> om du anser att detta är fel.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
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
              <p className="text-sm text-destructive">{t(errors.email)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
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
              <p className="text-sm text-destructive">{t(errors.password)}</p>
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
                      {t('auth.forgot_password')}
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
              <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
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
                <p className="text-sm text-destructive">{t(errors.confirmPassword)}</p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowPromoCode(!showPromoCode)}
                className="text-sm text-primary hover:underline"
              >
                {t('auth.promo_code_toggle')}
              </button>
              {showPromoCode && (
                <Input
                  id="promoCode"
                  type="text"
                  placeholder={t('auth.promo_code_placeholder')}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  maxLength={50}
                />
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-3">
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
                  <Trans
                    i18nKey="auth.terms_accept"
                    components={{
                      terms: <Link to="/terms-of-service" className="text-primary hover:underline" />,
                      privacy: <Link to="/privacy-policy" className="text-primary hover:underline" />,
                    }}
                  />
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="newsletter" 
                  checked={emailNewsletter}
                  onCheckedChange={(checked) => setEmailNewsletter(checked as boolean)}
                />
                <label htmlFor="newsletter" className="text-sm leading-none">
                  {t('auth.newsletter')}
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="offers" 
                  checked={emailOffers}
                  onCheckedChange={(checked) => setEmailOffers(checked as boolean)}
                />
                <label htmlFor="offers" className="text-sm leading-none">
                  {t('auth.offers_label')}
                </label>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || (!isLogin && !acceptedTerms)}
          >
            {isSubmitting ? "Laddar..." : isLogin ? t('auth.submit_login') : t('auth.submit_register')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.or_continue')}
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
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
            {t('auth.google')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleAppleLogin}
          >
            <AppleIcon className="mr-2 h-5 w-5" />
            {t('auth.apple')}
          </Button>
        </div>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? (
              <>
                {t('auth.no_account')}{" "}
                <span className="text-primary font-medium">{t('auth.register_link')}</span>
              </>
            ) : (
              <>
                {t('auth.has_account')}{" "}
                <span className="text-primary font-medium">{t('auth.login_link')}</span>
              </>
            )}
          </button>
        </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
