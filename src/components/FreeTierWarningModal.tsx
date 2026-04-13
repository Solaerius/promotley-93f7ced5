import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart3, Calendar, Wand2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface FreeTierWarningModalProps {
  open: boolean;
  onClose: () => void;
  usageType: "ai_analysis" | "calendar";
  onProceed: () => void;
  aiProfileData?: Record<string, unknown> | null;
}

const FreeTierWarningModal = ({ open, onClose, usageType, onProceed, aiProfileData }: FreeTierWarningModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!open || !aiProfileData) return;

    const fetchRecommendation = async () => {
      setLoadingRec(true);
      try {
        const { data } = await supabase.functions.invoke("ai-assistant/chat", {
          body: {
            message: `Baserat på denna företagsprofil, rekommendera kort (max 2 meningar) om användaren bör göra en AI-analys eller skapa en AI-kalender denna månad. Företagsinfo: ${JSON.stringify(aiProfileData)}`,
            history: [],
            meta: { action: "free_tier_recommendation", tier: "fast" },
          },
        });
        if (data?.response) {
          setAiRecommendation(data.response);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingRec(false);
      }
    };

    fetchRecommendation();
  }, [open, aiProfileData]);

  const typeLabel = usageType === "ai_analysis" ? t('freetier.type_analysis') : t('freetier.type_calendar');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {t('freetier.title')}
          </DialogTitle>
          <DialogDescription>
            {t('freetier.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 text-center ${usageType === "ai_analysis" ? "border-primary bg-primary/5" : "border-border"}`}>
              <BarChart3 className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xs font-medium">{t('freetier.analysis_label')}</p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${usageType === "calendar" ? "border-primary bg-primary/5" : "border-border"}`}>
              <Calendar className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xs font-medium">{t('freetier.calendar_label')}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('freetier.choosing')}{" "}
            <strong>{typeLabel}</strong>.{" "}
            {t('freetier.no_other')}
          </p>

          {loadingRec ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('freetier.analyzing')}
            </div>
          ) : aiRecommendation ? (
            <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">{t('freetier.recommendation')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{aiRecommendation}</p>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/pricing")}>
              {t('freetier.upgrade')}
            </Button>
            <Button className="flex-1" onClick={onProceed}>
              {t('freetier.continue')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTierWarningModal;
