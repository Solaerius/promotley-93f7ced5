import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import PricingFAQ from "./PricingFAQ";

const plans = [
  {
    name: "UF Starter",
    price: "29",
    credits: "50",
    model: "gpt-4o-mini",
    description: "Perfekt för nya UF-företag som precis börjat",
    features: [
      "AI-modell: 4o Mini",
      "50 AI-krediter per månad",
      "Enkel strategi (2 poster/vecka)",
      "3 branschtips per månad",
      "Grundläggande UF-vägledning",
    ],
    popular: false,
  },
  {
    name: "UF Growth",
    price: "49",
    credits: "100",
    model: "gpt-4.1-mini",
    description: "Idealisk för snabbväxande UF-team",
    features: [
      "AI-modell: 4.1 Mini",
      "100 AI-krediter per månad",
      "Personlig innehållskalender",
      "5 content-idéer per vecka",
      "Enkel prestandaanalys",
    ],
    popular: true,
  },
  {
    name: "UF Pro",
    price: "99",
    credits: "200",
    model: "gpt-4.1-mini + gpt-4o",
    description: "För etablerade företag med stora ambitioner",
    features: [
      "AI-modell: 4.1 Mini + 4o Premium",
      "200 AI-krediter per månad",
      "Premium AI för djupanalyser (4o)",
      "Komplett strategi + kalender",
      "Konkurrentanalys inkluderad",
      "Premium rapporter & insikter",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative py-24 md:py-32 px-4 overflow-hidden font-poppins">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-diagonal" />

      {/* Fluid blur orbs */}
      <div className="blur-orb blur-orb-primary w-[700px] h-[700px] -top-48 left-1/4 animate-glow-pulse" />
      <div
        className="blur-orb blur-orb-secondary w-[500px] h-[500px] bottom-0 right-0 animate-glow-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Top blend */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, hsl(344 55% 12%) 0%, transparent 100%)",
          filter: "blur(30px)",
        }}
      />

      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Priser</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold px-2 leading-tight text-white">
            Enkla priser, <span className="text-gradient">kraftfulla resultat</span>
          </h2>
          <p className="text-base md:text-lg text-white/70 px-4">Välj den plan som passar ditt företags tillväxtfas</p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm ${
                plan.popular
                  ? "bg-white/20 border-2 border-white/50 shadow-glow lg:scale-105"
                  : "bg-white/10 border border-white/20 hover:bg-white/[0.15] hover:border-white/30 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap">
                    Mest populär
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan header */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-white/60 mt-2">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="pb-4 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60">kr/mån</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-gradient">{plan.credits}</span>
                    <span className="text-sm text-white/60">krediter/mån</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to={`/swish-checkout?plan=${index === 0 ? "starter" : index === 1 ? "growth" : "pro"}`}
                  className="block pt-2"
                >
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-white text-accent hover:bg-white/90 shadow-lg"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    }`}
                    size="lg"
                  >
                    Betala med Swish
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/60 mt-12 text-sm md:text-base px-4">
          Skapa din första strategi gratis · Ingen betalmetod krävs · Avsluta när du vill
        </p>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>

      {/* Bottom blend */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(344 55% 12%) 0%, transparent 100%)",
          filter: "blur(30px)",
        }}
      />
    </section>
  );
};

export default Pricing;
