import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Palette } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";

// Import content components
import AccountContent from "@/components/account/AccountContent";
import OrganizationContent from "@/components/account/OrganizationContent";
import AppSettingsContent from "@/components/account/AppSettingsContent";

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState("konto");

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header - Force dark mode colors */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold dashboard-heading-dark mb-2">
            Konto & Inställningar
          </h1>
          <p className="dashboard-subheading-dark text-sm">
            Hantera ditt konto, organisation och appinställningar
          </p>
        </div>

        {/* Tabs - Glass styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1 gap-1">
              <TabsTrigger 
                value="konto" 
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all"
              >
                <User className="w-4 h-4" />
                Konto
              </TabsTrigger>
              <TabsTrigger 
                value="organisation" 
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all"
              >
                <Building2 className="w-4 h-4" />
                Organisation
              </TabsTrigger>
              <TabsTrigger 
                value="app" 
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all"
              >
                <Palette className="w-4 h-4" />
                App
              </TabsTrigger>
            </TabsList>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <TabsContent value="konto" className="mt-0">
              <AccountContent />
            </TabsContent>

            <TabsContent value="organisation" className="mt-0">
              <OrganizationContent />
            </TabsContent>

            <TabsContent value="app" className="mt-0">
              <AppSettingsContent />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountPage;
