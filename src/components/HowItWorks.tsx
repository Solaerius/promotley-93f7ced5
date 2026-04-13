import { Link2, BarChart3, Lightbulb, Zap } from "lucide-react";
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Link2,
      number: "01",
      title: t('how_it_works.step1_title'),
      description: t('how_it_works.step1_desc'),
    },
    {
      icon: BarChart3,
      number: "02",
      title: t('how_it_works.step2_title'),
      description: t('how_it_works.step2_desc'),
    },
    {
      icon: Lightbulb,
      number: "03",
      title: t('how_it_works.step3_title'),
      description: t('how_it_works.step3_desc'),
    },
  ];

  return (
    <section id="how-it-works" className="relative py-14 md:py-20 overflow-hidden">
      {/* Section accent glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'hsl(var(--primary) / 0.15)',
              border: '1px solid hsl(var(--primary) / 0.3)',
            }}
          >
            <Zap className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">{t('sections.howItWorks.title')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ textWrap: 'balance' }}>
            {t('how_it_works.heading1')} <span className="text-gradient">{t('how_it_works.heading2')}</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'balance' }}>
            {t('how_it_works.subtitle')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-2xl p-6 md:p-8 overflow-hidden transition-all duration-300 group"
                style={{
                  background: 'hsl(0 0% 100% / 0.04)',
                  border: '1px solid hsl(0 0% 100% / 0.08)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'hsl(0 0% 100% / 0.07)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(0 0% 100% / 0.14)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'hsl(0 0% 100% / 0.04)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(0 0% 100% / 0.08)';
                }}
              >
                {/* Desktop connector line (right border on first two cards) */}
                {index < 2 && (
                  <div
                    className="hidden md:block absolute top-1/2 -right-3 w-6 h-px z-20"
                    style={{ background: 'linear-gradient(90deg, hsl(var(--accent-brand) / 0.4), hsl(var(--accent-brand) / 0.1))' }}
                  />
                )}

                {/* Top row: number left, icon right */}
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="text-8xl font-bold leading-none select-none pointer-events-none"
                    style={{ color: 'hsl(var(--foreground) / 0.08)' }}
                  >
                    {item.number}
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--accent-brand) / 0.2), hsl(var(--primary) / 0.15))',
                      border: '1px solid hsl(var(--accent-brand) / 0.2)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
