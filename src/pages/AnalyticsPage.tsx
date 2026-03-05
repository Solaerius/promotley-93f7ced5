import DashboardLayout from "@/components/layouts/DashboardLayout";
import AnalyticsContent from "@/components/analytics/AnalyticsContent";

const AnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div data-tour="analytics-overview" className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold dashboard-heading-dark mb-2">Statistik</h1>
          <p className="dashboard-subheading-dark">
            Översikt av dina sociala medier
          </p>
        </div>

        <AnalyticsContent />
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
