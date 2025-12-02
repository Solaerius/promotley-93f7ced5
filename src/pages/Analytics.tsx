import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Heart,
  MessageCircle,
  Instagram,
  Music2,
  Facebook,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useMetaData } from "@/hooks/useMetaData";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useConnections } from "@/hooks/useConnections";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Link } from "react-router-dom";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const { isConnected, connections } = useConnections();
  const metaData = useMetaData();
  const tiktokData = useTikTokData();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();

  // Check if any accounts are connected
  const hasConnections = connections.length > 0;

  // Beräkna totaler baserat på riktiga data från kopplade konton
  const connectedStats = {
    totalFollowers: 0,
    totalViews: 0,
    totalLikes: 0,
    avgEngagement: 0,
    totalComments: 0,
  };

  if (isConnected('meta_ig') && metaData.instagram) {
    connectedStats.totalFollowers += metaData.instagram.followers_count || 0;
  }
  if (isConnected('tiktok') && tiktokData.user && tiktokData.stats) {
    const followerCount = tiktokData.user.follower_count || 0;
    const totalViews = tiktokData.stats.totalViews || 0;
    const totalLikes = tiktokData.stats.totalLikes || 0;
    const totalComments = tiktokData.stats.totalComments || 0;
    
    if (followerCount > 0) connectedStats.totalFollowers += followerCount;
    if (totalViews > 0) connectedStats.totalViews += totalViews;
    if (totalLikes > 0) connectedStats.totalLikes += totalLikes;
    if (totalComments > 0) connectedStats.totalComments += totalComments;
    
    if (tiktokData.stats.avgEngagementRate) {
      connectedStats.avgEngagement = parseFloat(tiktokData.stats.avgEngagementRate);
    }
  }
  if (isConnected('meta_fb') && metaData.facebook) {
    connectedStats.totalFollowers += metaData.facebook.followers_count || 0;
  }

  // Only show stats that have values
  const stats = [];
  
  if (connectedStats.totalFollowers > 0) {
    stats.push({
      title: "Totala följare",
      value: connectedStats.totalFollowers.toLocaleString(),
      icon: Users,
    });
  }
  
  if (connectedStats.totalViews > 0) {
    stats.push({
      title: "Visningar (totalt)",
      value: connectedStats.totalViews.toLocaleString(),
      icon: Eye,
    });
  }
  
  if (connectedStats.totalLikes > 0) {
    stats.push({
      title: "Likes",
      value: connectedStats.totalLikes.toLocaleString(),
      icon: Heart,
    });
  }
  
  if (connectedStats.totalComments > 0) {
    stats.push({
      title: "Kommentarer",
      value: connectedStats.totalComments.toLocaleString(),
      icon: MessageCircle,
    });
  }

  // Get history data for graphs from analytics table
  const getHistoryData = (platform: string) => {
    const platformData = analyticsData.find(a => a.platform === platform);
    return platformData?.history as any[] || null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Statistik</h1>
            <p className="text-muted-foreground">
              Översikt av dina sociala medier-prestationer
            </p>
          </div>
        </div>

        {/* No connections state */}
        {!hasConnections && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Inga konton kopplade</h3>
              <p className="text-muted-foreground mb-6">
                Koppla dina sociala medier-konton för att se statistik och insikter
              </p>
              <Link to="/settings">
                <Button>
                  Gå till inställningar
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Only show if we have connections */}
        {hasConnections && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* AI Analysis Section */}
        <Card className="bg-gradient-hero border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-analys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Få personliga insikter och rekommendationer baserat på din data med AI-assistenten.
            </p>
            <Button variant="gradient" size="lg">
              Generera analys med AI
            </Button>
          </CardContent>
        </Card>

        {/* Charts - Only show if we have history data */}
        {hasConnections && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Views/History Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Historik</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.some(a => a.history && Array.isArray(a.history) && a.history.length > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getHistoryData(analyticsData[0]?.platform || '')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Värde"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Ingen historikdata ännu</p>
                      <p className="text-sm">Data samlas in när dina konton är kopplade</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Engagemangsöversikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Ingen historikdata ännu</p>
                    <p className="text-sm">Engagemangshistorik visas när data samlas in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Plattformsoversikt</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isConnected('meta_ig') ? 'instagram' : isConnected('tiktok') ? 'tiktok' : isConnected('meta_fb') ? 'facebook' : 'instagram'} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="instagram" className={!isConnected('meta_ig') ? 'opacity-50' : ''}>
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="tiktok" className={!isConnected('tiktok') ? 'opacity-50' : ''}>
                  <Music2 className="w-4 h-4 mr-2" />
                  TikTok
                </TabsTrigger>
                <TabsTrigger value="facebook" className={!isConnected('meta_fb') ? 'opacity-50' : ''}>
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </TabsTrigger>
              </TabsList>
              <TabsContent value="instagram" className="space-y-4 pt-4">
                {isConnected('meta_ig') && metaData.instagram ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Följare</p>
                      <p className="text-2xl font-bold">{metaData.instagram.followers_count?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Följer</p>
                      <p className="text-2xl font-bold">{metaData.instagram.follows_count?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Inlägg</p>
                      <p className="text-2xl font-bold">{metaData.instagram.media_count?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Namn</p>
                      <p className="text-xl font-bold">{metaData.instagram.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Anslut Instagram för att se statistik</p>
                )}
              </TabsContent>
              <TabsContent value="tiktok" className="space-y-4 pt-4">
                {isConnected('tiktok') && tiktokData.user && tiktokData.stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Följare</p>
                      <p className="text-2xl font-bold">{tiktokData.user.follower_count?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Visningar</p>
                      <p className="text-2xl font-bold">{tiktokData.stats.totalViews?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Likes</p>
                      <p className="text-2xl font-bold">{tiktokData.stats.totalLikes?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Engagemang</p>
                      <p className="text-2xl font-bold">{tiktokData.stats.avgEngagementRate || "0"}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Anslut TikTok för att se statistik</p>
                )}
              </TabsContent>
              <TabsContent value="facebook" className="space-y-4 pt-4">
                {isConnected('meta_fb') && metaData.facebook ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Följare</p>
                      <p className="text-2xl font-bold">{metaData.facebook.followers_count?.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">Sidnamn</p>
                      <p className="text-xl font-bold">{metaData.facebook.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Anslut Facebook för att se statistik</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
