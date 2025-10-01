import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  Share2,
  Sparkles,
  Instagram,
  Music2,
  Facebook,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

// Demo data
const stats = [
  {
    platform: "Instagram",
    icon: Instagram,
    color: "from-pink-500 to-purple-500",
    metrics: [
      { label: "Följare", value: "2,847", change: "+12%", trending: "up" },
      { label: "Engagemang", value: "8.4%", change: "+2.1%", trending: "up" },
      { label: "Räckvidd", value: "15.2k", change: "-3%", trending: "down" },
      { label: "CTR", value: "2.8%", change: "+0.5%", trending: "up" },
    ],
    aiInsight: {
      metric: "CTR",
      message: "Prova en tydligare CTA i början av dina Reels för att öka CTR",
      type: "suggestion"
    }
  },
  {
    platform: "TikTok",
    icon: Music2,
    color: "from-cyan-500 to-pink-500",
    metrics: [
      { label: "Visningar", value: "45.3k", change: "+24%", trending: "up" },
      { label: "Likes", value: "3.2k", change: "+18%", trending: "up" },
      { label: "Delningar", value: "432", change: "+31%", trending: "up" },
      { label: "Genomsnitt tid", value: "8.2s", change: "+1.2s", trending: "up" },
    ],
    aiInsight: {
      metric: "Visningar",
      message: "Dina senaste videor presterar 24% bättre! Fortsätt med liknande innehåll",
      type: "success"
    }
  },
  {
    platform: "Facebook",
    icon: Facebook,
    color: "from-blue-600 to-blue-400",
    metrics: [
      { label: "Följare", value: "1,234", change: "+5%", trending: "up" },
      { label: "Interaktioner", value: "892", change: "-8%", trending: "down" },
      { label: "Sidvisningar", value: "2.1k", change: "+12%", trending: "up" },
      { label: "Post räckvidd", value: "4.5k", change: "+3%", trending: "up" },
    ],
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Promotely</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <Button variant="ghost">Inställningar</Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline">Logga ut</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Din Dashboard</h1>
          <p className="text-muted-foreground">
            Översikt över dina sociala medier med AI-drivna insikter
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 bg-gradient-hero border-primary/20">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Generera innehåll</h3>
                <p className="text-sm text-muted-foreground">
                  Få AI-genererade förslag med captions och hashtags
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <Button variant="gradient" className="mt-4">
              Skapa förslag
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Krediter kvar</h3>
                <p className="text-3xl font-bold text-primary">1</p>
                <p className="text-sm text-muted-foreground">
                  gratis AI-förslag återstår
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <Link to="/auth">
              <Button variant="outline" className="mt-4 w-full">
                Uppgradera till Pro
              </Button>
            </Link>
          </Card>
        </div>

        {/* Platform stats */}
        <div className="space-y-6">
          {stats.map((platform, index) => {
            const PlatformIcon = platform.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-elegant transition-all duration-300">
                {/* Platform header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <PlatformIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{platform.platform}</h2>
                    <p className="text-sm text-muted-foreground">Senaste 30 dagarna</p>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {platform.metrics.map((metric, mIndex) => (
                    <div key={mIndex} className="space-y-2">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        {metric.trending === "up" ? (
                          <TrendingUp className="w-4 h-4 text-accent" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${
                          metric.trending === "up" ? "text-accent" : "text-destructive"
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Insight */}
                {platform.aiInsight && (
                  <div className={`p-4 rounded-lg border-l-4 ${
                    platform.aiInsight.type === "success" 
                      ? "bg-accent/10 border-accent" 
                      : "bg-primary/10 border-primary"
                  }`}>
                    <div className="flex items-start gap-3">
                      <Sparkles className={`w-5 h-5 mt-0.5 ${
                        platform.aiInsight.type === "success" ? "text-accent" : "text-primary"
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium mb-1">AI-insikt · {platform.aiInsight.metric}</p>
                        <p className="text-sm text-muted-foreground">
                          {platform.aiInsight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Card className="mt-8 p-8 text-center bg-gradient-hero">
          <h3 className="text-2xl font-bold mb-2">Vill du ha fler AI-insikter?</h3>
          <p className="text-muted-foreground mb-6">
            Uppgradera till Pro och få obegränsad tillgång till AI-genererade förslag
          </p>
          <Link to="/auth">
            <Button variant="gradient" size="lg">
              Se priser
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
