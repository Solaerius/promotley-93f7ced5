import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Wand2,
  CalendarDays,
  Settings2,
  RotateCcw,
} from "lucide-react";

const Tutorial = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset tutorial_seen in DB then navigate to dashboard — GlobalTutorial picks it up automatically
  const handleRestartTutorial = async () => {
    if (user?.id) {
      await supabase
        .from("ai_profiles")
        .update({ tutorial_seen: false })
        .eq("user_id", user.id);
    }
    navigate("/dashboard");
  };

  const sections = [
    {
      icon: LayoutDashboard,
      titleKey: "tutorial_page.section_dashboard",
      bodyKey: "tutorial_page.section_dashboard_body",
      tips: ["tutorial_page.section_dashboard_tip1", "tutorial_page.section_dashboard_tip2"],
      color: "hsl(var(--primary))",
    },
    {
      icon: BarChart3,
      titleKey: "tutorial_page.section_analytics",
      bodyKey: "tutorial_page.section_analytics_body",
      tips: ["tutorial_page.section_analytics_tip1", "tutorial_page.section_analytics_tip2"],
      color: "hsl(174 60% 50%)",
    },
    {
      icon: Wand2,
      titleKey: "tutorial_page.section_ai",
      bodyKey: "tutorial_page.section_ai_body",
      tips: ["tutorial_page.section_ai_tip1", "tutorial_page.section_ai_tip2"],
      color: "hsl(var(--accent-brand))",
    },
    {
      icon: CalendarDays,
      titleKey: "tutorial_page.section_calendar",
      bodyKey: "tutorial_page.section_calendar_body",
      tips: ["tutorial_page.section_calendar_tip1", "tutorial_page.section_calendar_tip2"],
      color: "hsl(210 78% 62%)",
    },
    {
      icon: Settings2,
      titleKey: "tutorial_page.section_settings",
      bodyKey: "tutorial_page.section_settings_body",
      tips: ["tutorial_page.section_settings_tip1", "tutorial_page.section_settings_tip2"],
      color: "hsl(320 65% 62%)",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {t("tutorial_page.page_title")}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("tutorial_page.intro_text")}
            </p>
          </div>
          <Button
            onClick={handleRestartTutorial}
            variant="default"
            size="default"
            className="gap-2 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("tutorial_page.restart_button")}
          </Button>
        </motion.div>

        {/* Feature sections */}
        {sections.map(({ icon: Icon, titleKey, bodyKey, tips, color }, i) => (
          <motion.div
            key={titleKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * (i + 1) }}
            className="rounded-2xl p-5 bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                {t(titleKey)}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {t(bodyKey)}
            </p>
            <ul className="space-y-1.5">
              {tips.map((tipKey) => (
                <li key={tipKey} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  {t(tipKey)}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Tutorial;
