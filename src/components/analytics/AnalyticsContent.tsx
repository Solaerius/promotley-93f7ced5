import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Eye,
  Users,
  Heart,
  MessageCircle,
  Instagram,
  Music2,
  
} from "lucide-react";
import { useMetaData } from "@/hooks/useMetaData";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useConnections } from "@/hooks/useConnections";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTikTokGrowth } from "@/hooks/useTikTokGrowth";
import { Link } from "react-router-dom";
import TikTokProfileSection from "@/components/TikTokProfileSection";

const AnalyticsContent = () => {
  const { isConnected, connections } = useConnections();
  const metaData = useMetaData();
  const tiktokData = useTikTokData();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();
  const { data: growthData, hasData: hasGrowthData } = useTikTokGrowth();

  const hasConnections = connections.length > 0;

  // Calculate totals
  const connectedStats = {
    totalFollowers: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  };

  if (isConnected('meta_ig') && metaData.instagram) {
    connectedStats.totalFollowers += metaData.instagram.followers_count || 0;
  }
  if (isConnected('tiktok') && tiktokData.user && tiktokData.stats) {
    connectedStats.totalFollowers += tiktokData.user.follower_count || 0;
    connectedStats.totalViews += tiktokData.stats.totalViews || 0;
    connectedStats.totalLikes += tiktokData.stats.totalLikes || 0;
    connectedStats.totalComments += tiktokData.stats.totalComments || 0;
  }

  const stats = [];
  if (connectedStats.totalFollowers > 0) {
    stats.push({ title: "Totala följare", value: connectedStats.totalFollowers.toLocaleString(), icon: Users });
  }
  if (connectedStats.totalViews > 0) {
    stats.push({ title: "Visningar", value: connectedStats.totalViews.toLocaleString(), icon: Eye });
  }
  if (connectedStats.totalLikes > 0) {
    stats.push({ title: "Likes", value: connectedStats.totalLikes.toLocaleString(), icon: Heart });
  }
  if (connectedStats.totalComments > 0) {
    stats.push({ title: "Kommentarer", value: connectedStats.totalComments.toLocaleString(), icon: MessageCircle });
  }

  const getHistoryData = (platform: string) => {
    const platformData = analyticsData.find(a => a.platform === platform);
    return platformData?.history as any[] || null;
  };

  if (!hasConnections) {
    return (
      <Card className="border-2 border-dashed liquid-glass-light">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-white/60" />
          <h3 className="text-xl font-semibold mb-2 dashboard-heading-dark">Inga konton kopplade</h3>
          <p className="dashboard-subheading-dark mb-6">
            Koppla dina sociala medier-konton för att se statistik
          </p>
          <Link to="/account">
            <Button variant="gradient">Gå till konto</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="liquid-glass-light hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <p className="text-xs dashboard-subheading-dark mb-0.5">{stat.title}</p>
                  <p className="text-lg font-bold dashboard-heading-dark">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="liquid-glass-light">
          <CardHeader>
            <CardTitle className="dashboard-heading-dark">Följartillväxt</CardTitle>
          </CardHeader>
          <CardContent>
            {hasGrowthData ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} name="Följare" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-white/40" />
                  <p className="text-sm dashboard-subheading-dark">Följartillväxt visas efter ett par dagars data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="liquid-glass-light">
          <CardHeader>
            <CardTitle className="dashboard-heading-dark">Engagemang</CardTitle>
          </CardHeader>
          <CardContent>
            {hasGrowthData ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="#f472b6" strokeWidth={2} name="Likes" dot={false} />
                  <Line type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={2} name="Visningar" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center">
                <div className="text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-white/40" />
                  <p className="text-sm dashboard-subheading-dark">Engagemang visas efter ett par dagars data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card className="liquid-glass-light">
        <CardHeader>
          <CardTitle className="dashboard-heading-dark">Plattformsöversikt</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={isConnected('meta_ig') ? 'instagram' : 'tiktok'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1">
              <TabsTrigger value="instagram" className={`rounded-full text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white ${!isConnected('meta_ig') ? 'opacity-50' : ''}`}>
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="tiktok" className={`rounded-full text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white ${!isConnected('tiktok') ? 'opacity-50' : ''}`}>
                <Music2 className="w-4 h-4 mr-2" />
                TikTok
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instagram" className="pt-4">
              {isConnected('meta_ig') && metaData.instagram ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-sm dashboard-subheading-dark mb-1">Följare</p>
                    <p className="text-2xl font-bold dashboard-heading-dark">{metaData.instagram.followers_count?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-sm dashboard-subheading-dark mb-1">Följer</p>
                    <p className="text-2xl font-bold dashboard-heading-dark">{metaData.instagram.follows_count?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-sm dashboard-subheading-dark mb-1">Inlägg</p>
                    <p className="text-2xl font-bold dashboard-heading-dark">{metaData.instagram.media_count?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-sm dashboard-subheading-dark mb-1">Namn</p>
                    <p className="text-xl font-bold dashboard-heading-dark">{metaData.instagram.name}</p>
                  </div>
                </div>
              ) : (
                <p className="dashboard-subheading-dark">Anslut Instagram för att se statistik</p>
              )}
            </TabsContent>

            <TabsContent value="tiktok" className="pt-4">
              {isConnected('tiktok') ? (
                <TikTokProfileSection />
              ) : (
                <p className="dashboard-subheading-dark">Anslut TikTok för att se statistik</p>
              )}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsContent;
