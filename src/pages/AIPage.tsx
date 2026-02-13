import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Wand2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";

// Import content components
import AIChatContent from "@/components/ai/AIChatContent";
import AIToolsContent from "@/components/ai/AIToolsContent";

const AIPage = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-0">
        {/* Sticky Header - Transparent with glass effect */}
        <div className="sticky top-0 z-20 backdrop-blur-xl pb-4 -mx-4 px-4 pt-2 border-b border-white/10 mb-4">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold dashboard-heading-dark">AI-Assistent</h1>
            <p className="text-sm dashboard-subheading-dark">
              Din personliga AI för marknadsföring och innehåll
            </p>
          </div>

          {/* Tabs - Glass styling */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 rounded-full px-4 dashboard-subheading-dark data-[state=active]:bg-white/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="verktyg" 
                className="flex items-center gap-2 rounded-full px-4 dashboard-subheading-dark data-[state=active]:bg-white/20 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Wand2 className="w-4 h-4" />
                Verktyg
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content - Full height */}
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "chat" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TabsContent value="chat" className="mt-0 h-full">
                <AIChatContent />
              </TabsContent>

              <TabsContent value="verktyg" className="mt-0">
                <AIToolsContent />
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
