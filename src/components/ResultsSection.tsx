import { TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCountUp } from "@/hooks/useCountUp";
import { useTranslation } from 'react-i18next';

const ResultsSection = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  });

  const stats = [
    {
      icon: TrendingUp,
      value: 87,
      suffix: "%",
      label: t('results.stat1_label'),
      description: t('results.stat1_desc'),
    },
    {
      icon: Users,
      value: 2400,
      suffix: "+",
      label: t('results.stat2_label'),
      description: t('results.stat2_desc'),
    },
    {
      icon: Clock,
      value: 5,
      suffix: "h",
      label: t('results.stat3_label'),
      description: t('results.stat3_desc'),
    },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-14 md:py-20 overflow-hidden"
    >
      {/* Section accent glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 70% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />

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
            <BarChart3 className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">{t('results.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ textWrap: 'balance' }}>
            {t('results.title')} <span className="text-gradient">{t('results.title_strong')}</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'balance' }}>
            {t('results.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const count = useCountUp({
              end: stat.value,
              duration: 2000 + (index * 200),
              isVisible,
            });

            return (
              <div
                key={index}
                className="group rounded-2xl p-6 md:p-8 transition-all duration-300"
                style={{
                  background: 'hsl(0 0% 100% / 0.04)',
                  border: '1px solid hsl(0 0% 100% / 0.08)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${index * 100}ms`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'hsl(0 0% 100% / 0.07)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(0 0% 100% / 0.14)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 30px hsl(var(--accent-brand) / 0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'hsl(0 0% 100% / 0.04)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(0 0% 100% / 0.08)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Icon box with brand gradient */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)))',
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {stat.label}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gradient tabular-nums mb-1">
                  {count}{stat.suffix}
                </div>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
