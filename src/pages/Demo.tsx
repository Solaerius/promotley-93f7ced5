import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp, Users, Calendar, Zap, BarChart3, MessageSquare,
  ArrowRight, Sparkles, Radar, Hash, Film, MessageCircle, Star,
  Leaf, Handshake, CalendarDays, Share2, Send, Lock, LogIn,
  LayoutDashboard, User, Wand2, FileText, Image, Target, Lightbulb,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  demoCompany, demoStats, demoSocialStats, demoChartData,
  demoCalendarPosts, demoSalesRadar, demoAIAnalysis, demoChatMessages,
  DEMO_LIMIT_MESSAGE,
} from '@/data/demoData';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

const demoNavTabs = [
  { name: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { name: "Statistik", value: "analytics", icon: BarChart3 },
  { name: "AI & Verktyg", value: "ai", icon: Sparkles },
  { name: "Säljradar", value: "radar", icon: Radar },
  { name: "Kalender", value: "calendar", icon: Calendar },
];

const demoAITools = [
  { icon: FileText, title: "Caption-generator", description: "Skapa engagerande captions för dina inlägg", color: "from-orange-500 to-red-500" },
  { icon: Hash, title: "Hashtag-förslag", description: "Få relevanta hashtags för ökad räckvidd", color: "from-blue-500 to-cyan-500" },
  { icon: Image, title: "Content-idéer", description: "Brainstorma nya innehållsidéer", color: "from-purple-500 to-pink-500" },
  { icon: Calendar, title: "Veckoplanering", description: "Planera din innehållskalender", color: "from-green-500 to-emerald-500" },
  { icon: Target, title: "Kampanjstrategi", description: "Bygg en strategi för din nästa kampanj", color: "from-amber-500 to-orange-500" },
  { icon: Lightbulb, title: "UF-tips", description: "Få råd specifikt för UF-företag", color: "from-indigo-500 to-purple-500" },
];

const Demo = () => {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiSubTab, setAiSubTab] = useState('chat');

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

  const isLimited = (key: string) => (clickCounts[key] || 0) > 1;

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const statsCards = [
    { title: 'Följare', value: formatNumber(demoStats.followers), icon: Users },
    { title: 'Engagemang', value: demoStats.engagement + '%', icon: TrendingUp },
    { title: 'Räckvidd', value: formatNumber(demoStats.reach), icon: BarChart3 },
    { title: 'AI-krediter', value: demoStats.credits_left.toString(), icon: Zap },
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
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
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
            Du tittar på en demo av {demoCompany.foretagsnamn}
          </span>
          <Link to="/auth?mode=register">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Skapa konto gratis
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
              <span className="text-sm">{DEMO_LIMIT_MESSAGE}</span>
              <Link to="/auth?mode=register">
                <Button size="sm" variant="gradient" className="text-xs whitespace-nowrap">
                  Skapa konto
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
              <h2 className="text-2xl font-bold dashboard-heading-dark">{demoCompany.foretagsnamn}</h2>
              <p className="dashboard-subheading-dark text-sm mt-1">{demoCompany.branch} · {demoCompany.stad}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {demoCompany.nyckelord.map(k => (
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
                    className="backdrop-blur-xl rounded-2xl p-5 border border-white/20"
                    style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
                        style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.3) 0%, hsl(331 70% 45% / 0.2) 100%)' }}>
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

            {/* Chart */}
            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
              <h3 className="text-lg font-semibold mb-4 dashboard-heading-dark">Tillväxt senaste 6 veckorna</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={demoChartData}>
                  <defs>
                    <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(9, 90%, 55%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(331, 70%, 45%)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="followers" stroke="hsl(9, 90%, 55%)" strokeWidth={2} fill="url(#demoGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Social platform stats */}
            <div className="grid md:grid-cols-2 gap-4">
              {demoSocialStats.map(platform => (
                <div key={platform.platform} className="rounded-2xl p-5 backdrop-blur-xl border border-white/20"
                  style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
                  <h4 className="font-semibold dashboard-heading-dark capitalize mb-3">
                    {platform.platform === 'instagram' ? '📸 Instagram' : '🎵 TikTok'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="dashboard-subheading-dark">Följare:</span> <span className="dashboard-heading-dark font-medium">{formatNumber(platform.followers)}</span></div>
                    <div><span className="dashboard-subheading-dark">Likes:</span> <span className="dashboard-heading-dark font-medium">{formatNumber(platform.likes)}</span></div>
                    <div><span className="dashboard-subheading-dark">Kommentarer:</span> <span className="dashboard-heading-dark font-medium">{formatNumber(platform.comments)}</span></div>
                    <div><span className="dashboard-subheading-dark">Räckvidd:</span> <span className="dashboard-heading-dark font-medium">{formatNumber(platform.reach)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
              <h3 className="text-lg font-semibold dashboard-heading-dark mb-2">AI-analys av {demoCompany.foretagsnamn}</h3>
              <p className="dashboard-subheading-dark text-sm mb-4">{demoAIAnalysis.summary}</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-400" /> Styrkor
                  </h4>
                  <ul className="space-y-1">
                    {demoAIAnalysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm dashboard-subheading-dark">{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-yellow-400" /> Förbättringar
                  </h4>
                  <ul className="space-y-1">
                    {demoAIAnalysis.improvements.map((s, i) => (
                      <li key={i} className="text-sm dashboard-subheading-dark">{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" /> Nästa steg
                  </h4>
                  <ul className="space-y-1">
                    {demoAIAnalysis.nextSteps.map((s, i) => (
                      <li key={i} className="text-sm dashboard-subheading-dark">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button variant="gradient" className="mt-4 gap-2" onClick={() => handleDemoClick('analysis')}>
                <Sparkles className="w-4 h-4" />
                {isLimited('analysis') ? 'Skapa konto för ny analys' : 'Generera ny analys'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* AI & VERKTYG TAB */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* AI sub-tabs like real AIPage */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold dashboard-heading-dark">AI-Assistent</h1>
              <p className="text-sm dashboard-subheading-dark mb-4">Din personliga AI för marknadsföring och innehåll</p>

              <div className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1 mb-6">
                {[
                  { value: 'chat', label: 'Chat', icon: MessageSquare },
                  { value: 'verktyg', label: 'Verktyg', icon: Wand2 },
                  { value: 'analys', label: 'Analys', icon: BarChart3 },
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
                          ? "bg-white/20 text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
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
              <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
                style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
                <h3 className="text-lg font-semibold dashboard-heading-dark mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> AI-Chatt
                </h3>

                {/* Chat messages */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {demoChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${(msg.role as string) === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        (msg.role as string) === 'user'
                          ? 'bg-primary/20 dashboard-heading-dark'
                          : 'backdrop-blur-sm border border-white/10 dashboard-subheading-dark'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA above input */}
                <div className="text-center mb-3 py-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm dashboard-heading-dark flex items-center justify-center gap-2 flex-wrap">
                    <Lock className="w-4 h-4 text-primary" />
                    AI-Chatten är tillgänglig med ett eget konto.
                    <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">
                      Skapa konto →
                    </Link>
                  </p>
                </div>

                {/* Chat input - disabled/locked */}
                <div className="flex gap-2 opacity-50 pointer-events-none">
                  <input
                    type="text"
                    disabled
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/20 dashboard-heading-dark placeholder:text-muted-foreground/50 cursor-not-allowed"
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
                      onClick={() => handleDemoClick('tool-' + tool.title)}
                    >
                      <CardHeader className="pb-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-2`}>
                          <tool.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg flex items-center justify-between dashboard-heading-dark">
                          {tool.title}
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-foreground/60" />
                        </CardTitle>
                        <CardDescription className="dashboard-subheading-dark">{tool.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                <Card className="liquid-glass-light border-white/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 dashboard-heading-dark">Lås upp alla AI-verktyg</h3>
                        <p className="text-sm dashboard-subheading-dark mb-3">
                          Skapa ett konto för att generera innehåll, marknadsplaner och strategier med AI.
                        </p>
                        <Link to="/auth?mode=register">
                          <Button variant="gradient" size="sm">
                            Skapa konto gratis
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
              <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
                style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
                <h3 className="text-lg font-semibold dashboard-heading-dark mb-2">AI-analys av {demoCompany.foretagsnamn}</h3>
                <p className="dashboard-subheading-dark text-sm mb-4">{demoAIAnalysis.summary}</p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-400" /> Styrkor
                    </h4>
                    <ul className="space-y-1">
                      {demoAIAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm dashboard-subheading-dark">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" /> Förbättringar
                    </h4>
                    <ul className="space-y-1">
                      {demoAIAnalysis.improvements.map((s, i) => (
                        <li key={i} className="text-sm dashboard-subheading-dark">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-center mt-6 py-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm dashboard-heading-dark flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Skapa konto för att köra egna AI-analyser.
                    <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">Kom igång →</Link>
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
                <p className="dashboard-heading-dark text-sm leading-relaxed">{demoSalesRadar.sammanfattning}</p>
              </CardContent>
            </Card>

            {/* Leads */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dashboard-heading-dark flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Leads & Möjligheter
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {demoSalesRadar.leads.map((lead, i) => {
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
                                <h4 className="font-semibold dashboard-heading-dark">{lead.titel}</h4>
                                <Badge variant={lead.prioritet === 'hög' ? 'destructive' : 'default'} className="text-[10px]">{lead.prioritet}</Badge>
                              </div>
                              <p className="text-sm dashboard-subheading-dark mb-2">{lead.beskrivning}</p>
                              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                <ArrowRight className="w-3 h-3" /> {lead.action}
                              </div>
                              <p className="text-xs dashboard-subheading-dark mt-1 italic">Potential: {lead.potential}</p>
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
              <h3 className="text-lg font-semibold mb-3 dashboard-heading-dark flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Trender & Aktuellt
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {demoSalesRadar.trends.map((trend, i) => {
                  const Icon = getTrendIcon(trend.typ);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="liquid-glass-light hover:shadow-elegant transition-all h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 dashboard-heading-dark" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold dashboard-heading-dark">{trend.titel}</h4>
                                <Badge variant="outline" className="text-[10px] border-white/30">{trend.plattform}</Badge>
                              </div>
                              <p className="text-sm dashboard-subheading-dark mb-2">{trend.beskrivning}</p>
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
              {isLimited('radar') ? 'Skapa konto för fler skanningar' : 'Skanna fler möjligheter'}
            </Button>
          </motion.div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
              <h3 className="text-lg font-semibold dashboard-heading-dark mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Planerade inlägg
              </h3>
              <div className="space-y-3">
                {demoCalendarPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs dashboard-subheading-dark">{new Date(post.date).toLocaleDateString('sv-SE', { weekday: 'short' })}</p>
                      <p className="text-lg font-bold dashboard-heading-dark">{new Date(post.date).getDate()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dashboard-heading-dark text-sm">{post.title}</p>
                      <p className="text-xs dashboard-subheading-dark">{post.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{post.platform}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs dashboard-subheading-dark mt-4 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Skapa och redigera inlägg med ett eget konto. <Link to="/auth?mode=register" className="text-primary hover:underline">Kom igång →</Link>
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
          <h3 className="text-2xl font-bold dashboard-heading-dark mb-2">
            Redo att växa som {demoCompany.foretagsnamn}?
          </h3>
          <p className="dashboard-subheading-dark mb-5 max-w-md mx-auto">
            Skapa ditt konto gratis och få tillgång till AI-driven marknadsföring anpassad för ditt företag.
          </p>
          <Link to="/auth?mode=register">
            <Button variant="gradient" size="lg" className="gap-2">
              Skapa konto gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Demo;
