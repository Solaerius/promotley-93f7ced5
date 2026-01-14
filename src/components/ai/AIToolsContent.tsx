import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Image, 
  Hash, 
  Calendar, 
  Lightbulb, 
  Target,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    icon: FileText,
    title: "Caption-generator",
    description: "Skapa engagerande captions för dina inlägg",
    color: "from-orange-500 to-red-500",
    action: "Skriv en caption för mitt senaste inlägg"
  },
  {
    icon: Hash,
    title: "Hashtag-förslag",
    description: "Få relevanta hashtags för ökad räckvidd",
    color: "from-blue-500 to-cyan-500",
    action: "Föreslå hashtags för mitt företag"
  },
  {
    icon: Image,
    title: "Content-idéer",
    description: "Brainstorma nya innehållsidéer",
    color: "from-purple-500 to-pink-500",
    action: "Ge mig 5 content-idéer för denna vecka"
  },
  {
    icon: Calendar,
    title: "Veckoplanering",
    description: "Planera din innehållskalender",
    color: "from-green-500 to-emerald-500",
    action: "Skapa en veckoplan för mina sociala medier"
  },
  {
    icon: Target,
    title: "Kampanjstrategi",
    description: "Bygg en strategi för din nästa kampanj",
    color: "from-amber-500 to-orange-500",
    action: "Hjälp mig planera en kampanj"
  },
  {
    icon: Lightbulb,
    title: "UF-tips",
    description: "Få råd specifikt för UF-företag",
    color: "from-indigo-500 to-purple-500",
    action: "Ge mig tips för UF-tävlingarna"
  },
];

const AIToolsContent = () => {
  const navigate = useNavigate();

  const handleToolClick = (action: string) => {
    // Navigate to chat tab with the action pre-filled
    // This will be handled by setting a query param or state
    navigate('/ai?tab=chat&action=' + encodeURIComponent(action));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="dashboard-subheading-dark">
          Snabbverktyg för att skapa innehåll med AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card 
            key={tool.title} 
            className="group cursor-pointer liquid-glass-light hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
            onClick={() => handleToolClick(tool.action)}
          >
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-3`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg flex items-center justify-between dashboard-heading-dark">
                {tool.title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
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
              <Sparkles className="w-6 h-6 text-white" />
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
