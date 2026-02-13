import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp, Users, Calendar, Zap, BarChart3, MessageSquare,
  ArrowRight, Sparkles, Radar, Hash, Film, MessageCircle, Star,
  Leaf, Handshake, CalendarDays, Share2, Send, Lock, LogIn,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  demoCompany, demoStats, demoSocialStats, demoChartData,
  demoCalendarPosts, demoSalesRadar, demoAIAnalysis, demoChatMessages,
  DEMO_LIMIT_MESSAGE,
} from '@/data/demoData';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Navbar from '@/components/Navbar';

const Demo = () => {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatInput, setChatInput] = useState('');

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
      <Navbar />

      {/* Demo Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-lg text-white py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm font-medium">
            🎯 Du tittar på en demo av {demoCompany.foretagsnamn}
          </span>
          <Link to="/auth">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Skapa konto gratis
            </Button>
          </Link>
        </div>
      </div>

      {/* Limit Alert */}
      {showLimitAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
        >
          <Alert className="border-primary/40 bg-background shadow-lg">
            <Lock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-sm">{DEMO_LIMIT_MESSAGE}</span>
              <Link to="/auth">
                <Button size="sm" variant="gradient" className="text-xs whitespace-nowrap">
                  Skapa konto
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="liquid-glass-light border-white/20 w-full justify-start overflow-x-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Statistik</TabsTrigger>
            <TabsTrigger value="ai">AI & Verktyg</TabsTrigger>
            <TabsTrigger value="radar">Säljradar</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Company header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.2) 0%, hsl(331 70% 45% / 0.15) 100%)' }}
            >
              <h2 className="text-2xl font-bold dashboard-heading-dark">{demoCompany.foretagsnamn}</h2>
              <p className="dashboard-subheading-dark text-sm mt-1">{demoCompany.branch} · {demoCompany.stad}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {demoCompany.nyckelord.map(k => (
                  <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="backdrop-blur-xl rounded-2xl p-5 border border-white/20"
                    style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}
                  >
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
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                        <li key={i} className="text-sm dashboard-subheading-dark">✅ {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" /> Förbättringar
                    </h4>
                    <ul className="space-y-1">
                      {demoAIAnalysis.improvements.map((s, i) => (
                        <li key={i} className="text-sm dashboard-subheading-dark">💡 {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium dashboard-heading-dark mb-2 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" /> Nästa steg
                    </h4>
                    <ul className="space-y-1">
                      {demoAIAnalysis.nextSteps.map((s, i) => (
                        <li key={i} className="text-sm dashboard-subheading-dark">🚀 {s}</li>
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
          </TabsContent>

          {/* AI & VERKTYG TAB */}
          <TabsContent value="ai" className="space-y-6 mt-6">
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

              {/* Chat input - locked */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/20 dashboard-heading-dark placeholder:text-muted-foreground/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDemoClick('chat');
                        setChatInput('');
                      }
                    }}
                  />
                  <Button variant="gradient" size="icon" onClick={() => { handleDemoClick('chat'); setChatInput(''); }}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs dashboard-subheading-dark mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  AI-chatten är tillgänglig med ett eget konto. <Link to="/auth" className="text-primary hover:underline">Skapa konto →</Link>
                </p>
              </div>
            </div>

            {/* AI Tools locked */}
            <div className="rounded-2xl p-6 backdrop-blur-xl border border-white/20 text-center"
              style={{ background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)' }}>
              <Lock className="w-10 h-10 mx-auto mb-3 dashboard-subheading-dark" />
              <h4 className="font-semibold dashboard-heading-dark mb-1">AI-Verktyg</h4>
              <p className="text-sm dashboard-subheading-dark mb-3">
                Generera innehållsförslag, marknadsplaner och hashtag-strategier med AI.
              </p>
              <Link to="/auth">
                <Button variant="gradient" className="gap-2">
                  <Sparkles className="w-4 h-4" /> Lås upp med konto
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* SÄLJRADAR TAB */}
          <TabsContent value="radar" className="space-y-6 mt-6">
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="liquid-glass-light border-primary/20">
                <CardContent className="p-5">
                  <p className="dashboard-heading-dark text-sm leading-relaxed">{demoSalesRadar.sammanfattning}</p>
                </CardContent>
              </Card>
            </motion.div>

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
          </TabsContent>

          {/* CALENDAR TAB */}
          <TabsContent value="calendar" className="space-y-6 mt-6">
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
                Skapa och redigera inlägg med ett eget konto. <Link to="/auth" className="text-primary hover:underline">Kom igång →</Link>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-8 text-center border border-white/30"
          style={{ background: 'linear-gradient(135deg, hsl(9 90% 55% / 0.25) 0%, hsl(331 70% 45% / 0.25) 100%)' }}
        >
          <h3 className="text-2xl font-bold dashboard-heading-dark mb-2">
            Redo att växa som {demoCompany.foretagsnamn}? 🚀
          </h3>
          <p className="dashboard-subheading-dark mb-5 max-w-md mx-auto">
            Skapa ditt konto gratis och få tillgång till AI-driven marknadsföring anpassad för ditt företag.
          </p>
          <Link to="/auth">
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
