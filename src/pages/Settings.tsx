import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AccountContent from "@/components/account/AccountContent";
import OrganizationContent from "@/components/account/OrganizationContent";
import AppSettingsContent from "@/components/account/AppSettingsContent";
import { CompanySettingsInner } from "@/pages/settings/CompanySettings";
import { CreditsSettingsInner } from "@/pages/settings/CreditsSettings";
import { cn } from "@/lib/utils";
import { User, Building2, Users, CreditCard, Settings } from "lucide-react";

const TABS = [
  { id: "profile",      labelKey: "settings.tab_profile",       icon: User,       Content: AccountContent },
  { id: "company",      labelKey: "settings.tab_company",       icon: Building2,  Content: CompanySettingsInner },
  { id: "organisation", labelKey: "settings.tab_organisation",  icon: Users,      Content: OrganizationContent },
  { id: "credits",      labelKey: "settings.tab_credits",       icon: CreditCard, Content: CreditsSettingsInner },
  { id: "app",          labelKey: "settings.tab_app",           icon: Settings,   Content: AppSettingsContent },
];

const SettingsPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  const currentTab = TABS.find(tab => tab.id === activeTab) || TABS[0];
  const { Content } = currentTab;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('settings.page_title')}
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border mb-6 overflow-x-auto">
          {TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSearchParams({ tab: id })}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Content />
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
