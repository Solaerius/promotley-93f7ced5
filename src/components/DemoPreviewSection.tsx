import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Users, BarChart3, Zap, MessageSquare, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const DemoPreviewSection = () => {
  const { t } = useTranslation();

  return (
    <section id="demo-preview" className="relative py-14 md:py-20 overflow-hidden">
      {/* Section accent glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'hsl(var(--primary) / 0.15)',
              border: '1px solid hsl(var(--primary) / 0.3)',
            }}
          >
            <Play className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">{t('sections.demo.title')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {t('sections.demo.title')}
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('sections.demo.subtitle')}
          </p>
        </div>

        {/* Animated Dashboard Mockup */}
        <Link to="/demo" className="block max-w-5xl mx-auto group cursor-pointer">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                  promotley.se/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Company header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NH</span>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold">Nordic Hoodies UF</h3>
                  <p className="text-muted-foreground text-xs">Streetwear · Stockholm</p>
                </div>
              </motion.div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Users, label: t('demo_preview.followers'), value: "2.4k", delay: 0.4 },
                  { icon: TrendingUp, label: t('sections.demo.engagement'), value: "5.8%", delay: 0.5 },
                  { icon: BarChart3, label: t('demo_preview.reach'), value: "12.3k", delay: 0.6 },
                  { icon: Zap, label: t('sections.demo.ai_credits'), value: "47", delay: 0.7 },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: stat.delay, duration: 0.5 }}
                      className="rounded-xl p-4 border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground text-xs">{stat.label}</span>
                      </div>
                      <p className="text-foreground font-bold text-lg">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Chart mockup */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="rounded-xl p-5 border border-border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-foreground text-sm font-medium">{t('sections.demo.growth')}</h4>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(174 70% 45%)' }} /> TikTok</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(328 70% 55%)' }} /> Instagram</span>
                  </div>
                </div>
                {/* SVG chart lines */}
                <svg viewBox="0 0 400 100" className="w-full h-20 md:h-28">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="hsl(var(--border))" strokeOpacity="0.5" />
                  ))}
                  {/* TikTok line */}
                  <motion.path
                    d="M0,80 C50,75 80,60 120,55 C160,50 200,40 240,30 C280,22 320,18 360,12 L400,8"
                    fill="none"
                    stroke="hsl(174 70% 45%)"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  />
                  {/* Instagram line */}
                  <motion.path
                    d="M0,85 C50,82 80,70 120,65 C160,60 200,52 240,45 C280,38 320,32 360,25 L400,20"
                    fill="none"
                    stroke="hsl(328 70% 55%)"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              {/* AI Chat preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="rounded-xl p-4 border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-foreground text-sm font-medium">AI-Assistent</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-primary/20 rounded-2xl px-3 py-2 text-xs text-foreground max-w-[70%]">
                      {t('sections.demo.sample_question')}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border rounded-2xl px-3 py-2 text-xs text-muted-foreground max-w-[80%]">
                      <Wand2 className="w-3 h-3 inline mr-1 text-primary" />
                      {t('sections.demo.sample_response')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-background/80 backdrop-blur-md rounded-2xl px-6 py-3 border border-border flex items-center gap-2">
                <Play className="w-5 h-5 text-foreground" />
                <span className="text-foreground font-medium">{t('sections.demo.try_demo')}</span>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* CTA */}
        <div className="text-center mt-8 md:mt-12">
          <Link to="/demo">
            <Button
              size="lg"
              variant="gradient"
              className="text-base px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]"
            >
              {t('sections.demo.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
