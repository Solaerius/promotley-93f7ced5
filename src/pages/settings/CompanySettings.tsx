import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAIProfile } from "@/hooks/useAIProfile";
import { supabase } from "@/integrations/supabase/client";
import { AIProfileProgress } from "@/components/AIProfileProgress";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export function CompanySettingsInner() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    profile: aiProfile,
    updateProfile: updateAIProfile,
  } = useAIProfile();

  const [companyName, setCompanyName] = useState("");
  const [isSavingAIProfile, setIsSavingAIProfile] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    foretagsnamn: "",
    branch: "",
    stad: "",
    postnummer: "",
    lan: "",
    land: "",
    malgrupp: "",
    produkt_beskrivning: "",
    prisniva: "",
    marknadsplan: "",
    malsattning: "",
    tonalitet: "",
    allman_info: "",
    nyckelord: "",
  });

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("company_name")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setCompanyName(data.company_name || "");
      }
    };
    fetchCompanyName();
  }, [user]);

  useEffect(() => {
    if (aiProfile) {
      setAiFormData({
        foretagsnamn: aiProfile.foretagsnamn || "",
        branch: aiProfile.branch || "",
        stad: aiProfile.stad || "",
        postnummer: aiProfile.postnummer || "",
        lan: aiProfile.lan || "",
        land: aiProfile.land || "",
        malgrupp: aiProfile.malgrupp || "",
        produkt_beskrivning: aiProfile.produkt_beskrivning || "",
        prisniva: aiProfile.prisniva || "",
        marknadsplan: aiProfile.marknadsplan || "",
        malsattning: aiProfile.malsattning || "",
        tonalitet: aiProfile.tonalitet || "",
        allman_info: aiProfile.allman_info || "",
        nyckelord: aiProfile.nyckelord?.join(", ") || "",
      });
    }
  }, [aiProfile]);

  const handleSaveAIProfile = async () => {
    setIsSavingAIProfile(true);
    try {
      if (user?.id && companyName.trim()) {
        await supabase
          .from("users")
          .update({ company_name: companyName.trim() })
          .eq("id", user.id);
      }
      const { nyckelord, foretagsnamn, ...rest } = aiFormData;
      await updateAIProfile({
        ...rest,
        foretagsnamn: companyName.trim() || foretagsnamn,
        nyckelord: nyckelord
          ? nyckelord
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
          : undefined,
      });
      toast({ title: t("account.ai_profile_saved") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsSavingAIProfile(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t("settings.company_information")}
      </h1>

      <div className="space-y-4">
        <AIProfileProgress />

        <div className="space-y-1">
          <Label className="text-sm">{t('settings.company_name_label')}</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('settings.company_name_placeholder')}
            className="bg-background border-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              key: "branch",
              label: t("account.branch_label"),
              placeholder: t("account.branch_placeholder"),
              required: true,
            },
            {
              key: "stad",
              label: t("account.city_label"),
              placeholder: t("account.city_placeholder"),
              required: true,
            },
            {
              key: "postnummer",
              label: t("account.postal_label"),
              placeholder: t("account.postal_placeholder"),
              required: true,
            },
            {
              key: "land",
              label: t("account.country_label"),
              placeholder: t("account.country_placeholder"),
            },
            {
              key: "malgrupp",
              label: t("account.target_audience_label"),
              placeholder: t("account.target_audience_placeholder"),
              required: true,
            },
            {
              key: "malsattning",
              label: t("account.goal_label"),
              placeholder: t("account.goal_placeholder"),
            },
            {
              key: "prisniva",
              label: t("account.price_label"),
              placeholder: t("account.price_placeholder"),
            },
            {
              key: "tonalitet",
              label: t("account.tone_label"),
              placeholder: t("account.tone_placeholder"),
            },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm">
                {label}{" "}
                {required && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                value={(aiFormData as any)[key]}
                onChange={(e) =>
                  setAiFormData((p) => ({ ...p, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="bg-background border-border"
              />
            </div>
          ))}
          <div className="space-y-1 col-span-2">
            <Label className="text-sm">
              {t("account.principles_label")}
            </Label>
            <Input
              value={aiFormData.nyckelord}
              onChange={(e) =>
                setAiFormData((p) => ({ ...p, nyckelord: e.target.value }))
              }
              placeholder={t("account.keywords_placeholder")}
              className="bg-background border-border"
            />
          </div>
        </div>

        {[
          {
            key: "produkt_beskrivning",
            label: t("account.description_label"),
            placeholder: t("account.description_placeholder"),
            required: true,
          },
          {
            key: "marknadsplan",
            label: t("account.marketing_plan_label"),
            placeholder: t("account.marketing_plan_placeholder"),
          },
          {
            key: "allman_info",
            label: t("account.general_info_label"),
            placeholder: t("account.general_info_placeholder"),
          },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key} className="space-y-1">
            <Label className="text-sm">
              {label}{" "}
              {required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              value={(aiFormData as any)[key]}
              onChange={(e) =>
                setAiFormData((p) => ({ ...p, [key]: e.target.value }))
              }
              placeholder={placeholder}
              rows={3}
              className="bg-background border-border resize-none"
            />
          </div>
        ))}

        <Button
          onClick={handleSaveAIProfile}
          disabled={isSavingAIProfile}
          className="w-full sm:w-auto"
        >
          {isSavingAIProfile
            ? t("common.loading")
            : t("account.save_ai_profile")}
        </Button>
      </div>
    </div>
  );
}

export default function CompanySettings() {
  return (
    <DashboardLayout>
      <CompanySettingsInner />
    </DashboardLayout>
  );
}
