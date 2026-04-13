import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AppSettingsContent from "@/components/account/AppSettingsContent";

export default function AppSettings() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t("settings.app")}
        </h1>
        <AppSettingsContent />
      </div>
    </DashboardLayout>
  );
}
