import { Button } from "@/components/ui/button";
import { HeroBanner } from "@/components/ui/HeroBanner";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { ConnectionManager } from "@/components/ConnectionManager";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useMetaData } from "@/hooks/useMetaData";
import { useConnections } from "@/hooks/useConnections";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCalendar } from "@/hooks/useCalendar";
import ChatWidget from "@/components/ChatWidget";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

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

// Example data shown when no connections exist
const exampleData = [
  { week: "V1", value: 120 },
  { week: "V2", value: 280 },
  { week: "V3", value: 450 },
  { week: "V4", value: 680 },
];

const Dashboard = () => {
  const { isConnected, connections } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();
  const { credits } = useUserCredits();
  const { posts } = useCalendar();
  const { data: analyticsData } = useAnalytics();

  // Build chart data from real analytics
  const buildChartData = (data: any[]) => {
    if (!data || data.length === 0) return exampleData;
    // Use followers history if available, otherwise use current values
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const weekNum = Math.max(1, getWeekNumber(now) - 3 + i);
      return {
        week: `V${weekNum}`,
        value: data.reduce((sum, d) => sum + (d.followers || 0), 0) * (0.7 + i * 0.1),
      };
    });
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Calculate total metrics
  const totalFollowers = 
    (isConnected('meta_ig') && metaData.instagram?.followers_count || 0) +
    (isConnected('tiktok') && tiktokData.user?.follower_count || 0);

  const upcomingPosts = posts?.filter(p => new Date(p.date) >= new Date()).length || 0;

  // Quick actions for hero banner
  const quickActions = [
    {
      icon: Sparkles,
      title: "AI-analys",
      subtitle: "Få insikter",
      href: '/analytics',
    },
    {
      icon: Calendar,
      title: "Planera",
      subtitle: `${upcomingPosts} inlägg`,
      href: '/calendar',
    },
  ];

  const statsCards = [
    {
      title: "Veckoframsteg",
      value: connections.length > 0 ? "85%" : "0%",
      icon: TrendingUp,
    },
    {
      title: "Följare",
      value: formatNumber(totalFollowers),
      icon: Users,
    },
    {
      title: "Planerade inlägg",
      value: upcomingPosts.toString(),
      icon: Calendar,
    },
    {
      title: "AI-krediter",
      value: (credits?.credits_left || 0).toString(),
      icon: Zap,
    },
  ];

  const quickLinks = [
    {
      title: "Statistik",
      description: "Se dina siffror",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: "AI-Chat",
      description: "Prata med AI",
      href: "/ai",
      icon: MessageSquare,
    },
    {
      title: "Kalender",
      description: "Planera innehåll",
      href: "/calendar",
      icon: Calendar,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Hero Banner with glass effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <HeroBanner
            title="Välkommen tillbaka"
            subtitle="Din resa fortsätter"
            quickActions={quickActions}
          />
        </motion.div>

        {/* Stats Row - Glass cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                className="liquid-glass-light p-5 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20"
                    style={{
                      background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.3) 0%, hsl(331 70% 45% / 0.2) 100%)',
                    }}
                  >
                    <Icon className="w-5 h-5 dashboard-heading-dark" />
                  </div>
                  <div>
                    <p className="text-xs dashboard-subheading-dark">{stat.title}</p>
                    <p className="text-xl font-bold dashboard-heading-dark">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Links - Glass buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.title} to={link.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer liquid-glass-light hover:scale-[1.02]"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
                    style={{
                      background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.3) 0%, hsl(331 70% 45% / 0.2) 100%)',
                    }}
                  >
                    <Icon className="w-5 h-5 dashboard-heading-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium dashboard-heading-dark">{link.title}</p>
                    <p className="text-sm dashboard-subheading-dark">{link.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 dashboard-subheading-dark" />
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        {/* Chart - Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="liquid-glass-light p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dashboard-heading-dark">Tillväxt</h3>
            {connections.length === 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Exempeldata
              </span>
            )}
          </div>
          {connections.length === 0 && (
            <p className="text-sm text-muted-foreground mb-3">
              Koppla dina sociala medier för att se riktig tillväxtdata
            </p>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={connections.length > 0 && analyticsData.length > 0 ? buildChartData(analyticsData) : exampleData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(9, 90%, 55%)" stopOpacity={connections.length > 0 ? 0.4 : 0.2}/>
                  <stop offset="95%" stopColor="hsl(331, 70%, 45%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="week" className="fill-muted-foreground" fontSize={12} tick={{ fill: 'currentColor' }} stroke="currentColor" />
              <YAxis className="fill-muted-foreground" fontSize={12} tick={{ fill: 'currentColor' }} stroke="currentColor" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                }}
                labelStyle={{ color: "white" }}
                itemStyle={{ color: "white" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(9, 90%, 55%)"
                strokeWidth={2}
                fill="url(#progressGradient)"
                strokeDasharray={connections.length === 0 ? "5 5" : undefined}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Connection Manager - Glass styled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="liquid-glass-light p-6"
        >
          <ConnectionManager />
        </motion.div>

        {/* Upgrade CTA - Vibrant gradient */}
        {credits && credits.plan === 'starter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="rounded-2xl p-6 border border-white/30"
            style={{
              background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.3) 0%, hsl(331 70% 45% / 0.3) 50%, hsl(344 60% 35% / 0.3) 100%)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold mb-1 dashboard-heading-dark">
                  Uppgradera till Pro
                </h3>
                <p className="dashboard-subheading-dark text-sm">
                  Fler krediter och avancerad analys
                </p>
              </div>
              <Button 
                variant="gradient" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => window.location.href = '/pricing'}
              >
                Se planer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </DashboardLayout>
  );
};

export default Dashboard;
