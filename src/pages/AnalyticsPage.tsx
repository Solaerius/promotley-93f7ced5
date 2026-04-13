import DashboardLayout from "@/components/layouts/DashboardLayout";
import AnalyticsContent from "@/components/analytics/AnalyticsContent";
import { useTranslation } from "react-i18next";

const AnalyticsPage = () => {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('analytics.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('analytics.subtitle')}</p>
        </div>
        <AnalyticsContent />
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
