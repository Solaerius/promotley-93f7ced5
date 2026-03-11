import { useState, useEffect } from "react";
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
  Sparkles,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAIProfile } from "@/hooks/useAIProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

const tools = [
  {
    icon: FileText,
    title: "Caption-generator",
    description: "Skapa engagerande captions för dina inlägg",
    route: "/ai/caption",
  },
  {
    icon: Hash,
    title: "Hashtag-förslag",
    description: "Få relevanta hashtags för ökad räckvidd",
    route: "/ai/hashtags",
  },
  {
    icon: Image,
    title: "Content-idéer",
    description: "Brainstorma nya innehållsidéer",
    route: "/ai/content-ideas",
  },
  {
    icon: Calendar,
    title: "Veckoplanering",
    description: "Planera din innehållskalender",
    route: "/ai/weekly-plan",
  },
  {
    icon: Target,
    title: "Kampanjstrategi",
    description: "Bygg en strategi för din nästa kampanj",
    route: "/ai/campaign",
  },
  {
    icon: Lightbulb,
    title: "UF-tips",
    description: "Få råd specifikt för UF-företag",
    route: "/ai/uf-tips",
  },
  {
    icon: BarChart3,
    title: "AI-analys",
    description: "Analysera dina sociala medier med AI",
    route: "/ai-dashboard",
  },
  {
    icon: Radar,
    title: "Säljradar",
    description: "Hitta leads och trender i din bransch",
    route: "/ai?tab=radar",
    isInternal: true,
  },
];

const AIPage = () => {
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
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI-verktyg</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Din personliga AI för marknadsföring och innehåll
          </p>
        </div>

        {/* AI profile warning */}
        {isBlocked && (
          <Alert variant="destructive" className="border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Din AI-profil är inte komplett.{" "}
              <Link to="/account" className="underline font-medium">
                Fyll i den först
              </Link>{" "}
              för att använda AI-funktioner.
            </AlertDescription>
          </Alert>
        )}

        {/* Tools grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${isBlocked ? "opacity-50 pointer-events-none" : ""}`}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.title}
                onClick={() => navigate(tool.route)}
                className="flex items-start gap-3 p-4 rounded-xl bg-card shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted shrink-0">
                  <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* AI profile tip */}
        <div className="rounded-xl bg-card shadow-sm p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI-profil viktigt!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ju mer du fyller i din AI-profil under Konto, desto bättre svar får du.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
