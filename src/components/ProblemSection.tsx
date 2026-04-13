import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

const ProblemSection = () => {
  const { t } = useTranslation();

  const beforeItems = t('problem.before_items', { returnObjects: true }) as string[];
  const afterItems = t('problem.after_items', { returnObjects: true }) as string[];

  return (
    <section className="relative py-14 md:py-20 px-4 overflow-hidden font-poppins">
      {/* Section accent glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20 space-y-4">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: 'hsl(var(--primary) / 0.15)',
              border: '1px solid hsl(var(--primary) / 0.3)',
            }}
          >
            <AlertCircle className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">{t('problem.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold px-2 leading-tight text-balance text-foreground">
            {t('problem.heading')}{" "}
            <span className="text-gradient">{t('problem.heading_strong')}</span>
          </h2>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* Before - Problem */}
          <div
            className="relative p-8 md:p-10 rounded-2xl transition-all duration-300"
            style={{
              background: 'hsl(0 72% 50% / 0.06)',
              border: '1px solid hsl(0 72% 50% / 0.2)',
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'hsl(0 72% 50% / 0.12)' }}
              >
                <AlertCircle className="w-6 h-6" style={{ color: 'hsl(0 72% 60%)' }} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">{t('problem.before_title')}</h3>
            </div>

            <ul className="space-y-4">
              {beforeItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold"
                    style={{ background: 'hsl(0 72% 50% / 0.12)', color: 'hsl(0 72% 60%)' }}
                  >
                    ✗
                  </span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After - Solution */}
          <div
            className="relative p-8 md:p-10 rounded-2xl transition-all duration-300"
            style={{
              background: 'hsl(var(--primary) / 0.08)',
              border: '1px solid hsl(var(--primary) / 0.25)',
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'hsl(var(--accent-brand) / 0.12)' }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: 'hsl(var(--accent-brand))' }} />
              </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">{t('problem.after_title')}</h3>
            </div>

            <ul className="space-y-4">
              {afterItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-foreground">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold"
                    style={{ background: 'hsl(var(--accent-brand) / 0.15)', color: 'hsl(var(--accent-brand))' }}
                  >
                    ✓
                  </span>
                  <span className="text-base font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transition arrow for mobile */}
        <div className="flex justify-center mt-8 md:hidden">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--accent-brand) / 0.12)' }}
          >
            <ArrowRight className="w-5 h-5" style={{ color: 'hsl(var(--accent-brand))' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
