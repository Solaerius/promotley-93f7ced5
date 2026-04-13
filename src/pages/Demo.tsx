import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp, Users, Calendar, Zap, BarChart3, MessageSquare,
  ArrowRight, Wand2, Radar, Hash, Film, MessageCircle, Star,
  Leaf, Handshake, CalendarDays, Share2, Send, Lock, LogIn,
  LayoutDashboard, User, FileText, Image, Target, Lightbulb,
  ThumbsUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  demoCompany, demoStats, demoSocialStats, demoChartData,
  demoCalendarPosts, demoSalesRadar, demoChatMessages,
  demoAIResponses, demoTikTokVideos,
} from '@/data/demoData';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

const demoAIResponsesEn: Record<string, string> = {
  caption: `✨ Caption for @stockholmskaffet:\n\n"Monday tastes better with the right coffee ☕ We just got in our new single origin from Ethiopia — floral, bright and absolutely wonderful. Come in and try it, we'll treat you to the first tasting all Monday morning!\n\n#stockholmskaffet #newcoffee #ethiopiancoffee #specialtycoffee #stockholm #coffeelover #mondaymood #localcoffee"`,

  hashtags: `🏷️ Recommended hashtags for Stockholms Kaffet:\n\n**Volume (1M+):** #coffee #fika #stockholm #café\n**Medium (100k–1M):** #specialtycoffee #coffeeculture #stockholmcafe #swedishcoffee\n**Niche (<100k):** #stockholmskaffet #ethiopiancoffee #singleorigincoffee #coffeeroasting\n\n💡 Tip: Mix 3–4 volume tags with 4–5 niche tags for best organic reach on Instagram.`,

  contentIdeas: `💡 5 Content ideas for Stockholms Kaffet:\n\n1. **"Behind the scenes"** — Show the roasting process in a 30-sec Reel. Authentic and shareable.\n2. **"Coffee knowledge"** — Explain the difference between washed and natural process. Builds expert position.\n3. **"Customer portrait"** — Interview a regular about their morning routine. Strengthens community feel.\n4. **"Product teaser"** — A 3-part story series ahead of the next seasonal coffee. Creates anticipation.\n5. **"Before/after"** — Show the coffee bean from farm to cup in a single post. Storytelling that sells.`,

  weeklyPlan: `📅 Weekly plan for Stockholms Kaffet (w.12):\n\n**Monday:** Instagram Reel — Launch of new Ethiopian single origin\n**Tuesday:** Story poll — "Filter or espresso?" (boosts engagement)\n**Wednesday:** Post — Behind the scenes in the roastery\n**Thursday:** TikTok — "3 things you didn't know about coffee"\n**Friday:** Story — Weekend menu + reminder of opening hours\n**Saturday:** Reel — Customer moments / café atmosphere\n**Sunday:** Quote post — Coffee thought of the week\n\n⏰ Best posting times: 7–9 and 17–19 for your audience.`,

  campaign: `🎯 Campaign strategy: Easter launch 2025\n\n**Goal:** Increase store visits +20% during Easter weekend\n**Target audience:** Stockholm residents 25–45, coffee enthusiasts\n\n**Phase 1 – Teaser (w.13):** "Something new is coming" — mysterious stories, no details\n**Phase 2 – Launch (w.14):** Easter coffee + limited edition bag, Reel + press release\n**Phase 3 – Closing (w.15):** "Last chance" + UGC from customers, close with thank-you post\n\n**Channels:** Instagram (primary), TikTok (reach), email (loyal customers)\n**Budget:** 80% organic, 20% boosted content on Meta\n**KPIs:** Reach, store visits, UGC share`,

  ufTips: `🚀 UF tips for Stockholms Kaffet:\n\n1. **Trade fairs:** Sign up for the UF fair well in advance — your stand is your brand in front of judges and visitors\n2. **Annual report:** Start documenting sales and marketing efforts now, not in the last week\n3. **Social media:** Show the UF journey! Followers love authentic "we're building a company" stories\n4. **Collaborations:** Reach out to other UF companies for cross-promo — no competitors, only partners\n5. **Pricing:** Always include your working time in the price. Don't sell too cheaply — it undervalues the entire UF movement`,
};

const Demo = () => {
  const { t, i18n } = useTranslation();

  const demoNavTabs = useMemo(() => [
    { name: t('sections.demo.tab_dashboard'), value: "dashboard", icon: LayoutDashboard },
    { name: t('sections.demo.tab_analytics'), value: "analytics", icon: BarChart3 },
    { name: t('sections.demo.tab_ai'), value: "ai", icon: Wand2 },
    { name: t('sections.demo.tab_radar'), value: "radar", icon: Radar },
    { name: t('sections.demo.tab_calendar'), value: "calendar", icon: Calendar },
  ], [t]);

  const demoAITools = useMemo(() => [
    { icon: FileText, title: t('tools.caption_title'), description: t('tools.caption_desc'), color: "from-orange-500 to-red-500", responseKey: "caption" },
    { icon: Hash, title: t('tools.hashtag_title'), description: t('tools.hashtag_desc'), color: "from-blue-500 to-cyan-500", responseKey: "hashtags" },
    { icon: Image, title: t('tools.content_title'), description: t('tools.content_desc'), color: "from-purple-500 to-pink-500", responseKey: "contentIdeas" },
    { icon: Calendar, title: t('tools.weekly_title'), description: t('tools.weekly_desc'), color: "from-green-500 to-emerald-500", responseKey: "weeklyPlan" },
    { icon: Target, title: t('tools.campaign_title'), description: t('tools.campaign_desc'), color: "from-amber-500 to-orange-500", responseKey: "campaign" },
    { icon: Lightbulb, title: t('tools.uf_title'), description: t('tools.uf_desc'), color: "from-indigo-500 to-purple-500", responseKey: "ufTips" },
  ], [t]);
  const localizedLeads = useMemo(() => demoSalesRadar.leads.map((lead, i) => ({
    ...lead,
    titel: t(`demo_page.lead_${i}_title`),
    beskrivning: t(`demo_page.lead_${i}_desc`),
    action: t(`demo_page.lead_${i}_action`),
    potential: t(`demo_page.lead_${i}_potential`),
    prioritet: t(`demo_page.lead_${i}_priority`),
  })), [t]);

  const localizedTrends = useMemo(() => demoSalesRadar.trends.map((trend, i) => ({
    ...trend,
    titel: t(`demo_page.trend_${i}_title`),
    beskrivning: t(`demo_page.trend_${i}_desc`),
    tips: t(`demo_page.trend_${i}_tips`),
  })), [t]);

  const localizedCalendarPosts = useMemo(() => demoCalendarPosts.map((post, i) => ({
    ...post,
    title: t(`demo_page.cal_${i}_title`),
    description: t(`demo_page.cal_${i}_desc`),
  })), [t]);

  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiSubTab, setAiSubTab] = useState('chat');
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sortKey, setSortKey] = useState<'likes' | 'comments' | 'shares' | 'views' | 'rate'>('likes');
  const [sortAsc, setSortAsc] = useState(false);

  const handleDemoClick = useCallback((key: string) => {
    setClickCounts(prev => {
      const count = (prev[key] || 0) + 1;
      if (count > 1) {
        setShowLimitAlert(true);
        setTimeout(() => setShowLimitAlert(false), 4000);
      }
      return { ...prev, [key]: count };
    });
  }, []);

  const handleAIToolClick = useCallback((key: string) => {
    const count = (clickCounts[key] || 0) + 1;
    setClickCounts(prev => ({ ...prev, [key]: count }));

    if (count === 1) {
      const responses = i18n.language === 'sv' ? demoAIResponses : demoAIResponsesEn;
      const response = responses[key];
      if (response) {
        setAiResponses(prev => ({ ...prev, [key]: response }));
      }
    } else {
      setShowRegisterModal(true);
    }
  }, [clickCounts, i18n.language]);

  const isLimited = (key: string) => (clickCounts[key] || 0) > 1;

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const statsCards = [
    { title: t('demo_page.stat_followers'), value: formatNumber(demoStats.followers), icon: Users },
    { title: t('demo_page.stat_engagement'), value: demoStats.engagement + '%', icon: TrendingUp },
    { title: t('demo_page.stat_reach'), value: formatNumber(demoStats.reach), icon: BarChart3 },
    { title: t('demo_page.stat_credits'), value: demoStats.credits_left.toString(), icon: Zap },
  ];

  const getLeadIcon = (typ: string) => {
    switch (typ) {
      case 'kund': return Users;
      case 'samarbete': return Handshake;
      case 'event': return CalendarDays;
      case 'kanal': return Share2;
      default: return Zap;
    }
  };

  const getTrendIcon = (typ: string) => {
    switch (typ) {
      case 'hashtag': return Hash;
      case 'format': return Film;
      case 'ämne': return MessageCircle;
      case 'event': return Star;
      case 'säsong': return Leaf;
      default: return TrendingUp;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background like DashboardLayout */}
      <div className="fixed inset-0 z-0 bg-background" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(9 70% 45% / 0.3) 0%, transparent 70%)', filter: 'blur(100px)', top: '10%', right: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(331 50% 35% / 0.3) 0%, transparent 70%)', filter: 'blur(100px)', bottom: '10%', left: '-10%' }} />
      </div>

      {/* Demo Banner - fixed at top */}
      <div className="sticky top-0 z-[60] bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-lg text-white py-2.5 px-4 text-center">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm font-medium">
            {t('demo_page.banner', { name: demoCompany.foretagsnamn })}
          </span>
          <Link to="/auth?mode=register">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              {t('demo_page.create_account_free')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard-style Navbar - below banner */}
      <nav className="sticky top-[42px] z-50 mx-4 md:mx-6 lg:mx-12 mt-2 relative">
        <div
          className="rounded-2xl border border-white/20 dark:border-white/15 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--secondary) / 0.1) 50%, hsl(var(--accent) / 0.12) 100%)',
          }}
        >
          <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <img src={logo} alt="Promotley" className="w-7 h-7" />
                <span className="font-semibold text-sm text-foreground hidden sm:inline">Promotley</span>
              </Link>

              {/* Nav tabs */}
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {demoNavTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                        active
                          ? "text-foreground bg-foreground/15"
                          : "text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="demoActiveTab"
                          className="absolute inset-0 rounded-lg bg-foreground/10 border border-foreground/15"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 relative z-10" />
                      <span className="text-xs font-medium relative z-10 hidden md:inline">{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right side - demo user */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-foreground/10 border border-foreground/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-foreground/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Limit Alert */}
      {showLimitAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-28 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-md"
        >
          <Alert className="border-primary/40 bg-background shadow-lg">
            <Lock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-sm">{t('demo_page.limit_message')}</span>
              <Link to="/auth?mode=register">
                <Button size="sm" variant="gradient" className="text-xs whitespace-nowrap">
                  {t('demo_page.create_account_free')}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Company header */}
            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.2) 0%, hsl(331 70% 45% / 0.15) 100%)' }}>
              <h2 className="text-2xl font-bold text-foreground">{demoCompany.foretagsnamn}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('demo_page.company_branch')} · {t('demo_page.company_stad')}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {t('demo_page.company_keywords').split(',').map(k => (
                  <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl p-5 border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
                        style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.3) 0%, hsl(331 70% 45% / 0.2) 100%)' }}>
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                        <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Panel A: TikTok platform card */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-sm font-semibold text-foreground">TikTok</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Ansluten
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-2.5">
                {[
                  { label: "Följare", value: "1 167" },
                  { label: "Videos", value: "8" },
                  { label: "Gilla-markeringar", value: "22.8k" },
                  { label: "Följer", value: "87" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 bg-surface-raised border border-border/50">
                    <p className="text-xs mb-1.5 text-muted-foreground">{label}</p>
                    <p className="text-base font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel B: Most Commented + Top Content row */}
            <div className="grid lg:grid-cols-2 gap-3">
              {/* Most Commented */}
              <div className="rounded-2xl p-5 bg-card border border-border">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                    <MessageCircle className="h-3.5 w-3.5" style={{ color: "hsl(210 78% 62%)" }} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">Mest kommenterade</h2>
                </div>
                <div className="space-y-2.5">
                  {[...demoTikTokVideos]
                    .sort((a, b) => b.comments - a.comments)
                    .slice(0, 3)
                    .map((video) => (
                      <div key={video.id} className="flex items-center gap-3 rounded-xl p-2.5 bg-surface-raised border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                        <p className="text-xs font-medium flex-1 line-clamp-2 leading-tight text-foreground">{video.title || "—"}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold" style={{ color: "hsl(210 78% 62%)" }}>
                            {video.comments}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Content */}
              {(() => {
                const topVideo = [...demoTikTokVideos].sort((a, b) => b.likes - a.likes)[0];
                const engRate = topVideo.views > 0
                  ? (((topVideo.likes + topVideo.comments) / topVideo.views) * 100).toFixed(1)
                  : "0.0";
                return (
                  <div className="rounded-2xl p-5 bg-card border border-border">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                        <ThumbsUp className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">Toppinnehåll</h2>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 leading-snug mb-2 text-foreground">{topVideo.title || "—"}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: "Gillar", value: topVideo.likes.toLocaleString('sv') },
                            { label: "Visningar", value: topVideo.views.toLocaleString('sv') },
                            { label: "Kommentarer", value: topVideo.comments.toLocaleString('sv') },
                            { label: "Engagemang", value: `${engRate}%` },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg p-1.5 bg-surface-raised border border-border/50">
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                              <p className="text-xs font-bold text-foreground">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Panel C: Engagement Sparkline */}
            {(() => {
              const sparkData = [...demoTikTokVideos].slice(0, 8).reverse().map((v, i) => ({
                name: `${i + 1}`,
                rate: v.views > 0 ? parseFloat((((v.likes + v.comments) / v.views) * 100).toFixed(2)) : 0,
              }));
              return (
                <div className="rounded-2xl p-5 bg-card border border-border">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/60">
                      <BarChart3 className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent-brand))" }} />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground">Engagemangstrend</h2>
                    <span className="ml-auto text-xs text-muted-foreground">Engagemangsgrad</span>
                  </div>
                  <div style={{ height: 80 }}>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <RechartsTooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                          formatter={(val: number) => [`${val}%`, 'Engagemangsgrad']}
                        />
                        <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                          {sparkData.map((_, idx) => (
                            <Cell key={idx} fill={`hsl(var(--primary) / ${0.5 + (idx / sparkData.length) * 0.5})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Most Liked Analysis */}
            {(() => {
              const top5 = [...demoTikTokVideos].sort((a, b) => b.likes - a.likes).slice(0, 5);
              const avgDur = top5.filter(v => v.duration).reduce((s, v) => s + (v.duration || 0), 0) / (top5.filter(v => v.duration).length || 1);
              const dayCounts: Record<number, number> = {};
              top5.forEach(v => { if (v.created_at) { const d = new Date(v.created_at).getDay(); dayCounts[d] = (dayCounts[d] || 0) + 1; } });
              const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
              const bestDay = Object.entries(dayCounts).sort((a, b) => +b[1] - +a[1])[0];
              const bestDayName = bestDay ? dayNames[parseInt(bestDay[0])] : '–';
              const avgVPL = top5.filter(v => v.likes > 0).reduce((s, v) => s + v.views / v.likes, 0) / (top5.filter(v => v.likes > 0).length || 1);
              const stopWords = new Set(['och','en','ett','den','det','de','som','är','på','i','att']);
              const wordFreq: Record<string, number> = {};
              top5.forEach(v => {
                (v.title || '').toLowerCase().replace(/[^a-zåäö0-9\s]/g, '').split(/\s+/).forEach(w => {
                  if (w.length >= 4 && !stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
                });
              });
              const keywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
              const insights = [
                { label: "Genomsnittlig längd (topp 5)", value: avgDur > 0 ? `${Math.round(avgDur)}s` : '–', color: "hsl(var(--primary))" },
                { label: "Bästa dag att posta", value: bestDayName, color: "hsl(174 60% 50%)" },
                { label: "Visningar per gilla", value: avgVPL > 0 ? `${Math.round(avgVPL)}x` : '–', color: "hsl(var(--accent-brand))" },
                { label: "Vanliga nyckelord", value: keywords.length > 0 ? keywords.join(', ') : '–', color: "hsl(320 65% 62%)" },
              ];
              return (
                <div className="rounded-xl bg-card shadow-sm p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">Analys av mest gillade videor</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {insights.map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-3 bg-surface-raised border border-border/50">
                        <p className="text-[11px] text-muted-foreground leading-tight mb-2">{label}</p>
                        <p className="text-base font-bold text-foreground" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Engagement Breakdown Chart */}
            {(() => {
              const breakdownData = [...demoTikTokVideos].slice(0, 8).reverse().map((v, i) => ({
                name: v.title ? v.title.substring(0, 12) + '…' : `#${i+1}`,
                likes: v.likes, comments: v.comments, shares: v.shares,
              }));
              return (
                <div className="rounded-xl bg-card shadow-sm p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">Engagemangsfördelning</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={breakdownData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} />
                        <Bar dataKey="likes" stackId="a" fill="hsl(var(--primary))" />
                        <Bar dataKey="comments" stackId="a" fill="hsl(210 78% 62%)" />
                        <Bar dataKey="shares" stackId="a" fill="hsl(174 60% 50%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}

            {/* Content Performance Table */}
            {(() => {
              const fmt = (n: number) => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n);
              const tableData = [...demoTikTokVideos].map(v => ({
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
              return (
                <div className="rounded-xl bg-card shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground">Innehållsprestanda</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left text-[11px] font-medium text-muted-foreground px-3 py-2">Titel</th>
                          {(['likes','comments','shares','views','rate'] as const).map(col => (
                            <th key={col} onClick={() => handleSort(col)}
                              className="text-right text-[11px] font-medium text-muted-foreground px-3 py-2 cursor-pointer select-none hover:text-foreground">
                              {col === 'likes' ? 'Gillar' : col === 'comments' ? 'Kommentarer' : col === 'shares' ? 'Delningar' : col === 'views' ? 'Visningar' : 'Engagemang'}
                              {sortKey === col ? (sortAsc ? ' ↑' : ' ↓') : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((v, i) => (
                          <tr key={v.id} className={`border-t border-border/40 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                            <td className="px-3 py-2.5 max-w-[180px]">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-muted flex-shrink-0" />
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
          </motion.div>
        )}

        {/* AI & VERKTYG TAB */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* AI sub-tabs like real AIPage */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('demo_page.ai_assistant_title')}</h1>
              <p className="text-sm text-muted-foreground mb-4">{t('demo_page.ai_assistant_subtitle')}</p>

              <div className="inline-flex h-10 items-center justify-center rounded-full bg-muted/50 backdrop-blur-sm border border-border/40 p-1 mb-6">
                {[
                  { value: 'chat', label: t('demo_page.sub_chat'), icon: MessageSquare },
                  { value: 'verktyg', label: t('demo_page.sub_tools'), icon: Wand2 },
                  { value: 'analys', label: t('demo_page.sub_analysis'), icon: BarChart3 },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = aiSubTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setAiSubTab(tab.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm transition-all",
                        active
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Chat sub-tab */}
            {aiSubTab === 'chat' && (
              <div className="rounded-2xl p-6 bg-card border border-border/40">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> {t('demo_page.chat_title')}
                </h3>

                {/* Chat messages */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {demoChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${(msg.role as string) === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        (msg.role as string) === 'user'
                          ? 'bg-primary/20 text-foreground'
                          : 'backdrop-blur-sm border border-white/10 text-muted-foreground'
                      }`}>
                        {(msg.role as string) === 'assistant' ? t('demo_page.chat_message') : msg.message}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA above input */}
                <div className="text-center mb-3 py-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm text-foreground flex items-center justify-center gap-2 flex-wrap">
                    <Lock className="w-4 h-4 text-primary" />
                    {t('demo_page.chat_locked')}
                    <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">
                      {t('demo_page.chat_create_account')}
                    </Link>
                  </p>
                </div>

                {/* Chat input - disabled/locked */}
                <div className="flex gap-2 opacity-50 pointer-events-none">
                  <input
                    type="text"
                    disabled
                    placeholder={t('demo_page.chat_placeholder')}
                    className="flex-1 rounded-xl px-4 py-3 text-sm bg-background border border-border/40 text-foreground placeholder:text-muted-foreground/50 cursor-not-allowed"
                  />
                  <Button variant="gradient" size="icon" disabled>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* AI Verktyg sub-tab */}
            {aiSubTab === 'verktyg' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {demoAITools.map((tool) => (
                    <Card
                      key={tool.title}
                      className="group cursor-pointer liquid-glass-light hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => handleAIToolClick(tool.responseKey)}
                    >
                      <CardHeader className="pb-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-2`}>
                          <tool.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg flex items-center justify-between text-foreground">
                          {tool.title}
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-foreground/60" />
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">{tool.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {Object.entries(aiResponses).length > 0 && (
                  <div className="mt-6 space-y-4">
                    {Object.entries(aiResponses).map(([key, response]) => (
                      <div key={key} className="rounded-xl border border-border/50 bg-card/50 p-4">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{response}</pre>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="bg-card border border-border/40">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Wand2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-foreground">{t('demo_page.unlock_tools_title')}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {t('demo_page.unlock_tools_desc')}
                        </p>
                        <Link to="/auth?mode=register">
                          <Button variant="gradient" size="sm">
                            {t('demo_page.create_account_free')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Analys sub-tab */}
            {aiSubTab === 'analys' && (
              <div className="rounded-2xl p-6 bg-card border border-border/40">
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('demo_page.ai_analysis_of', { name: demoCompany.foretagsnamn })}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t('demo_page.analysis_summary')}</p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-green-400" /> {t('demo_page.strengths')}
                    </h4>
                    <ul className="space-y-1">
                      {[t('demo_page.strength_0'), t('demo_page.strength_1'), t('demo_page.strength_2')].map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" /> {t('demo_page.improvements')}
                    </h4>
                    <ul className="space-y-1">
                      {[t('demo_page.improvement_0'), t('demo_page.improvement_1'), t('demo_page.improvement_2')].map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-center mt-6 py-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm text-foreground flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    {t('demo_page.new_analysis_locked')}
                    <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">{t('demo_page.calendar_cta')}</Link>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SÄLJRADAR TAB */}
        {activeTab === 'radar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="liquid-glass-light border-primary/20">
              <CardContent className="p-5">
                <p className="text-foreground text-sm leading-relaxed">{t('demo_page.radar_summary')}</p>
              </CardContent>
            </Card>

            {/* Leads */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> {t('demo_page.leads_title')}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {localizedLeads.map((lead, i) => {
                  const Icon = getLeadIcon(lead.typ);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="liquid-glass-light hover:shadow-elegant transition-all h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground">{lead.titel}</h4>
                                <Badge variant={lead.prioritet === 'hög' || lead.prioritet === 'high' ? 'destructive' : 'default'} className="text-[10px]">{lead.prioritet}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{lead.beskrivning}</p>
                              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                <ArrowRight className="w-3 h-3" /> {lead.action}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 italic">{t('demo_page.potential')}: {lead.potential}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Trends */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> {t('demo_page.trends_title')}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {localizedTrends.map((trend, i) => {
                  const Icon = getTrendIcon(trend.typ);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="liquid-glass-light hover:shadow-elegant transition-all h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground">{trend.titel}</h4>
                                <Badge variant="outline" className="text-[10px] border-border/40">{trend.plattform}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{trend.beskrivning}</p>
                              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                <ArrowRight className="w-3 h-3" /> {trend.tips}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <Button variant="gradient" className="gap-2" onClick={() => handleDemoClick('radar')}>
              <Radar className="w-4 h-4" />
              {isLimited('radar') ? t('demo_page.radar_scan_locked') : t('demo_page.radar_scan_more')}
            </Button>
          </motion.div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl p-6 bg-card border border-border/40">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> {t('demo_page.calendar_title')}
              </h3>
              <div className="space-y-3">
                {localizedCalendarPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-background/50">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-muted-foreground">{new Date(post.date).toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-GB', { weekday: 'short' })}</p>
                      <p className="text-lg font-bold text-foreground">{new Date(post.date).getDate()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{post.platform}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t('demo_page.calendar_locked')} <Link to="/auth?mode=register" className="text-primary hover:underline">{t('demo_page.calendar_cta')}</Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-8 text-center border border-white/30"
          style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.25) 0%, hsl(331 70% 45% / 0.25) 100%)' }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {t('demo_page.cta_ready', { name: demoCompany.foretagsnamn })}
          </h3>
          <p className="text-muted-foreground mb-5 max-w-md mx-auto">
            {t('demo_page.cta_desc')}
          </p>
          <Link to="/auth?mode=register">
            <Button variant="gradient" size="lg" className="gap-2">
              {t('demo_page.create_account_free')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowRegisterModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-2xl p-8 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">{t('demo_page.modal_title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t('demo_page.modal_desc')}
            </p>

            <div className="flex flex-col gap-3">
              {/* Google */}
              <button
                onClick={async () => {
                  const { supabase } = await import('@/integrations/supabase/client');
                  supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  });
                }}
                className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t('demo_page.modal_google')}
              </button>

              {/* Apple */}
              <button
                onClick={async () => {
                  const { supabase } = await import('@/integrations/supabase/client');
                  supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  });
                }}
                className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>
                {t('demo_page.modal_apple')}
              </button>

              {/* Email */}
              <Link
                to="/auth?mode=register"
                className="block w-full py-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-sm font-medium text-center"
                onClick={() => setShowRegisterModal(false)}
              >
                {t('demo_page.modal_email')}
              </Link>
            </div>

            <button
              onClick={() => setShowRegisterModal(false)}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('demo_page.modal_close')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Demo;
