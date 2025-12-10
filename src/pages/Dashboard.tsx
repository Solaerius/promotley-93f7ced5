import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
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

// Mock data for charts
const progressData = [
  { week: "V1", value: 25 },
  { week: "V2", value: 45 },
  { week: "V3", value: 60 },
  { week: "V4", value: 78 },
];

const Dashboard = () => {
  const { isConnected, connections } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();
  const { credits } = useUserCredits();
  const { posts } = useCalendar();

  // Calculate total metrics
  const totalFollowers = 
    (isConnected('meta_ig') && metaData.instagram?.followers_count || 0) +
    (isConnected('tiktok') && tiktokData.user?.follower_count || 0) +
    (isConnected('meta_fb') && metaData.facebook?.followers_count || 0);

  const upcomingPosts = posts?.filter(p => new Date(p.date) >= new Date()).length || 0;

  // Quick actions for hero banner
  const quickActions = [
    {
      icon: Sparkles,
      title: "AI-analys",
      subtitle: "Få insikter",
      onClick: () => window.location.href = '/ai-dashboard',
    },
    {
      icon: Calendar,
      title: "Planera",
      subtitle: `${upcomingPosts} inlägg`,
      onClick: () => window.location.href = '/calendar',
    },
  ];

  const statsCards = [
    {
      title: "Veckoframsteg",
      value: connections.length > 0 ? "85%" : "0%",
      icon: TrendingUp,
      color: "primary",
    },
    {
      title: "Följare",
      value: formatNumber(totalFollowers),
      icon: Users,
      color: "secondary",
    },
    {
      title: "Planerade inlägg",
      value: upcomingPosts.toString(),
      icon: Calendar,
      color: "success",
    },
    {
      title: "AI-krediter",
      value: (credits?.credits_left || 0).toString(),
      icon: Zap,
      color: "warning",
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
      href: "/ai-chat",
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
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hero Banner */}
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
              >
                <Card className="content-card h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={link.title} to={link.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="feature-card flex items-center gap-4 p-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Card className="chart-container">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Tillväxt</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#progressGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <ConnectionManager />
        </motion.div>

        {/* Upgrade CTA */}
        {credits && credits.plan === 'starter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <GlassCard variant="hero" className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Uppgradera till Pro
                  </h3>
                  <p className="text-white/80 text-sm">
                    Fler krediter och avancerad analys
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="whitespace-nowrap"
                  onClick={() => window.location.href = '/#pricing'}
                >
                  Se planer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </DashboardLayout>
  );
};

export default Dashboard;
