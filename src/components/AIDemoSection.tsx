import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Wand2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const strategyItems = [
  {
    title: "Din postningsstrategi:",
    content: "Baserat på din budget (500 kr/mån) och tillgänglig tid:",
    highlight: "Posta 3 gånger/vecka på Instagram Reels",
    detail: "måndagar 18:00, onsdagar 19:30, fredagar 17:00.",
  },
  {
    title: "Innehållsplan denna vecka:",
    content: "Måndag: Produktlansering (15s Reel). Onsdag: Kundcase/testimonial (Story + Reel). Fredag: Bakom kulisserna (30s Reel).",
    highlight: "Allt innehåll förberett av AI",
    detail: "",
  },
  {
    title: "Branschanpassning:",
    content: "Som UF-företag inom",
    highlight: "hållbara produkter",
    detail: ": Fokusera på #hållbarhet #ufföretag2025 och samarbeta med eco-influencers inom din budget.",
  },
];

const AIDemoSection = () => {
  const { t } = useTranslation();

  return (
    <section id="demo" className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-diagonal" />

      {/* Fluid blur orbs */}
      <div className="blur-orb blur-orb-primary w-[600px] h-[600px] -top-32 -right-32 animate-glow-pulse" />
      <div className="blur-orb blur-orb-secondary w-[500px] h-[500px] bottom-0 left-0 animate-glow-pulse" style={{ animationDelay: '1s' }} />

      {/* Top blend */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, hsl(344 55% 12%) 0%, transparent 100%)',
          filter: 'blur(30px)',
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-sm">
            <Brain className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">{t('ai_demo.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ textWrap: 'balance' }}>
            {t('ai_demo.title')} <span className="text-gradient">{t('ai_demo.title_strong')}</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto" style={{ textWrap: 'balance' }}>
            {t('ai_demo.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left - Dashboard mockup */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white">{t('ai_demo.dashboard_title')}</div>
                    <div className="text-sm text-white/60">{t('ai_demo.dashboard_subtitle')}</div>
                  </div>
                </div>

                {/* Stats preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-3xl font-bold text-gradient">12.5K</div>
                    <div className="text-sm text-white/60 mt-1">{t('ai_demo.views')}</div>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-3xl font-bold text-gradient">8.2%</div>
                    <div className="text-sm text-white/60 mt-1">{t('ai_demo.engagement')}</div>
                  </div>
                </div>

                {/* Graph placeholder */}
                <div className="h-40 rounded-xl bg-white/5 border border-white/10 flex items-end justify-around p-6">
                  {[40, 65, 45, 80, 70, 90, 85].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 md:w-10 bg-gradient-primary rounded-t-lg transition-all duration-300 hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right - AI strategy output */}
          <div className="space-y-5">
            {strategyItems.map((item, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="font-bold text-lg text-white">{item.title}</div>
                      <p className="text-white/80 leading-relaxed">
                        {item.content}{" "}
                        <span className="font-semibold text-gradient">{item.highlight}</span>
                        {item.detail && ` ${item.detail}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* CTA */}
            <div className="pt-4">
              <Link to="/auth?from=demo">
                <Button
                  size="lg"
                  className="w-full text-lg py-6 bg-white text-accent hover:bg-white/90 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 font-semibold"
                >
                  {t('ai_demo.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom blend */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(344 55% 12%) 0%, transparent 100%)',
          filter: 'blur(30px)',
        }}
      />
    </section>
  );
};

export default AIDemoSection;
