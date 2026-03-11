import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  TrendingUp,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useMetaData } from "@/hooks/useMetaData";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCalendar } from "@/hooks/useCalendar";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import TikTokIcon from "@/components/icons/TikTokIcon";
import FacebookIcon from "@/components/icons/FacebookIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import TwitterIcon from "@/components/icons/TwitterIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import { Instagram } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isConnected, connections } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();
  const { credits } = useUserCredits();
  const { posts } = useCalendar();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const totalFollowers =
    (isConnected("meta_ig") && metaData.instagram?.followers_count || 0) +
    (isConnected("tiktok") && tiktokData.user?.follower_count || 0);

  const upcomingPosts = posts?.filter((p) => new Date(p.date) >= new Date()).slice(0, 3) || [];

  // Fetch recent activity
  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      const activities: any[] = [];

      // Recent AI usage
      const { data: aiMessages } = await supabase
        .from("ai_chat_messages")
        .select("created_at, message")
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(3);

      if (aiMessages) {
        aiMessages.forEach((msg) => {
          activities.push({
            type: "ai",
            icon: Sparkles,
            label: "AI-förfrågan",
            detail: msg.message.substring(0, 50) + (msg.message.length > 50 ? "..." : ""),
            time: msg.created_at,
          });
        });
      }

      // Upcoming posts
      upcomingPosts.forEach((post) => {
        activities.push({
          type: "post",
          icon: Calendar,
          label: "Planerat inlägg",
          detail: post.title,
          time: post.date,
        });
      });

      // Sort by time, most recent first
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
    };
    fetchActivity();
  }, [user?.id, posts]);

  const statsCards = [
    { title: "Följare", value: formatNumber(totalFollowers), icon: Users },
    { title: "Planerade inlägg", value: (upcomingPosts.length).toString(), icon: Calendar },
    { title: "AI-krediter", value: (credits?.credits_left || 0).toString(), icon: Zap },
    { title: "Anslutna konton", value: connections.length.toString(), icon: TrendingUp },
  ];

  const quickLinks = [
    { title: "Statistik", description: "Se dina siffror", href: "/analytics", icon: BarChart3 },
    { title: "AI-Chat", description: "Prata med AI", href: "/ai/chat", icon: MessageSquare },
    { title: "Kalender", description: "Planera innehåll", href: "/calendar", icon: Calendar },
  ];

  // All platforms with status
  const platforms = [
    { key: "tiktok", label: "TikTok", icon: TikTokIcon, connected: isConnected("tiktok"), available: true },
    { key: "meta_ig", label: "Instagram", icon: Instagram, connected: isConnected("meta_ig"), available: false },
    { key: "meta_fb", label: "Facebook", icon: FacebookIcon, connected: false, available: false },
    { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon, connected: false, available: false },
    { key: "twitter", label: "X", icon: TwitterIcon, connected: false, available: false },
    { key: "youtube", label: "YouTube", icon: YouTubeIcon, connected: false, available: false },
  ];

  const firstName = user?.email?.split("@")[0] || "du";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Välkommen tillbaka, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Här är en snabb överblick.</p>
        </div>

        {/* Stats Row - no border, soft shadow */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="rounded-xl bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-medium text-foreground mb-3">Senaste aktivitet</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Ingen aktivitet ännu. Börja med att använda AI eller planera ett inlägg!</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center bg-muted shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: sv })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connections - all platforms with status */}
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-medium text-foreground mb-3">Plattformar</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.key}
                  to={p.available ? "/account?tab=app" : "#"}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${
                    p.available ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-default"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    p.connected
                      ? "bg-green-500/10"
                      : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${p.connected ? "text-foreground" : "text-muted-foreground"}`} />
                  </div>
                  {p.connected && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-green-500" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{p.label}</span>
                  {!p.available && (
                    <span className="text-[8px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">Snart</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.title} to={link.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Subtle upgrade banner */}
        {credits && (credits.plan === "free_trial" || credits.plan === "starter") && (
          <div className="rounded-xl bg-primary/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Uppgradera din plan</p>
              <p className="text-xs text-muted-foreground">Fler krediter och avancerad analys</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">
                Se planer
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
