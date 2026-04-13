import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface PromoCodeInputProps {
  variant?: "inline" | "card";
  onSuccess?: (creditsGiven: number) => void;
  className?: string;
}

const PromoCodeInput = ({ variant = "inline", onSuccess, className = "" }: PromoCodeInputProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isOpen, setIsOpen] = useState(variant === "card");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length > 50) return;

    setIsLoading(true);
    setError("");
    setSuccess(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("redeem-promotion", {
        body: { code: trimmed },
      });

      if (fnError) {
        setError(t('toasts.could_not_redeem'));
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.success) {
        const credits = data.credits_given || 0;
        setSuccess(credits);
        setCode("");
        toast({
          title: "Kampanjkod inlöst!",
          description: `Du fick ${credits} gratiskrediter!`,
        });
        onSuccess?.(credits);
      }
    } catch {
      setError("Ett oväntat fel uppstod.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "inline" && !isOpen && !success) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors ${className}`}
      >
        <Gift className="w-4 h-4" />
        {t('common.have_promo_code')}
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  if (success !== null) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle2 className="w-4 h-4" />
        <span>+{success} krediter tillagda!</span>
      </div>
    );
  }

  const content = (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder={t('common.enter_promo_code')}
          disabled={isLoading}
          maxLength={50}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
        />
        <Button
          onClick={handleRedeem}
          disabled={isLoading || !code.trim()}
          size="default"
          variant="gradient"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.redeem')}
        </Button>
        {variant === "inline" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIsOpen(false); setError(""); setCode(""); }}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t('common.have_promo_code')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('common.promo_code_enter_desc')}
        </p>
        {content}
      </div>
    );
  }

  return content;
};

export default PromoCodeInput;
