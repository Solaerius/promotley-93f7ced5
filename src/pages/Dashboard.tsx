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
import { AISuggestions } from "@/components/AISuggestions";
import { ConnectionManager } from "@/components/ConnectionManager";
import { useAuth } from "@/hooks/useAuth";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useMetaData } from "@/hooks/useMetaData";
import { useConnections } from "@/hooks/useConnections";
import logo from "@/assets/logo.png";

// Format number for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

interface Metric {
  label: string;
  value: string;
  change: string;
  trending: "up" | "down" | "neutral";
}

interface AIInsight {
  metric: string;
  message: string;
  type: "success" | "suggestion";
}

interface PlatformStat {
  platform: string;
  icon: any;
  color: string;
  username?: string;
  metrics: Metric[];
  aiInsight?: AIInsight;
}

const Dashboard = () => {
  const { signOut } = useAuth();
  const { isConnected } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();

  // Build stats array dynamically based on connected platforms
  const stats: PlatformStat[] = [];

  // Instagram (real data)
  if (isConnected('meta_ig') && metaData.instagram && !metaData.instagram.error) {
    stats.push({
      platform: "Instagram",
      icon: Instagram,
      color: "from-pink-500 to-purple-500",
      username: metaData.instagram.username,
      metrics: [
        { 
          label: "Följare", 
          value: formatNumber(metaData.instagram.followers_count || 0), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Följer", 
          value: formatNumber(metaData.instagram.follows_count || 0), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Inlägg", 
          value: formatNumber(metaData.instagram.media_count || 0), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Namn", 
          value: metaData.instagram.name || "N/A", 
          change: "", 
          trending: "neutral" as const
        },
      ],
      aiInsight: {
        metric: "Följare",
        message: `Du har ${formatNumber(metaData.instagram.followers_count || 0)} följare på Instagram!`,
        type: "success" as const
      }
    });
  }

  // TikTok (real data)
  if (isConnected('tiktok') && tiktokData.user && tiktokData.stats) {
    stats.push({
      platform: "TikTok",
      icon: Music2,
      color: "from-cyan-500 to-pink-500",
      username: tiktokData.user.display_name,
      metrics: [
        { 
          label: "Följare", 
          value: formatNumber(tiktokData.user.follower_count || 0), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Visningar", 
          value: formatNumber(tiktokData.stats.totalViews), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Likes", 
          value: formatNumber(tiktokData.stats.totalLikes), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Engagemang", 
          value: tiktokData.stats.avgEngagementRate + "%", 
          change: "", 
          trending: "neutral" as const
        },
      ],
      aiInsight: tiktokData.stats.totalViews > 0 ? {
        metric: "Engagemang",
        message: `Du har ${tiktokData.stats.videoCount} videor med totalt ${formatNumber(tiktokData.stats.totalViews)} visningar!`,
        type: "success" as const
      } : undefined
    });
  }

  // Facebook (real data)
  if (isConnected('meta_fb') && metaData.facebook && !metaData.facebook.error) {
    stats.push({
      platform: "Facebook",
      icon: Facebook,
      color: "from-blue-600 to-blue-400",
      username: metaData.facebook.name,
      metrics: [
        { 
          label: "Följare", 
          value: formatNumber(metaData.facebook.followers_count || 0), 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Sidnamn", 
          value: metaData.facebook.name || "N/A", 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Sida ID", 
          value: metaData.facebook.page_id || metaData.facebook.user_id || "N/A", 
          change: "", 
          trending: "neutral" as const
        },
        { 
          label: "Status", 
          value: "Ansluten", 
          change: "", 
          trending: "neutral" as const
        },
      ],
      aiInsight: {
        metric: "Följare",
        message: `Din Facebook-sida är ansluten med ${formatNumber(metaData.facebook.followers_count || 0)} följare!`,
        type: "success" as const
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <img src={logo} alt="Promotley Logo" className="w-10 h-10" />
              <span>Promotley</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <Button variant="ghost">Inställningar</Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Logga ut
              </Button>
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

        {/* Connection Manager */}
        <div className="mb-8">
          <ConnectionManager />
        </div>

        {/* AI Suggestions */}
        <div className="mb-8">
          <AISuggestions />
        </div>

        {/* Platform stats */}
        <div className="space-y-6">
          {stats.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Anslut dina sociala media-konton för att se statistik och AI-insikter
              </p>
              <p className="text-sm text-muted-foreground">
                Använd Connection Manager ovan för att komma igång
              </p>
            </Card>
          ) : (
            stats.map((platform, index) => {
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
                      {platform.username && (
                        <p className="text-sm text-muted-foreground">@{platform.username}</p>
                      )}
                      {!platform.username && (
                        <p className="text-sm text-muted-foreground">Senaste 30 dagarna</p>
                      )}
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {platform.metrics.map((metric, mIndex) => (
                      <div key={mIndex} className="space-y-2">
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        {metric.change && (
                          <div className="flex items-center gap-1">
                            {metric.trending === "up" ? (
                              <TrendingUp className="w-4 h-4 text-accent" />
                            ) : metric.trending === "down" ? (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            ) : null}
                            <span className={`text-sm font-medium ${
                              metric.trending === "up" ? "text-accent" : 
                              metric.trending === "down" ? "text-destructive" : 
                              "text-muted-foreground"
                            }`}>
                              {metric.change}
                            </span>
                          </div>
                        )}
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
            })
          )}
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
