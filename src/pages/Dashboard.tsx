import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { AISuggestions } from "@/components/AISuggestions";
import { ConnectionManager } from "@/components/ConnectionManager";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useMetaData } from "@/hooks/useMetaData";
import { useConnections } from "@/hooks/useConnections";
import ChatWidget from "@/components/ChatWidget";

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
  tooltip?: string;
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
  if (isConnected('tiktok')) {
    // Check if there's a scope error or limited access
    const hasScopeError = tiktokData.error?.message?.includes('saknar nödvändiga behörigheter') || 
                          tiktokData.error?.message?.includes('scope_not_authorized') ||
                          tiktokData.limited_access;
    
    if (hasScopeError) {
      // Show limited access warning with clear instructions
      stats.push({
        platform: "TikTok",
        icon: Music2,
        color: "from-cyan-500 to-pink-500",
        username: "Begränsad åtkomst",
        metrics: [
          { 
            label: "Status", 
            value: "⚠️ Login Kit", 
            change: "", 
            trending: "neutral" as const
          },
          { 
            label: "Behörigheter", 
            value: "Begränsade", 
            change: "", 
            trending: "down" as const
          },
          { 
            label: "Profilinfo", 
            value: "Tillgänglig", 
            change: "", 
            trending: "neutral" as const
          },
          { 
            label: "Videodata", 
            value: "Ej tillgänglig", 
            change: "", 
            trending: "down" as const
          },
        ],
        aiInsight: {
          metric: "API-åtkomst",
          message: "Din TikTok-anslutning använder Login Kit med begränsade behörigheter. För full statistikåtkomst och videodata krävs Content Posting API med scopes: video.query och video.data. Ansök om dessa via TikTok Developer Portal på developers.tiktok.com.",
          type: "suggestion" as const
        }
      });
    } else if (tiktokData.user && tiktokData.stats) {
      // Show full data
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
            value: (parseFloat(tiktokData.stats.avgEngagementRate as any) === 0 ? "0%" : tiktokData.stats.avgEngagementRate + "%"), 
            change: "", 
            trending: "neutral" as const,
            tooltip: "Genomsnittlig engagemangsgrad de senaste 30 dagarna"
          },
        ],
        aiInsight: tiktokData.stats.totalViews > 0 ? {
          metric: "Engagemang",
          message: `Du har ${tiktokData.stats.videoCount} videor med totalt ${formatNumber(tiktokData.stats.totalViews)} visningar!`,
          type: "success" as const
        } : undefined
      });
    }
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
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Maximera din tillväxt med AI-drivna innehållsinsikter
          </h1>
          <p className="text-lg text-muted-foreground">
            Få personliga AI-förslag för att växa snabbare på sociala medier
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
                Gå till "Anslutna konton" ovan eller "Inställningar" för att koppla dina konton
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
                  <TooltipProvider>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {platform.metrics.map((metric, mIndex) => (
                        <div key={mIndex} className="space-y-2">
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            {metric.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-muted-foreground cursor-help">ⓘ</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{metric.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
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
                  </TooltipProvider>

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
        <Card className="mt-8 p-8 bg-gradient-hero border-primary/20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-3">
              Uppgradera till Pro
            </h3>
            <p className="text-muted-foreground mb-6">
              Obegränsade AI-förslag, exporterbara innehållskalendrar och prioriterad support
            </p>
            <Button variant="gradient" size="lg" onClick={() => window.location.href = '/#pricing'}>
              Se prisplaner
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </DashboardLayout>
  );
};

export default Dashboard;
