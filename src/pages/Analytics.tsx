import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye,
  Users,
  Heart,
  MessageCircle,
  Instagram,
  Music2,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useMetaData } from "@/hooks/useMetaData";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useConnections } from "@/hooks/useConnections";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Analytics = () => {
  const { isConnected, connections } = useConnections();
  const metaData = useMetaData();
  const tiktokData = useTikTokData();
  const { data: analyticsData } = useAnalytics();

  const hasConnections = connections.length > 0;

  // Calculate stats
  const stats: { title: string; value: string; icon: any }[] = [];

  const totalFollowers =
    (isConnected("meta_ig") ? metaData.instagram?.followers_count || 0 : 0) +
    (isConnected("tiktok") ? tiktokData.user?.follower_count || 0 : 0);

  if (totalFollowers > 0) stats.push({ title: "Följare", value: totalFollowers.toLocaleString(), icon: Users });

  if (isConnected("tiktok") && tiktokData.stats) {
    if (tiktokData.stats.totalViews > 0) stats.push({ title: "Visningar", value: tiktokData.stats.totalViews.toLocaleString(), icon: Eye });
    if (tiktokData.stats.totalLikes > 0) stats.push({ title: "Likes", value: tiktokData.stats.totalLikes.toLocaleString(), icon: Heart });
    if (tiktokData.stats.totalComments > 0) stats.push({ title: "Kommentarer", value: tiktokData.stats.totalComments.toLocaleString(), icon: MessageCircle });
  }

  const getHistoryData = (platform: string) => {
    const platformData = analyticsData.find((a) => a.platform === platform);
    return (platformData?.history as any[]) || null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Statistik</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Översikt av dina sociala medier</p>
        </div>

        {/* No connections */}
        {!hasConnections && (
          <div className="rounded-xl bg-card shadow-sm p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-base font-medium mb-1">Inga konton kopplade</h3>
            <p className="text-sm text-muted-foreground mb-4">Koppla dina sociala medier för att se statistik.</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/account?tab=app">Gå till kopplingar</Link>
            </Button>
          </div>
        )}

        {/* Stats */}
        {hasConnections && stats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-xl bg-card shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{stat.title}</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Chart */}
        {hasConnections && analyticsData.some((a) => a.history && Array.isArray(a.history) && (a.history as any[]).length > 0) && (
          <div className="rounded-xl bg-card shadow-sm p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Historik</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getHistoryData(analyticsData[0]?.platform || "")}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Värde" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform breakdown */}
        {hasConnections && (
          <div className="space-y-3">
            {/* TikTok */}
            {isConnected("tiktok") && tiktokData.user && tiktokData.stats && (
              <div className="rounded-xl bg-card shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Music2 className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">TikTok</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Följare", value: tiktokData.user.follower_count?.toLocaleString() || "0" },
                    { label: "Visningar", value: tiktokData.stats.totalViews?.toLocaleString() || "0" },
                    { label: "Likes", value: tiktokData.stats.totalLikes?.toLocaleString() || "0" },
                    { label: "Engagemang", value: `${tiktokData.stats.avgEngagementRate || "0"}%` },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instagram */}
            {isConnected("meta_ig") && metaData.instagram && (
              <div className="rounded-xl bg-card shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Instagram className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">Instagram</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Följare", value: metaData.instagram.followers_count?.toLocaleString() || "0" },
                    { label: "Följer", value: metaData.instagram.follows_count?.toLocaleString() || "0" },
                    { label: "Inlägg", value: metaData.instagram.media_count?.toLocaleString() || "0" },
                    { label: "Namn", value: metaData.instagram.name || "-" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
