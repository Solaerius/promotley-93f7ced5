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
    (isConnected('tiktok') && tiktokData.user?.follower_count || 0);

  const upcomingPosts = posts?.filter(p => new Date(p.date) >= new Date()).length || 0;

  // Quick actions for hero banner
  const quickActions = [
    {
      icon: Sparkles,
      title: "AI-analys",
      subtitle: "Få insikter",
      onClick: () => window.location.href = '/analytics',
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
                className="backdrop-blur-xl rounded-2xl p-5 border border-white/20 transition-all duration-300 hover:border-white/40 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)',
                }}
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
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer backdrop-blur-xl border border-white/20 hover:border-white/40"
                  style={{
                    background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)',
                  }}
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
          className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4 dashboard-heading-dark">Tillväxt</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(9, 90%, 55%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(331, 70%, 45%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Connection Manager - Glass styled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)',
          }}
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
                onClick={() => window.location.href = '/#pricing'}
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
