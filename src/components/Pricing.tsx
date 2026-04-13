import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PricingFAQ from "./PricingFAQ";

// Small SVG diamond/sparkle icon used throughout
const Sparkle = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" />
  </svg>
);

// Credit meter bar — proportional to max 200
interface CreditBarProps {
  credits: number;
  color: string;
}
const CreditBar = ({ credits, color }: CreditBarProps) => {
  const pct = Math.round((credits / 200) * 100);
  return (
    <div className="h-1 rounded-full bg-border mt-2 overflow-hidden">
      <div
        className="h-1 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
};

interface PlanData {
  slug: string;
  name: string;
  price: string;
  creditsNum: number;
  credits: string;
  description: string;
  features: string[];
  popular: boolean;
  accentColor: string;
  accentColorGradient?: string;
}

const Pricing = () => {
  const { t } = useTranslation();

  const plans: PlanData[] = [
    {
      slug: "starter",
      name: "UF Starter",
      price: t("pricing.starter_price"),
      creditsNum: 50,
      credits: "50",
      description: t("pricing.starter_desc"),
      features: [
        t("pricing.starter_f1"),
        t("pricing.starter_f2"),
        t("pricing.starter_f3"),
        t("pricing.starter_f4"),
        t("pricing.starter_f5"),
      ],
      popular: false,
      accentColor: "hsl(var(--primary))",
    },
    {
      slug: "growth",
      name: "UF Growth",
      price: t("pricing.growth_price"),
      creditsNum: 100,
      credits: "100",
      description: t("pricing.growth_desc"),
      features: [
        t("pricing.growth_f1"),
        t("pricing.growth_f2"),
        t("pricing.growth_f3"),
        t("pricing.growth_f4"),
        t("pricing.growth_f5"),
      ],
      popular: true,
      accentColor: "hsl(var(--primary))",
      accentColorGradient:
        "linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)))",
    },
    {
      slug: "pro",
      name: "UF Pro",
      price: t("pricing.pro_price"),
      creditsNum: 200,
      credits: "200",
      description: t("pricing.pro_desc"),
      features: [
        t("pricing.pro_f1"),
        t("pricing.pro_f2"),
        t("pricing.pro_f3"),
        t("pricing.pro_f4"),
        t("pricing.pro_f5"),
        t("pricing.pro_f6"),
      ],
      popular: false,
      accentColor: "hsl(190 60% 45%)",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-20 md:py-28 px-4 overflow-hidden font-poppins"
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 35%, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto relative z-10">
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-medium mb-5">
            <Sparkle />
            {t("pricing.section_label")}
            <Sparkle />
          </span>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
            {t("pricing.section_title_prefix")}{" "}
            <span className="text-gradient">
              {t("pricing.section_title_gradient")}
            </span>
          </h2>

          <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-base md:text-lg">
            {t("pricing.section_subtitle")}
          </p>
        </motion.div>

        {/* ── Pricing cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => {
            if (plan.popular) {
              return (
                <FeaturedCard
                  key={plan.slug}
                  plan={plan}
                  index={index}
                />
              );
            }
            return (
              <StandardCard
                key={plan.slug}
                plan={plan}
                index={index}
              />
            );
          })}
        </div>

        {/* ── Bottom note ── */}
        <p className="text-center mt-12 text-sm md:text-base text-muted-foreground px-4">
          {t("pricing.bottom_note")}
        </p>

        {/* ── FAQ ── */}
        <PricingFAQ />
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Featured card (Growth) — animated gradient ring, scale, glow
// ─────────────────────────────────────────────────────────────────────────────
interface CardProps {
  plan: PlanData;
  index: number;
}

const FeaturedCard = ({ plan, index }: CardProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.04 }}
      className="relative scale-[1.03] z-10"
    >
      {/* Animated gradient border wrapper */}
      <div
        className="relative rounded-2xl p-[2px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)), hsl(var(--accent-brand)))",
          backgroundSize: "200% 200%",
          animation: "gradientShift 3s ease infinite",
        }}
      >
        {/* Inner card */}
        <div
          className="relative rounded-[14px] p-6 md:p-8 bg-card dark:bg-card overflow-hidden"
          style={{
            boxShadow:
              "0 0 40px hsl(var(--primary) / 0.25), 0 20px 60px hsl(var(--primary) / 0.15)",
          }}
        >
          {/* Popular badge */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <span
              className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-white rounded-b-lg whitespace-nowrap"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)))",
              }}
            >
              {t("pricing.badge_popular")}
            </span>
          </div>

          <CardInner plan={plan} isFeatured />
        </div>
      </div>

      {/* CSS keyframes injected via style tag once */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Standard card (Starter / Pro)
// ─────────────────────────────────────────────────────────────────────────────
const StandardCard = ({ plan, index }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl p-6 md:p-8 bg-card border border-border/50 shadow-lg transition-shadow duration-300 hover:shadow-xl"
    >
      <CardInner plan={plan} isFeatured={false} />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared card interior
// ─────────────────────────────────────────────────────────────────────────────
interface CardInnerProps {
  plan: PlanData;
  isFeatured: boolean;
}

const CardInner = ({ plan, isFeatured }: CardInnerProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pt-4">
      {/* Plan name + credit meter */}
      <div>
        <p
          className="text-xs uppercase tracking-[0.2em] font-medium mb-1"
          style={{ color: plan.accentColor }}
        >
          {plan.name}
        </p>
        <CreditBar credits={plan.creditsNum} color={plan.accentColorGradient ?? plan.accentColor} />
      </div>

      {/* Price block */}
      <div className="border-b border-border/40 pb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black tracking-tight text-foreground">
            {plan.price}
          </span>
          <span className="text-base font-medium text-muted-foreground ml-1">
            {t("pricing.currency_symbol")}{t("pricing.per_month")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      </div>

      {/* Feature list */}
      <ul className="space-y-3">
        {plan.features.map((feature, fIndex) => (
          <li key={fIndex} className="flex items-start gap-3">
            <span
              className="shrink-0 mt-[3px]"
              style={{ color: plan.accentColor }}
            >
              <Sparkle />
            </span>
            <span className="text-sm text-foreground/80 leading-snug">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <Link
        to={`/checkout?plan=${plan.slug}&type=plan`}
        className="block pt-1"
      >
        {isFeatured ? (
          <Button
            className="w-full text-white font-semibold"
            size="lg"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--accent-brand)), hsl(var(--primary)))",
              boxShadow: "0 8px 30px hsl(var(--primary) / 0.35)",
            }}
          >
            {t("pricing.cta")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full font-semibold border-border/60 hover:border-primary/60 hover:text-primary transition-colors"
            size="lg"
          >
            {t("pricing.cta")}
          </Button>
        )}
      </Link>
    </div>
  );
};

export default Pricing;
