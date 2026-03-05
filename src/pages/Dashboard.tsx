import { useState, useEffect } from "react";
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
import PromoCodeInput from "@/components/PromoCodeInput";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useMetaData } from "@/hooks/useMetaData";
import { useConnections } from "@/hooks/useConnections";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCalendar } from "@/hooks/useCalendar";
import ChatWidget from "@/components/ChatWidget";
import { supabase } from "@/integrations/supabase/client";
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

type TimeRange = '1m' | '6m' | '1y' | 'all';

const timeRangeLabels: Record<TimeRange, string> = {
  '1m': 'Denna månad',
  '6m': '6 månader',
  '1y': '1 år',
  'all': 'All tid',
};

// Platform color config – brand-accurate colors for all platforms
const platformColors: Record<string, { stroke: string; label: string }> = {
  tiktok:   { stroke: 'hsl(172, 80%, 45%)',  label: 'TikTok' },      // Teal/cyan
  meta_ig:  { stroke: 'hsl(330, 70%, 55%)',  label: 'Instagram' },   // Magenta/pink
  meta_fb:  { stroke: 'hsl(220, 70%, 55%)',  label: 'Facebook' },    // Blue
  linkedin: { stroke: 'hsl(210, 80%, 45%)',  label: 'LinkedIn' },    // Dark blue
  twitter:  { stroke: 'hsl(200, 85%, 50%)',  label: 'X' },           // Sky blue
  youtube:  { stroke: 'hsl(0, 80%, 50%)',    label: 'YouTube' },     // Red
};

const getWeekNumberStatic = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getTimeLabels = (range: TimeRange): string[] => {
  const now = new Date();
  const counts: Record<TimeRange, number> = { '1m': 4, '6m': 6, '1y': 12, 'all': 8 };
  const count = counts[range];
  return Array.from({ length: count }, (_, i) => {
    if (range === '1m') {
      const weekNum = Math.max(1, getWeekNumberStatic(now) - count + 1 + i);
      return `Vecka ${weekNum}`;
    }
    const d = new Date(now);
    const monthsBack = range === 'all' ? (count - 1 - i) * 3 : count - 1 - i;
    d.setMonth(d.getMonth() - monthsBack);
    return range === 'all'
      ? d.toLocaleString('sv-SE', { month: 'short', year: '2-digit' })
      : d.toLocaleString('sv-SE', { month: 'short' });
  });
};

// Generate example data with two fake platforms
const generateExampleData = (range: TimeRange) => {
  const labels = getTimeLabels(range);
  return labels.map((label, i) => ({
    week: label,
    tiktok: 80 + Math.round(i * 160 + Math.sin(i) * 40),
    meta_ig: 120 + Math.round(i * 130 + Math.cos(i) * 35),
  }));
};

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [weeklyMetrics, setWeeklyMetrics] = useState<any[]>([]);
  const { isConnected, connections } = useConnections();
  const tiktokData = useTikTokData();
  const metaData = useMetaData();
  const { credits } = useUserCredits();
  const { posts } = useCalendar();
  const { data: analyticsData } = useAnalytics();

  const exampleData = generateExampleData(timeRange);

  // Fetch real weekly follower metrics from the metrics table
  useEffect(() => {
    const fetchWeeklyMetrics = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || connections.length === 0) return;

      // Get metrics from last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: metrics } = await supabase
        .from('metrics')
        .select('*')
        .eq('metric_type', 'followers')
        .gte('captured_at', fourWeeksAgo.toISOString())
        .order('captured_at', { ascending: true });

      if (metrics && metrics.length > 0) {
        setWeeklyMetrics(metrics);
      }
    };
    fetchWeeklyMetrics();
  }, [connections]);

  // Determine which platforms are connected
  const connectedPlatforms = connections.map(c => c.provider);
  const activePlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : ['tiktok', 'meta_ig'];

  // Build chart data from real metrics (weekly follower snapshots)
  const buildChartData = () => {
    if (weeklyMetrics.length === 0) {
      // Fall back to analytics-based estimation
      if (!analyticsData || analyticsData.length === 0) return exampleData;
      const labels = getTimeLabels(timeRange);
      const byPlatform: Record<string, number> = {};
      analyticsData.forEach(d => { byPlatform[d.platform] = d.followers || 0; });

      return labels.map((label, i) => {
        const point: Record<string, any> = { week: label };
        Object.keys(byPlatform).forEach(platform => {
          point[platform] = Math.round(byPlatform[platform] * (0.5 + (i / labels.length) * 0.5));
        });
        return point;
      });
    }

    // Group metrics by week number
    const now = new Date();
    const currentWeek = getWeekNumberStatic(now);
    const weekBuckets: Record<number, Record<string, number>> = {};

    for (let i = 0; i < 4; i++) {
      const weekNum = Math.max(1, currentWeek - 3 + i);
      weekBuckets[weekNum] = {};
    }

    weeklyMetrics.forEach(m => {
      const capturedDate = new Date(m.captured_at);
      const weekNum = getWeekNumberStatic(capturedDate);
      if (weekBuckets[weekNum]) {
        // Keep the latest value per platform per week
        weekBuckets[weekNum][m.provider] = Number(m.value);
      }
    });

    return Object.entries(weekBuckets).map(([weekNum, platforms]) => {
      const point: Record<string, any> = { week: `Vecka ${weekNum}` };
      connectedPlatforms.forEach(p => {
        point[p] = platforms[p] || 0;
      });
      return point;
    });
  };

  const chartData = connections.length > 0
    ? buildChartData()
    : exampleData;

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
        <div data-tour="stats-row" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          data-tour="quick-links"
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
          data-tour="growth-chart"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold dashboard-heading-dark">Tillväxt</h3>
              {connections.length === 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Exempeldata
                </span>
              )}
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm dashboard-subheading-dark mb-4">
            {connections.length > 0
              ? 'Visar hur dina följare har ökat de senaste 4 veckorna per plattform.'
              : 'Koppla dina sociala medier för att se riktig tillväxtdata'}
          </p>
          {/* Platform legend */}
          <div className="flex flex-wrap gap-3 mb-3">
            {activePlatforms.map(p => {
              const color = platformColors[p];
              if (!color) return null;
              return (
                <div key={p} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                  <span className="text-xs text-muted-foreground">{color.label}</span>
                </div>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                {activePlatforms.map(p => {
                  const color = platformColors[p];
                  if (!color) return null;
                  return (
                    <linearGradient key={p} id={`gradient-${p}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color.stroke} stopOpacity={connections.length > 0 ? 0.3 : 0.15} />
                      <stop offset="95%" stopColor={color.stroke} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="week" className="fill-muted-foreground" fontSize={12} tick={{ fill: 'currentColor' }} stroke="currentColor" />
              <YAxis className="fill-muted-foreground" fontSize={12} tick={{ fill: 'currentColor' }} stroke="currentColor" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.85)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "white", fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => {
                  const color = platformColors[name];
                  return [formatNumber(value), color?.label || name];
                }}
              />
              {activePlatforms.map(p => {
                const color = platformColors[p];
                if (!color) return null;
                return (
                  <Area
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={color.stroke}
                    strokeWidth={2}
                    fill={`url(#gradient-${p})`}
                    strokeDasharray={connections.length === 0 ? "5 5" : undefined}
                  />
                );
              })}
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

        {/* Promo code banner for free_trial users with low credits */}
        {credits && credits.plan === 'free_trial' && credits.credits_left < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.4 }}
            className="liquid-glass-light p-5"
          >
            <PromoCodeInput
              variant="card"
              onSuccess={() => {}}
            />
          </motion.div>
        )}

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
