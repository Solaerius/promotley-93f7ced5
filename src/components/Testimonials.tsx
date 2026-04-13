import { Heart } from "lucide-react";
import { useTranslation } from 'react-i18next';

// 24×24 icon badges — one per UF company
const GreenTechBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="GreenTech UF">
    {/* Circle background */}
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Leaf */}
    <path d="M12 19 C12 19 8 14 9.5 9.5 C11 5 16 4.5 17 7.5 C18 10.5 15.5 15 12 18 C12 18.5 12 19 12 19Z" opacity="0.9" />
    {/* Stem */}
    <line x1="12" y1="19" x2="13.5" y2="12" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const StreetStyleBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="StreetStyle AB">
    {/* Square */}
    <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Bold SS */}
    <text x="3.5" y="17" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="900" fontStyle="italic" letterSpacing="-1">SS</text>
  </svg>
);

const FoodieBoxBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="FoodieBox UF">
    {/* Circle */}
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Box outline */}
    <rect x="6" y="9" width="12" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {/* Lid flaps */}
    <path d="M6 12 L8.5 9 L15.5 9 L18 12" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const TechHubBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="TechHub Startup">
    {/* Circle */}
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    {/* Circuit dot grid 2x2 */}
    <circle cx="8.5" cy="8.5" r="1.5" />
    <circle cx="15.5" cy="8.5" r="1.5" />
    <circle cx="8.5" cy="15.5" r="1.5" />
    <circle cx="15.5" cy="15.5" r="1.5" />
    {/* Connector lines */}
    <line x1="10" y1="8.5" x2="14" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <line x1="10" y1="15.5" x2="14" y2="15.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <line x1="8.5" y1="10" x2="8.5" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <line x1="15.5" y1="10" x2="15.5" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.6" />
  </svg>
);

const COMPANY_BADGES: Record<string, React.FC> = {
  "GreenTech UF": GreenTechBadge,
  "StreetStyle AB": StreetStyleBadge,
  "FoodieBox UF": FoodieBoxBadge,
  "TechHub Startup": TechHubBadge,
};

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Emma Andersson",
      company: "GreenTech UF",
      text: t('testimonials.t1_quote'),
      rating: 5,
    },
    {
      name: "Oscar Nilsson",
      company: "StreetStyle AB",
      text: t('testimonials.t2_quote'),
      rating: 5,
    },
    {
      name: "Lisa Bergström",
      company: "FoodieBox UF",
      text: t('testimonials.t3_quote'),
      rating: 5,
    },
    {
      name: "Viktor Larsson",
      company: "TechHub Startup",
      text: t('testimonials.t4_quote'),
      rating: 5,
    },
  ];

  return (
    <section className="relative py-14 md:py-20 overflow-hidden">
      {/* Section accent glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 60%, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />

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
            <Heart className="w-4 h-4 text-foreground fill-foreground" />
            <span className="text-sm font-medium text-foreground">{t('testimonials.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ textWrap: 'balance' }}>
            {t('testimonials.title')} <span className="text-gradient">{t('testimonials.title_strong')}</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'balance' }}>
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-2xl p-6 md:p-8 overflow-hidden transition-all duration-300"
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
              {/* Decorative oversized quote mark */}
              <div
                className="absolute top-4 right-6 text-8xl font-serif leading-none select-none pointer-events-none"
                style={{ color: 'hsl(var(--accent-brand) / 0.15)' }}
              >
                "
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 relative z-10">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Heart key={i} className="w-4 h-4 fill-pink-400 text-pink-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground/90 mb-6 leading-relaxed relative z-10">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div
                className="pt-4 flex items-center gap-3 relative z-10"
                style={{ borderTop: '1px solid hsl(0 0% 100% / 0.08)' }}
              >
                {/* Gradient avatar with initial */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)))',
                  }}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{testimonial.company}</div>
                </div>
                {/* Company badge icon */}
                {COMPANY_BADGES[testimonial.company] && (() => {
                  const Badge = COMPANY_BADGES[testimonial.company];
                  return (
                    <div
                      className="shrink-0 opacity-50 hover:opacity-80 transition-opacity duration-200"
                      style={{ color: 'hsl(var(--foreground))' }}
                      title={testimonial.company}
                    >
                      <Badge />
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
