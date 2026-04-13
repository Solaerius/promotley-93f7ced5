import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Image, 
  Hash, 
  Calendar, 
  Lightbulb, 
  Target,
  Wand2,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAIProfile } from "@/hooks/useAIProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AIToolsContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tools = [
    { icon: FileText, title: t('tools.caption_title'), description: t('tools.caption_desc'), color: "from-orange-500 to-red-500", route: "/ai/caption" },
    { icon: Hash, title: t('tools.hashtag_title'), description: t('tools.hashtag_desc'), color: "from-blue-500 to-cyan-500", route: "/ai/hashtags" },
    { icon: Image, title: t('tools.content_title'), description: t('tools.content_desc'), color: "from-purple-500 to-pink-500", route: "/ai/content-ideas" },
    { icon: Calendar, title: t('tools.weekly_title'), description: t('tools.weekly_desc'), color: "from-green-500 to-emerald-500", route: "/ai/weekly-plan" },
    { icon: Target, title: t('tools.campaign_title'), description: t('tools.campaign_desc'), color: "from-amber-500 to-orange-500", route: "/ai/campaign" },
    { icon: Lightbulb, title: t('tools.uf_title'), description: t('tools.uf_desc'), color: "from-indigo-500 to-purple-500", route: "/ai/uf-tips" },
  ];
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();

  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const handleToolClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="space-y-4">
      {isAIBlocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Din AI-profil är inte komplett. <Link to="/account" className="underline font-medium">Fyll i den först</Link> för att använda AI-funktioner.
          </AlertDescription>
        </Alert>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${isAIBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
        {tools.map((tool) => (
          <Card 
            key={tool.title} 
            className="group cursor-pointer liquid-glass-light hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
            onClick={() => handleToolClick(tool.route)}
          >
            <CardHeader className="pb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-2`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg flex items-center justify-between dashboard-heading-dark">
                {tool.title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-foreground" />
              </CardTitle>
              <CardDescription className="dashboard-subheading-dark">{tool.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="liquid-glass-light border-white/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 dashboard-heading-dark">AI-profil viktigt!</h3>
              <p className="text-sm dashboard-subheading-dark mb-3">
                Ju mer du fyller i din AI-profil under Konto, desto bättre och mer relevanta svar får du.
              </p>
              <Button variant="gradient" size="sm" onClick={() => navigate('/account')}>
                Uppdatera AI-profil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIToolsContent;
