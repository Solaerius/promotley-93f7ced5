import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useTranslation } from "react-i18next";

const CreditWarningBanner = () => {
  const { credits, loading } = useUserCredits();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("credit_warning_dismissed") === "true";
  });

  if (loading || !credits || dismissed) return null;
  if (credits.credits_left > 0) return null;

  const isFreePlan = credits.plan === "free_trial";

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("credit_warning_dismissed", "true");
  };

  return (
    <Alert variant="destructive" className="relative border-destructive/50 bg-destructive/5 mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm">
          {isFreePlan
            ? t('credits_banner.no_credits_upgrade')
            : t('credits_banner.credits_empty')}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => navigate("/pricing")}
          >
            {isFreePlan ? t('credits_banner.upgrade_btn') : t('credits_banner.buy_btn')}
          </Button>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 hover:bg-destructive/10 transition-colors"
            aria-label="Stäng"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CreditWarningBanner;
