import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const FinalCTA = () => {
  const { t } = useTranslation();

  const benefits = [
    t('final_cta.benefit1'),
    t('final_cta.benefit2'),
    t('final_cta.benefit3'),
  ];

  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      {/* Concentrated radial glow background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, hsl(var(--primary) / 0.18) 0%, hsl(var(--background)) 70%)',
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Gradient border ring around content */}
        <div
          className="max-w-3xl mx-auto rounded-3xl p-px"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--accent-brand) / 0.4), hsl(var(--primary) / 0.15), hsl(var(--accent-brand) / 0.4))',
          }}
        >
          <div
            className="rounded-3xl px-8 py-14 md:py-20 text-center"
            style={{ background: 'hsl(var(--card) / 0.85)' }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: 'hsl(var(--primary) / 0.15)',
                border: '1px solid hsl(var(--primary) / 0.3)',
              }}
            >
              <Wand2 className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">{t('final_cta.badge')}</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6" style={{ textWrap: 'balance' }}>
              {t('final_cta.title')} <span className="text-gradient">{t('final_cta.title_strong')}</span>
            </h2>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
              style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'balance' }}
            >
              {t('final_cta.subtitle')}
            </p>

            {/* CTA Button */}
            <Link to="/auth">
              <Button
                size="lg"
                className="text-lg px-10 py-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] mb-8 font-semibold"
              >
                {t('sections.finalCta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
