import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { HeroBanner } from "@/components/ui/HeroBanner";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
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
  ArrowRight,
  Calendar,
  MessageSquare,
  BarChart3,
  FileText,
  Target,
  Zap
} from "lucide-react";
import { AISuggestions } from "@/components/AISuggestions";
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
  LineChart,
  Line,
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

// Mock data for charts (will be replaced with real data)
const weeklyData = [
  { day: "Mån", value: 65 },
  { day: "Tis", value: 72 },
  { day: "Ons", value: 68 },
  { day: "Tor", value: 85 },
  { day: "Fre", value: 90 },
  { day: "Lör", value: 88 },
  { day: "Sön", value: 92 },
];

const progressData = [
  { week: "Vecka 1", value: 25 },
  { week: "Vecka 2", value: 45 },
  { week: "Vecka 3", value: 60 },
  { week: "Vecka 4", value: 78 },
];

const Dashboard = () => {
  const { isConnected, connections } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();
  const { credits } = useUserCredits();
  const { posts, hasPosts } = useCalendar();

  // Calculate total metrics
  const totalFollowers = 
    (isConnected('meta_ig') && metaData.instagram?.followers_count || 0) +
    (isConnected('tiktok') && tiktokData.user?.follower_count || 0) +
    (isConnected('meta_fb') && metaData.facebook?.followers_count || 0);

  const totalViews = tiktokData.stats?.totalViews || 0;
  const totalLikes = tiktokData.stats?.totalLikes || 0;
  const upcomingPosts = posts?.filter(p => new Date(p.date) >= new Date()).length || 0;

  // Quick actions for hero banner
  const quickActions = [
    {
      icon: Sparkles,
      title: "AI-analys",
      subtitle: "Få insikter om din statistik",
      onClick: () => window.location.href = '/ai-dashboard',
    },
    {
      icon: Calendar,
      title: "Planera innehåll",
      subtitle: `${upcomingPosts} kommande inlägg`,
      onClick: () => window.location.href = '/calendar',
    },
  ];

  // Feature tools
  const featureTools = [
    {
      icon: MessageSquare,
      title: "AI-Assistent",
      description: "Chatta med AI för personliga marknadsföringsråd",
      href: "/ai-chat",
      iconColor: "bg-primary/10 text-primary",
    },
    {
      icon: BarChart3,
      title: "Statistik",
      description: "Se din prestanda på sociala medier",
      href: "/analytics",
      iconColor: "bg-secondary/10 text-secondary",
    },
    {
      icon: Calendar,
      title: "Kalender",
      description: "Planera och schemalägg ditt innehåll",
      href: "/calendar",
      iconColor: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <HeroBanner
          title="Välkommen tillbaka"
          subtitle="Din resa fortsätter med styrka och framsteg"
          quickActions={quickActions}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="content-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Veckoframsteg</p>
                    <p className="text-2xl font-bold">{connections.length > 0 ? "85%" : "0%"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="content-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Totala följare</p>
                    <p className="text-2xl font-bold">{formatNumber(totalFollowers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="content-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Planerade inlägg</p>
                    <p className="text-2xl font-bold">{upcomingPosts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="content-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI-krediter</p>
                    <p className="text-2xl font-bold">{credits?.credits_left || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="chart-container">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Tillväxtframsteg</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
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

          {/* Weekly Score Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="chart-container">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Veckoengagemang</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="h-7 text-xs">Daglig</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Vecka</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Connection Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ConnectionManager />
        </motion.div>

        {/* Feature Tools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-xl font-semibold mb-4">Verktyg</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureTools.map((tool, index) => (
              <FeatureCard
                key={index}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                href={tool.href}
                iconColor={tool.iconColor}
                delay={index}
              />
            ))}
          </div>
        </motion.div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AISuggestions />
        </motion.div>

        {/* Upgrade CTA */}
        {credits && credits.plan === 'starter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <GlassCard variant="hero" className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Uppgradera till Pro
                  </h3>
                  <p className="text-white/80">
                    Få fler AI-krediter, avancerad analys och prioriterad support
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="whitespace-nowrap"
                  onClick={() => window.location.href = '/#pricing'}
                >
                  Se prisplaner
                  <ArrowRight className="w-5 h-5 ml-2" />
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
