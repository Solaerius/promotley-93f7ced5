import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  FileText,
  Hash,
  Image,
  Calendar,
  Target,
  Lightbulb,
  BarChart3,
  Radar,
  ArrowRight,
  Wand2,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAIProfile } from "@/hooks/useAIProfile";
import { useUserCredits } from "@/hooks/useUserCredits";
import { planHasFeature, minPlanForFeature, type FeatureKey } from "@/lib/planConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

const AIPage = () => {
  const { t } = useTranslation();
  const { credits } = useUserCredits();

  const tools: Array<{ icon: any; title: string; description: string; route: string; feature: FeatureKey }> = [
    { icon: FileText, title: t('tools.caption_title'), description: t('tools.caption_desc'), route: "/ai/caption", feature: 'caption_generator' },
    { icon: Hash, title: t('tools.hashtag_title'), description: t('tools.hashtag_desc'), route: "/ai/hashtags", feature: 'hashtag_suggestions' },
    { icon: Image, title: t('tools.content_title'), description: t('tools.content_desc'), route: "/ai/content-ideas", feature: 'content_ideas_basic' },
    { icon: Calendar, title: t('tools.weekly_title'), description: t('tools.weekly_desc'), route: "/ai/weekly-plan", feature: 'weekly_planner' },
    { icon: Target, title: t('tools.campaign_title'), description: t('tools.campaign_desc'), route: "/ai/campaign", feature: 'marketing_plans' },
    { icon: Lightbulb, title: t('tools.uf_title'), description: t('tools.uf_desc'), route: "/ai/uf-tips", feature: 'uf_tips' },
    { icon: BarChart3, title: t('tools.analysis_title'), description: t('tools.analysis_desc'), route: "/ai-dashboard", feature: 'ai_analysis_basic' },
    { icon: Radar, title: t('tools.radar_title'), description: t('tools.radar_desc'), route: "/ai?tab=radar", feature: 'sales_radar' },
  ];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();

  const filledFields = aiProfile
    ? [aiProfile.branch, aiProfile.malgrupp, aiProfile.produkt_beskrivning, aiProfile.malsattning].filter(Boolean).length
    : 0;
  const isAIProfileComplete = filledFields >= 3;
  const isBlocked = !isAIProfileComplete && !aiProfileLoading;

  // If ?tab=radar, could redirect or show radar inline - for now navigate
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "radar") {
      // Keep on this page, radar is shown as a tool card
    }
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-l-4 border-primary pl-3">
          <h1 className="text-2xl font-bold text-foreground">{t('ai.tools_title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('ai.tools_subtitle')}
          </p>
        </div>

        {/* AI profile warning */}
        {isBlocked && (
          <Alert variant="destructive" className="border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('ai.profile_incomplete')}{" "}
              <Link to="/account" className="underline font-medium">
                {t('ai.profile_fill_first')}
              </Link>{" "}
              {t('ai.profile_to_use_features')}
            </AlertDescription>
          </Alert>
        )}

        {/* Tools grid */}
        <div data-tour="ai-tabs" className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${isBlocked ? "opacity-50 pointer-events-none" : ""}`}>
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const locked = !planHasFeature(credits?.plan, tool.feature);
            const requiredPlan = locked ? minPlanForFeature(tool.feature).displayName : '';
            return (
              <button
                key={tool.title}
                onClick={() => navigate(tool.route)}
                className="relative flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 text-left group cursor-pointer"
              >
                {locked && (
                  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] gap-1 bg-background/80">
                    <Lock className="w-2.5 h-2.5" />
                    {requiredPlan}
                  </Badge>
                )}
                <span className="text-[11px] font-bold font-mono text-muted-foreground/50 mt-1 w-5 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 shrink-0 ${locked ? 'opacity-60' : ''}`}>
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* AI profile tip */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 shrink-0">
            <Wand2 className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t('ai.profile_tip_title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('ai.profile_tip_body')}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
