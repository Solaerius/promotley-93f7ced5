import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";

// Import the content from existing pages
import AnalyticsContent from "@/components/analytics/AnalyticsContent";
import AIAnalysisContent from "@/components/analytics/AIAnalysisContent";

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("statistik");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header - Force dark mode colors */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold dashboard-heading-dark mb-2">Data & Insikter</h1>
          <p className="dashboard-subheading-dark">
            Statistik och AI-driven analys av dina sociala medier
          </p>
        </div>

        {/* Tabs - Glass styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1">
            <TabsTrigger 
              value="statistik" 
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium dashboard-subheading-dark data-[state=active]:bg-white/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Statistik
            </TabsTrigger>
            <TabsTrigger 
              value="ai-analys" 
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium dashboard-subheading-dark data-[state=active]:bg-white/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI-Analys
            </TabsTrigger>
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="statistik" className="mt-6">
              <AnalyticsContent />
            </TabsContent>

            <TabsContent value="ai-analys" className="mt-6">
              <AIAnalysisContent />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
