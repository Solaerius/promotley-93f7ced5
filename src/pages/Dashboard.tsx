import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  TrendingUp, Users, Calendar, Zap, BarChart3,
  MessageSquare, CheckCircle2, Wand2, ChevronRight,
  ExternalLink, MessageCircle, ThumbsUp,
} from "lucide-react";
import { demoTikTokVideos, demoStats } from "@/data/demoData";
import { useConnections } from "@/hooks/useConnections";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCalendar } from "@/hooks/useCalendar";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { sv } from "date-fns/locale";
import { enUS } from "date-fns/locale/en-US";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, BarChart, Bar, Cell,
} from "recharts";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

const getISOWeek = (dateStr: string | null, fallback: number): string => {
  if (!dateStr) return `V${fallback + 1}`;
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `V${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)}`;
};

// ─────────────────────────────────────────────
// PlatformCard sub-component
// ─────────────────────────────────────────────
const PlatformCard = ({
  title,
  icon,
  iconBg,
  isConnected: connected,
  isLoading,
  accentColor,
  metrics,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  isConnected: boolean;
  isLoading: boolean;
  accentColor: string;
  metrics: { label: string; value: string | number }[];
}) => {
  const { t } = useTranslation();
  return (
  <div className="rounded-2xl overflow-hidden bg-card border border-border">
    {/* Header */}
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold text-foreground">
        {title}
      </span>
      <div className="ml-auto">
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(142 55% 55%)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(142 55% 55%)" }}
            />
            {t('dashboard.connected')}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t('dashboard.not_connected')}
          </span>
        )}
      </div>
    </div>

    {/* Body */}
    <div className="p-5">
      {!connected ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-muted/50 border border-border">
            <div className="text-muted-foreground">{icon}</div>
          </div>
          <p className="text-sm font-medium mb-1 text-muted-foreground">
            {t('dashboard.no_account_connected', { platform: title })}
          </p>
          <p className="text-xs mb-4 text-muted-foreground/70">
            {t('dashboard.connect_to_see_stats')}
          </p>
          <Link to="/settings?tab=app">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              {t('dashboard.connect_account')}
            </Button>
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-3 animate-pulse bg-muted/40"
            >
              <div className="h-2.5 rounded w-14 mb-2.5 bg-muted" />
              <div className="h-5 rounded w-10 bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 bg-surface-raised border border-border/50"
            >
              <p className="text-xs mb-1.5 text-muted-foreground">
                {label}
              </p>
              <p
                className="text-base font-bold truncate"
                style={{ color: accentColor }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'sv' ? sv : enUS;
  const { user } = useAuth();
  const { isConnected, connections, loading: connectionsLoading } = useConnections();
  const tiktokData = useTikTokData({ enabled: !connectionsLoading && isConnected("tiktok") });
  const { credits } = useUserCredits();
  const { posts } = useCalendar();
  const [recentActivity, setRecentActivity] = useState<
    { type: string; icon: React.ElementType; label: string; detail: string; time: string }[]
  >([]);
  const [followerHistory, setFollowerHistory] = useState<{ date: string; followers: number }[]>([]);

  const upcomingPosts = posts?.filter((p) => new Date(p.date) >= new Date()).slice(0, 4) || [];

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "där";

  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      const activities: { type: string; icon: React.ElementType; label: string; detail: string; time: string }[] = [];
      const { data: aiMessages, error: activityError } = await supabase
        .from("ai_chat_messages")
        .select("created_at, message")
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!activityError && aiMessages) {
        aiMessages.forEach((msg) => {
          activities.push({
            type: "ai",
            icon: Wand2,
            label: t('dashboard.activity_ai'),
            detail: msg.message.substring(0, 50) + (msg.message.length > 50 ? "…" : ""),
            time: msg.created_at,
          });
        });
      }
      upcomingPosts.forEach((post) => {
        activities.push({ type: "post", icon: Calendar, label: t('dashboard.activity_post'), detail: post.title, time: post.date });
      });
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
    };
    fetchActivity();
  }, [user?.id, posts]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchFollowerHistory = async () => {
      const { data } = await supabase
        .from("social_stats")
        .select("followers, updated_at, platform")
        .eq("user_id", user.id)
        .order("updated_at");
      if (data && data.length >= 2) {
        const mapped = data.map((row) => ({
          date: format(new Date(row.updated_at), "d MMM", { locale: dateLocale }),
          followers: row.followers || 0,
        }));
        setFollowerHistory(mapped);
      }
    };
    fetchFollowerHistory();
  }, [user?.id]);

  const isExampleMode = !isConnected("tiktok") && tiktokData.videos.length === 0;
  const effectiveVideos = isExampleMode ? demoTikTokVideos : tiktokData.videos;
  const effectiveTikTokUser = isExampleMode
    ? { follower_count: demoStats.followers, video_count: demoTikTokVideos.length, likes_count: demoStats.likes, following_count: 87 }
    : tiktokData.user;

  const totalFollowers = isConnected("tiktok")
    ? (tiktokData.user?.follower_count || 0)
    : isExampleMode
      ? demoStats.followers
      : 0;

  // ── Stat card definitions ──────────────────
  const statCards = [
    {
      label: t('dashboard.total_followers'),
      value: formatNumber(totalFollowers),
      sub: t('dashboard.all_platforms'),
      icon: Users,
      accent: "hsl(var(--foreground))",
      bg: "hsl(var(--primary) / 0.12)",
      border: "hsl(var(--primary) / 0.2)",
      iconAccent: "hsl(var(--primary))",
    },
    {
      label: t('dashboard.ai_credits'),
      value: String(credits?.credits_left ?? 0),
      sub: t('dashboard.available'),
      icon: Zap,
      accent: "hsl(var(--foreground))",
      bg: "hsl(var(--muted) / 0.5)",
      border: "hsl(38 60% 38% / 0.25)",
      iconAccent: "hsl(var(--accent-brand))",
    },
    {
      label: t('dashboard.upcoming_posts_stat'),
      value: String(upcomingPosts.length),
      sub: t('dashboard.scheduled'),
      icon: Calendar,
      accent: "hsl(var(--foreground))",
      bg: "hsl(var(--muted) / 0.5)",
      border: "hsl(174 40% 32% / 0.25)",
      iconAccent: "hsl(174 60% 50%)",
    },
    {
      label: t('dashboard.connected_accounts'),
      value: String(connections.length),
      sub: t('dashboard.platforms'),
      icon: TrendingUp,
      accent: "hsl(var(--foreground))",
      bg: "hsl(var(--muted) / 0.5)",
      border: "hsl(320 40% 34% / 0.25)",
      iconAccent: "hsl(320 65% 62%)",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-start justify-between gap-4 pb-1"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t('dashboard.greeting', { name: firstName })}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.overview_subtitle')} —{" "}
                {format(new Date(), "EEEE d MMMM", { locale: dateLocale })}
              </p>
            </div>
            <Link to="/ai">
              <Button
                size="sm"
                className="gap-2 h-9 shrink-0 font-medium"
                style={{
                  background: "hsl(var(--primary))",
                  color: "white",
                  border: "none",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.4)",
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                {t('dashboard.ai_tools_btn')}
              </Button>
            </Link>
          </motion.div>

          {isExampleMode && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
              <Wand2 className="h-4 w-4 text-primary shrink-0" />
              <span>{t('analytics.example_banner_text')}</span>
              <Link to="/settings?tab=app" className="ml-auto text-xs font-medium text-primary hover:underline shrink-0">{t('analytics.example_connect_link')}</Link>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div data-tour="stats-row" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, value, sub, icon: Icon, accent, bg, border, iconAccent }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i + 0.08, duration: 0.32, ease: "easeOut" }}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-3.5 bottom-3.5 w-0.5 rounded-r-full"
                  style={{ background: iconAccent }}
                />
                <div className="flex items-start justify-between mb-3 pl-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider leading-tight text-muted-foreground">
                    {label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${iconAccent} 15%, transparent)` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: iconAccent }} />
                  </div>
                </div>
                <p className="text-3xl font-bold pl-2.5 leading-none mb-1 text-foreground">
                  {value}
                </p>
                <p className="text-xs pl-2.5 text-muted-foreground">
                  {sub}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── Platform row ── */}
          <PlatformCard
            title="TikTok"
            icon={<TikTokIcon className="h-4 w-4" style={{ color: "white" }} />}
            iconBg="hsl(0 0% 50% / 0.15)"
            isConnected={isConnected("tiktok") || isExampleMode}
            isLoading={tiktokData.loading}
            accentColor="hsl(var(--foreground))"
            metrics={[
              { label: t('dashboard.metric_followers'), value: formatNumber(effectiveTikTokUser?.follower_count ?? 0) },
              { label: t('dashboard.metric_videos'), value: effectiveTikTokUser?.video_count ?? 0 },
              { label: t('dashboard.metric_likes'), value: formatNumber(effectiveTikTokUser?.likes_count ?? 0) },
              { label: t('dashboard.metric_following'), value: effectiveTikTokUser?.following_count ?? 0 },
            ]}
          />

          {/* ── Most Commented + Top Content row ── */}
          <div data-tour="growth-chart" className="grid lg:grid-cols-2 gap-3">
            {/* Most Commented */}
            {(isConnected("tiktok") || isExampleMode) && effectiveVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.32, ease: "easeOut" }}
                className="rounded-2xl p-5 bg-card border border-border"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                    <MessageCircle className="h-3.5 w-3.5" style={{ color: "hsl(210 78% 62%)" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.most_commented')}
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {[...effectiveVideos]
                    .sort((a, b) => b.comments - a.comments)
                    .slice(0, 3)
                    .map((video) => (
                      <div key={video.id} className="flex items-center gap-3 rounded-xl p-2.5 bg-surface-raised border border-border/50">
                        {video.cover_image_url ? (
                          <img
                            src={video.cover_image_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium flex-1 line-clamp-2 leading-tight text-foreground">
                          {video.title || "—"}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold" style={{ color: "hsl(210 78% 62%)" }}>
                            {formatNumber(video.comments)}
                          </span>
                        </div>
                        {video.share_url && (
                          <a href={video.share_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Top Content */}
            {(isConnected("tiktok") || isExampleMode) && effectiveVideos.length > 0 && (() => {
              const topVideo = [...effectiveVideos].sort((a, b) => b.likes - a.likes)[0];
              const engRate = topVideo.views > 0
                ? (((topVideo.likes + topVideo.comments) / topVideo.views) * 100).toFixed(1)
                : "0.0";
              return (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, duration: 0.32, ease: "easeOut" }}
                  className="rounded-2xl p-5 bg-card border border-border"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                      <ThumbsUp className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {t('dashboard.top_content')}
                    </h2>
                  </div>
                  <div className="flex gap-3">
                    {topVideo.cover_image_url ? (
                      <img src={topVideo.cover_image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 leading-snug mb-2 text-foreground">{topVideo.title || "—"}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: t('dashboard.metric_likes'), value: formatNumber(topVideo.likes) },
                          { label: t('dashboard.metric_views'), value: formatNumber(topVideo.views) },
                          { label: t('dashboard.metric_comments'), value: formatNumber(topVideo.comments) },
                          { label: t('dashboard.metric_engagement_rate'), value: `${engRate}%` },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg p-1.5 bg-surface-raised border border-border/50">
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                            <p className="text-xs font-bold text-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>

          {/* ── Engagement Sparkline ── */}
          {(isConnected("tiktok") || isExampleMode) && effectiveVideos.length >= 3 && (() => {
            const sparkData = [...effectiveVideos]
              .slice(0, 8)
              .reverse()
              .map((v, i) => ({
                name: `${i + 1}`,
                rate: v.views > 0 ? parseFloat((((v.likes + v.comments) / v.views) * 100).toFixed(2)) : 0,
              }));
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.35 }}
                className="rounded-2xl p-5 bg-card border border-border"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                    <BarChart3 className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent-brand))" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">{t('dashboard.engagement_trend')}</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{t('dashboard.metric_engagement_rate')}</span>
                </div>
                <div style={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(val: number) => [`${val}%`, t('dashboard.metric_engagement_rate')]}
                      />
                      <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                        {sparkData.map((_, idx) => (
                          <Cell key={idx} fill={`hsl(var(--primary) / ${0.5 + (idx / sparkData.length) * 0.5})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })()}

          {/* ── Follower chart ── */}
          {followerHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              className="rounded-2xl p-5 bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.3)" }}
                  >
                    <BarChart3 className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.follower_history')}
                  </h2>
                </div>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}
                >
                  {t('dashboard.data_points', { count: followerHistory.length })}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={followerHistory}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    cursor={{ stroke: "hsl(var(--primary) / 0.3)", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(var(--primary))"
                    fill="url(#followerGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* ── Posts + Activity row ── */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-3">
            {/* Upcoming posts */}
            <div
              className="rounded-2xl p-5 bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60 dark:bg-[hsl(174_40%_13%)]">
                    <Calendar className="h-3.5 w-3.5" style={{ color: "hsl(174 60% 52%)" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.upcoming_posts')}
                  </h2>
                </div>
                <Link
                  to="/calendar"
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {t('dashboard.view_analytics')} →
                </Link>
              </div>

              {upcomingPosts.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {upcomingPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-xl p-3.5 bg-surface-raised border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: "hsl(174 60% 50% / 0.15)",
                            color: "hsl(174 60% 40%)",
                          }}
                        >
                          {format(new Date(post.date), "d MMM", { locale: dateLocale })}
                        </span>
                        {post.platform && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "hsl(var(--primary) / 0.2)",
                              color: "hsl(var(--primary))",
                            }}
                          >
                            {post.platform}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium line-clamp-2 leading-snug text-foreground">
                        {post.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-8 text-center rounded-xl bg-surface-raised border border-border/50"
                >
                  <Calendar className="h-7 w-7 mb-2.5 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1 text-muted-foreground">
                    {t('dashboard.no_posts')}
                  </p>
                  <p className="text-xs mb-4 text-muted-foreground/70">
                    {t('dashboard.plan_content_in_calendar')}
                  </p>
                  <Link to="/calendar">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      {t('dashboard.schedule_post')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent activity — timeline */}
            {recentActivity.length > 0 && (
              <div
                className="rounded-2xl p-5 bg-card border border-border"
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60 dark:bg-[hsl(38_50%_13%)]">
                    <Wand2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent-brand))" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.recent_activity')}
                  </h2>
                </div>

                {/* Timeline */}
                <div className="relative pl-5">
                  <div className="absolute left-2 top-1.5 bottom-1.5 w-px bg-border" />
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => {
                      const Icon = activity.icon;
                      return (
                        <div key={i} className="relative flex items-start gap-3">
                          {/* Timeline dot */}
                          <div
                            className="absolute -left-5 top-1.5 w-2 h-2 rounded-full border"
                            style={{
                              background: "hsl(var(--card))",
                              borderColor: "hsl(var(--primary))",
                            }}
                          />
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: "hsl(var(--primary) / 0.15)" }}
                          >
                            <Icon className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold leading-tight mb-0.5 text-foreground">
                              {activity.label}
                            </p>
                            <p className="text-xs leading-tight truncate text-muted-foreground">
                              {activity.detail}
                            </p>
                            <p className="text-xs mt-0.5 text-muted-foreground/60">
                              {formatDistanceToNow(new Date(activity.time), {
                                addSuffix: true,
                                locale: sv,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Quick actions ── */}
          <div data-tour="quick-links" className="grid sm:grid-cols-3 gap-3">
            {[
              {
                label: t('dashboard.quick_caption'),
                desc: t('dashboard.quick_caption_desc'),
                icon: MessageSquare,
                href: "/ai/caption",
                accent: "hsl(28 88% 60%)",
                iconBg: "hsl(28 60% 45% / 0.15)",
              },
              {
                label: t('dashboard.quick_hashtag'),
                desc: t('dashboard.quick_hashtag_desc'),
                icon: CheckCircle2,
                href: "/ai/hashtags",
                accent: "hsl(210 78% 62%)",
                iconBg: "hsl(210 50% 45% / 0.15)",
              },
              {
                label: t('dashboard.quick_campaign'),
                desc: t('dashboard.quick_campaign_desc'),
                icon: Zap,
                href: "/ai/campaign",
                accent: "hsl(var(--primary))",
                iconBg: "hsl(var(--primary) / 0.15)",
              },
            ].map(({ label, desc, icon: Icon, href, accent, iconBg }) => (
              <Link key={label} to={href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="rounded-2xl p-4 group cursor-pointer transition-all duration-200 bg-card border border-border hover:border-border/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: iconBg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-0.5 leading-tight text-foreground">
                        {label}
                      </p>
                      <p className="text-xs leading-snug text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 text-muted-foreground" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
