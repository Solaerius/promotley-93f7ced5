import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
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
  ExternalLink,
  TrendingUp,
  Clock,
  Calendar,
  Hash,
  Wand2,
  Flame,
  BookOpen,
} from "lucide-react";
import { useHookDatabase } from "@/hooks/useHookDatabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMetaData } from "@/hooks/useMetaData";
import { useTikTokData } from "@/hooks/useTikTokData";
import { useConnections } from "@/hooks/useConnections";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTikTokGrowth } from "@/hooks/useTikTokGrowth";
import { Link } from "react-router-dom";
import TikTokProfileSection from "@/components/TikTokProfileSection";
import { useTranslation } from 'react-i18next';
import { demoTikTokVideos, demoStats } from "@/data/demoData";

const fmt = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(1)+'k' : String(n);

// Accent colours per hook archetype for bar chart cells
const HOOK_COLORS: Record<string, string> = {
  question:  'hsl(326 56% 52%)',
  number:    'hsl(210 78% 62%)',
  pov:       'hsl(174 60% 50%)',
  story:     'hsl(35 90% 58%)',
  challenge: 'hsl(280 55% 62%)',
  other:     'hsl(var(--muted-foreground))',
};

const HookDatabaseSection = ({ videos, t }: { videos: any[]; t: (key: string) => string }) => {
  const { hookStats, topVideos, bestArchetype } = useHookDatabase(videos);

  if (videos.length < 3) {
    return (
      <div className="rounded-xl bg-card shadow-sm p-8 text-center">
        <Flame className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-sm font-semibold mb-1">{t('hooks.no_data_title')}</h3>
        <p className="text-xs text-muted-foreground">{t('hooks.no_data_desc')}</p>
      </div>
    );
  }

  // Static UF hook templates
  const templates = [
    t('hooks.template_1'),
    t('hooks.template_2'),
    t('hooks.template_3'),
    t('hooks.template_4'),
    t('hooks.template_5'),
  ];

  return (
    <div className="rounded-xl bg-card shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Flame className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('hooks.title')}</h3>
          <p className="text-[11px] text-muted-foreground">{t('hooks.subtitle')}</p>
        </div>
        {bestArchetype && (
          <span
            className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${HOOK_COLORS[bestArchetype]} 18%, transparent)`, color: HOOK_COLORS[bestArchetype] }}
          >
            {t('hooks.best_hook')}: {t(`hooks.type_${bestArchetype}`)}
          </span>
        )}
      </div>

      {/* Bar chart: avg views per hook type */}
      {hookStats.length > 0 && (
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hookStats} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="archetype" tickFormatter={(v) => t(`hooks.type_${v}`)} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={fmt} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }}
                formatter={(val: number, _: string, entry: any) => [fmt(val), t('hooks.avg_views')]}
                labelFormatter={(label) => t(`hooks.type_${label}`)}
              />
              <Bar dataKey="avgViews" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {hookStats.map((entry) => (
                  <Cell key={entry.archetype} fill={HOOK_COLORS[entry.archetype] ?? HOOK_COLORS.other} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 5 videos with archetype badge */}
      {topVideos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('hooks.top_videos')}</p>
          <div className="space-y-2">
            {topVideos.map((v) => (
              <div key={v.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40">
                {v.cover_image_url ? (
                  <img src={v.cover_image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{v.title || '–'}</p>
                  <p className="text-[10px] text-muted-foreground">{fmt(v.views || 0)} {t('hooks.avg_views').toLowerCase()}</p>
                </div>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${HOOK_COLORS[v.archetype] ?? HOOK_COLORS.other} 18%, transparent)`, color: HOOK_COLORS[v.archetype] ?? HOOK_COLORS.other }}
                >
                  {t(`hooks.type_${v.archetype}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static hook templates for UF companies */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">{t('hooks.templates_title')}</p>
        </div>
        <ul className="space-y-1.5">
          {templates.map((tpl, i) => (
            <li key={i} className="text-xs text-foreground/80 bg-muted/40 rounded-lg px-3 py-1.5 italic">{tpl}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const AnalyticsContent = () => {
  const { t } = useTranslation();
  const { isConnected, connections, loading: connectionsLoading } = useConnections();
  // Only fetch platform data when connections are confirmed — avoids error toasts for unconnected accounts
  const metaData = useMetaData({ enabled: !connectionsLoading && isConnected('meta_ig') });
  const tiktokData = useTikTokData({ enabled: !connectionsLoading && isConnected('tiktok') });
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();
  const { data: growthData, hasData: hasGrowthData } = useTikTokGrowth();

  const [sortKey, setSortKey] = useState<'likes' | 'comments' | 'shares' | 'views' | 'rate'>('likes');
  const [sortAsc, setSortAsc] = useState(false);

  const hasConnections = connections.length > 0;

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

  const isExampleMode = !hasConnections;
  const effectiveVideos = isExampleMode ? demoTikTokVideos : tiktokData.videos;

  // Demo engagement trend data for example mode (8 weeks, realistic rates)
  const demoEngagementData = [
    { date: 'V1', engagementRate: 3.2, likes: 210, views: 6500 },
    { date: 'V2', engagementRate: 3.8, likes: 290, views: 7600 },
    { date: 'V3', engagementRate: 4.1, likes: 340, views: 8300 },
    { date: 'V4', engagementRate: 3.6, likes: 280, views: 7800 },
    { date: 'V5', engagementRate: 4.9, likes: 430, views: 8800 },
    { date: 'V6', engagementRate: 5.3, likes: 510, views: 9600 },
    { date: 'V7', engagementRate: 4.7, likes: 420, views: 8900 },
    { date: 'V8', engagementRate: 5.8, likes: 580, views: 10000 },
  ];

  // Compute engagement rate from real growth data
  const engagementChartData = isExampleMode
    ? demoEngagementData
    : (growthData || []).map((d: any) => ({
        date: d.date,
        engagementRate: d.views > 0 ? parseFloat(((d.likes / d.views) * 100).toFixed(1)) : 0,
        likes: d.likes,
        views: d.views,
      }));
  const hasEngagementData = engagementChartData.length > 0;

  const stats = [];
  if (isConnected('meta_ig') || isConnected('tiktok') || isExampleMode) stats.push({ title: t('analytics.total_followers'), value: isExampleMode ? demoStats.followers.toLocaleString() : connectedStats.totalFollowers.toLocaleString(), icon: Users });
  if (isConnected('tiktok') || isExampleMode) stats.push({ title: t('analytics.views'), value: isExampleMode ? demoStats.views.toLocaleString() : connectedStats.totalViews.toLocaleString(), icon: Eye });
  if (isConnected('tiktok') || isExampleMode) stats.push({ title: t('analytics.likes'), value: isExampleMode ? demoStats.likes.toLocaleString() : connectedStats.totalLikes.toLocaleString(), icon: Heart });
  if (isConnected('tiktok') || isExampleMode) stats.push({ title: t('analytics.comments'), value: isExampleMode ? demoStats.comments.toLocaleString() : connectedStats.totalComments.toLocaleString(), icon: MessageCircle });

  return (
    <div className="space-y-4">
      {isExampleMode && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground mb-4">
          <Wand2 className="h-4 w-4 text-primary shrink-0" />
          <span>{t('analytics.example_banner_text')}</span>
          <Link to="/settings?tab=app" className="ml-auto text-xs font-medium text-primary hover:underline shrink-0">{t('analytics.example_connect_link')}</Link>
        </div>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <div data-tour="analytics-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-xl bg-card shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
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
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card shadow-sm p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">{t('analytics.follower_growth')}</h3>
          {hasGrowthData ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend />
                <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} name={t('analytics.instagram_followers')} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{t('analytics.growth_no_data')}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-card shadow-sm p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">{t('analytics.engagement_chart')}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t('analytics.engagement_rate_label')}</p>
          {hasEngagementData ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={engagementChartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
                  formatter={(val: number) => [`${val}%`, t('analytics.engagement_rate')]}
                />
                <Legend formatter={() => t('analytics.engagement_rate')} wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="engagementRate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name={t('analytics.engagement_rate')}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{t('analytics.engagement_no_data')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="rounded-xl bg-card shadow-sm p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">{t('analytics.platform_overview')}</h3>
        <Tabs defaultValue={isConnected('meta_ig') ? 'instagram' : 'tiktok'} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg p-1">
            <TabsTrigger value="instagram" className={`rounded-md text-sm ${!isConnected('meta_ig') ? 'opacity-50' : ''}`}>
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok" className={`rounded-md text-sm ${!isConnected('tiktok') ? 'opacity-50' : ''}`}>
              <Music2 className="w-4 h-4 mr-2" />
              TikTok
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instagram" className="pt-4">
            {isConnected('meta_ig') && metaData.instagram ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('analytics.instagram_followers'), value: metaData.instagram.followers_count },
                  { label: t('analytics.instagram_following'), value: metaData.instagram.follows_count },
                  { label: t('analytics.instagram_posts'), value: metaData.instagram.media_count },
                  { label: t('analytics.instagram_name'), value: metaData.instagram.name },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-base font-semibold text-foreground">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('analytics.connect_instagram')}</p>
            )}
          </TabsContent>

          <TabsContent value="tiktok" className="pt-4">
            {isConnected('tiktok') ? (
              <TikTokProfileSection />
            ) : (
              <p className="text-sm text-muted-foreground">{t('analytics.connect_tiktok')}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Most Liked Analysis */}
      {(isConnected('tiktok') || isExampleMode) && effectiveVideos.length >= 3 && (() => {
        const sorted = [...effectiveVideos].sort((a, b) => b.likes - a.likes);
        const top5 = sorted.slice(0, 5);
        const overall = effectiveVideos;

        // Average duration
        const avgDurTop = top5.filter(v => v.duration).reduce((s, v) => s + (v.duration || 0), 0) / (top5.filter(v => v.duration).length || 1);
        const avgDurAll = overall.filter(v => v.duration).reduce((s, v) => s + (v.duration || 0), 0) / (overall.filter(v => v.duration).length || 1);

        // Best posting day
        const dayCounts: Record<number, number> = {};
        top5.forEach(v => {
          if (!v.created_at) return;
          const day = new Date(v.created_at).getDay();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const dayNames = [t('analytics.day_sun'), t('analytics.day_mon'), t('analytics.day_tue'), t('analytics.day_wed'), t('analytics.day_thu'), t('analytics.day_fri'), t('analytics.day_sat')];
        const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const bestDayName = bestDay ? dayNames[parseInt(bestDay[0])] : '–';

        // Views per like ratio
        const avgVPL = top5.filter(v => v.likes > 0)
          .reduce((s, v) => s + (v.views / v.likes), 0) / (top5.filter(v => v.likes > 0).length || 1);

        // Common keywords from titles
        const stopWords = new Set(['och', 'en', 'ett', 'den', 'det', 'de', 'som', 'är', 'på', 'i', 'att', 'the', 'a', 'an', 'and', 'of', 'to', 'in', 'is', 'it']);
        const wordFreq: Record<string, number> = {};
        top5.forEach(v => {
          (v.title || '').toLowerCase().replace(/[^a-zåäö0-9\s]/g, '').split(/\s+/).forEach(w => {
            if (w.length >= 4 && !stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
          });
        });
        const topKeywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);

        const insights = [
          {
            icon: Clock,
            label: t('analytics.avg_duration_top'),
            value: avgDurTop > 0 ? `${Math.round(avgDurTop)}s` : '–',
            sub: avgDurAll > 0 && avgDurTop > 0 ? `${avgDurTop > avgDurAll ? '+' : ''}${Math.round(avgDurTop - avgDurAll)}s ${t('analytics.vs_average')}` : undefined,
            color: "hsl(var(--primary))",
          },
          {
            icon: Calendar,
            label: t('analytics.best_posting_day'),
            value: bestDayName,
            color: "hsl(174 60% 50%)",
          },
          {
            icon: TrendingUp,
            label: t('analytics.views_likes_ratio'),
            value: avgVPL > 0 ? `${Math.round(avgVPL)}x` : '–',
            color: "hsl(var(--accent-brand))",
          },
          {
            icon: Hash,
            label: t('analytics.common_keywords'),
            value: topKeywords.length > 0 ? topKeywords.join(', ') : '–',
            color: "hsl(320 65% 62%)",
          },
        ];

        return (
          <div className="rounded-xl bg-card shadow-sm p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">{t('analytics.most_liked_analysis')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {insights.map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="rounded-xl p-3 bg-surface-raised border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                  </div>
                  <p className="text-base font-bold text-foreground">{value}</p>
                  {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Engagement Breakdown Chart */}
      {(isConnected('tiktok') || isExampleMode) && effectiveVideos.length > 0 && (() => {
        const breakdownData = [...effectiveVideos]
          .slice(0, 10)
          .reverse()
          .map((v, i) => ({
            name: v.title ? v.title.substring(0, 12) + (v.title.length > 12 ? '…' : '') : `#${i + 1}`,
            likes: v.likes,
            comments: v.comments,
            shares: v.shares,
          }));

        return (
          <div className="rounded-xl bg-card shadow-sm p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">{t('analytics.engagement_breakdown')}</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={breakdownData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="25%" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
                    formatter={(val: number, key: string) => [val.toLocaleString(), key === 'likes' ? t('analytics.col_likes') : key === 'comments' ? t('analytics.col_comments') : t('analytics.col_shares')]}
                  />
                  <Legend formatter={(key) => key === 'likes' ? t('analytics.col_likes') : key === 'comments' ? t('analytics.col_comments') : t('analytics.col_shares')} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="likes" fill="hsl(326 56% 52%)" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="comments" fill="hsl(260 55% 65%)" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="shares" fill="hsl(174 45% 52%)" radius={[3, 3, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Hook Database */}
      {(isConnected('tiktok') || isExampleMode) && <HookDatabaseSection videos={effectiveVideos} t={t} />}

      {/* Content Performance Table */}
      {(isConnected('tiktok') || isExampleMode) && effectiveVideos.length > 0 && (() => {
        const tableData = [...effectiveVideos].map(v => ({
          ...v,
          rate: v.views > 0 ? parseFloat((((v.likes + v.comments) / v.views) * 100).toFixed(1)) : 0,
        })).sort((a, b) => {
          const va = a[sortKey === 'rate' ? 'rate' : sortKey] as number;
          const vb = b[sortKey === 'rate' ? 'rate' : sortKey] as number;
          return sortAsc ? va - vb : vb - va;
        });

        const handleSort = (key: typeof sortKey) => {
          if (sortKey === key) setSortAsc(p => !p);
          else { setSortKey(key); setSortAsc(false); }
        };

        const SortHeader = ({ col, label }: { col: typeof sortKey; label: string }) => (
          <th
            onClick={() => handleSort(col)}
            className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2 cursor-pointer select-none hover:text-foreground transition-colors"
          >
            {label} {sortKey === col ? (sortAsc ? '↑' : '↓') : ''}
          </th>
        );

        return (
          <div className="rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">{t('analytics.content_performance')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">{t('analytics.col_title')}</th>
                    <SortHeader col="likes" label={t('analytics.col_likes')} />
                    <SortHeader col="comments" label={t('analytics.col_comments')} />
                    <SortHeader col="shares" label={t('analytics.col_shares')} />
                    <SortHeader col="views" label={t('analytics.col_views')} />
                    <SortHeader col="rate" label={t('analytics.col_engagement')} />
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((v, i) => (
                    <tr key={v.id} className={`border-t border-border/40 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <div className="flex items-center gap-2">
                          {v.cover_image_url ? (
                            <img src={v.cover_image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-muted flex-shrink-0" />
                          )}
                          <span className="text-xs text-foreground line-clamp-1">{v.title || '–'}</span>
                        </div>
                      </td>
                      <td className="text-right px-3 py-2.5 text-xs font-medium text-foreground">{fmt(v.likes)}</td>
                      <td className="text-right px-3 py-2.5 text-xs text-foreground">{fmt(v.comments)}</td>
                      <td className="text-right px-3 py-2.5 text-xs text-foreground">{fmt(v.shares)}</td>
                      <td className="text-right px-3 py-2.5 text-xs text-foreground">{fmt(v.views)}</td>
                      <td className="text-right px-3 py-2.5 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{v.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AnalyticsContent;
