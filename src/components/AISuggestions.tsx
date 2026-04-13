import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/hooks/useAIProfile";
import { useNavigate } from "react-router-dom";
import { suggestionSchema } from "@/lib/validations";
import { useTranslation } from "react-i18next";

interface Suggestion {
  idea: string;
  caption: string;
  hashtags: string[];
  best_time: string;
}

export const AISuggestions = () => {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<string>("instagram");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const navigate = useNavigate();

  // Check if AI profile has enough fields filled (minimum 3)
  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  
  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const generateSuggestion = async () => {
    setLoading(true);
    setAccessError(null);
    try {
      // Validate platform selection
      const validation = suggestionSchema.safeParse({
        platform,
        brand: "user-brand", // Will be fetched from user profile in production
        keywords: "",
      });

      if (!validation.success) {
        toast({
          title: t("suggestions.validation_error"),
          description: t(validation.error.errors[0].message),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: t("suggestions.not_logged_in_title"),
          description: t("suggestions.not_logged_in_desc"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const requestId = crypto.randomUUID();
      const response = await supabase.functions.invoke("generate-suggestion", {
        body: { platform, requestId },
      });

      if (response.error) {
        const errorData = response.data as any;
        
        if (errorData?.error === 'NO_ACTIVE_PLAN') {
          setHasAccess(false);
          setAccessError('no_plan');
          toast({
            title: t("suggestions.upgrade_title"),
            description: t("suggestions.upgrade_desc"),
            variant: "destructive",
          });
        } else if (errorData?.error === 'INSUFFICIENT_CREDITS') {
          setHasAccess(false);
          setAccessError('no_credits');
          toast({
            title: t("suggestions.no_credits_title"),
            description: t("suggestions.no_credits_needed", { credits: errorData.credits_needed }),
            variant: "destructive",
          });
        } else if (response.error.message?.includes("PAYWALL")) {
          setHasAccess(false);
          setAccessError('paywall');
          toast({
            title: t("suggestions.paywall_title"),
            description: t("suggestions.paywall_desc"),
            variant: "destructive",
          });
        } else {
          throw response.error;
        }
        setLoading(false);
        return;
      }

      setSuggestion(response.data);
      toast({
        title: t("suggestions.generated_title"),
        description: t("suggestions.generated_desc"),
      });
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast({
        title: t("suggestions.error_title"),
        description: t("suggestions.error_desc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = async () => {
    if (!suggestion) return;
    
    const fullText = `${suggestion.caption}\n\n${suggestion.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    
    toast({
      title: t("suggestions.copied_title"),
      description: t("suggestions.copied_desc"),
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {t("suggestions.title")}
          </CardTitle>
          <CardDescription>
            {t("suggestions.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Profile Required Warning */}
          {isAIBlocked && (
            <Alert variant="destructive" className="border-2 border-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <p className="font-bold mb-1">{t("suggestions.profile_required_title")}</p>
                <p className="mb-2 text-sm">
                  {t("suggestions.profile_required_desc")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {t("suggestions.go_to_settings")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!hasAccess && accessError && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-semibold mb-2">{t("suggestions.locked_title")}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {accessError === 'no_plan' && t("suggestions.no_plan")}
                {accessError === 'no_credits' && t("suggestions.no_credits")}
                {accessError === 'paywall' && t("suggestions.paywall")}
              </p>
              <Button variant="gradient" size="sm" onClick={() => navigate('/pricing')}>
                {t("suggestions.view_plans")}
              </Button>
            </div>
          )}
          
          <div className="flex gap-4">
            <Select value={platform} onValueChange={setPlatform} disabled={!hasAccess || isAIBlocked}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("suggestions.select_platform")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={generateSuggestion}
              disabled={loading || !hasAccess || isAIBlocked}
              className="gap-2"
              variant="gradient"
              aria-label={t("suggestions.generate_btn")}
            >
              <Wand2 className="h-4 w-4" />
              {loading ? t("suggestions.generating") : isAIBlocked ? t("suggestions.fill_profile_first") : t("suggestions.generate_btn")}
            </Button>
          </div>

          {/* Exempel på AI-genererat inlägg */}
          {!suggestion && (
            <div className="mt-6 space-y-3 p-6 rounded-lg border border-dashed border-primary/30 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">{t("suggestions.example_label")}</p>
              </div>
              <div className="space-y-2 opacity-75">
                <p className="text-sm font-medium">Idé: Behind-the-scenes av er produktutveckling</p>
                <p className="text-sm">Caption: "Från idé till verklighet! Här är hur vi skapar våra produkter..."</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#ufföretag</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#bakomkulisserna</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#startup</span>
                </div>
              </div>
            </div>
          )}

          {suggestion && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("suggestions.idea_label")}
                  </h4>
                  <p className="text-foreground">{suggestion.idea}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      {t("suggestions.caption_label")}
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyCaption}
                      className="h-8 gap-2"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? t("suggestions.copied_btn") : t("suggestions.copy_btn")}
                    </Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">
                    {suggestion.caption}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("suggestions.hashtags_label")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {t("suggestions.best_time_label")}
                  </h4>
                  <p className="text-foreground">{suggestion.best_time}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
