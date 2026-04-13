import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Mail, RefreshCw, X } from "lucide-react";

export function EmailVerificationBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Don't show if verified or dismissed
  if (!user || user.email_confirmed_at || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending || !user?.email) return;

    setIsResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("send-verification", {
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
        body: { email: user.email },
      });

      if (response.data?.error === "rate_limited") {
        setCountdown(response.data.retry_after || 60);
        toast({
          title: t('banner.toast_rate_limited_title'),
          description: t('banner.toast_rate_limited_description', { seconds: response.data.retry_after || 60 }),
          variant: "destructive",
        });
        return;
      }

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Failed");
      }

      setCountdown(60);
      toast({
        title: t('banner.toast_sent_title'),
        description: t('banner.toast_sent_description'),
      });

    } catch (error: any) {
      toast({
        title: t('banner.toast_failed_title'),
        description: t('banner.toast_failed_description'),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div 
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-medium">{t('banner.verify_title')}</span>{" "}
            <span className="text-muted-foreground">
              {t('banner.verify_description')}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-xs"
          >
            {isResending ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Mail className="w-3 h-3 mr-1" />
            )}
            {countdown > 0 ? t('banner.resend_wait', { seconds: countdown }) : t('banner.resend')}
          </Button>
          
          <Link to="/verify-email">
            <Button size="sm" variant="default" className="text-xs">
              {t('banner.show_details')}
            </Button>
          </Link>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="p-1 h-auto"
            aria-label={t('banner.close_aria')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
