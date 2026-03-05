import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PricingFAQ from "@/components/PricingFAQ";
import Navbar from "@/components/Navbar";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAuth } from "@/hooks/useAuth";
import PromoCodeInput from "@/components/PromoCodeInput";

const plans = [
  {
    name: "Starter",
    price: "29",
    credits: "50",
    model: "gpt-4o-mini",
    tier: "starter",
    dbPlan: "starter",
    tierLevel: 1,
    description: "Perfekt för nya UF-företag som precis börjat",
    features: [
      "AI-modell: GPT-4o Mini",
      "50 AI-krediter per månad",
      "Enkel strategi (2 poster/vecka)",
      "3 branschtips per månad",
      "Grundläggande UF-vägledning",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "49",
    credits: "100",
    model: "gpt-4o-mini",
    tier: "growth",
    dbPlan: "growth",
    tierLevel: 2,
    description: "Idealisk för snabbväxande UF-team",
    features: [
      "AI-modell: GPT-4o Mini",
      "100 AI-krediter per månad",
      "Personlig innehållskalender",
      "5 content-idéer per vecka",
      "Enkel prestandaanalys",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "99",
    credits: "200",
    model: "gpt-4.1-mini + gpt-4o",
    tier: "pro",
    dbPlan: "pro",
    tierLevel: 3,
    description: "För etablerade företag med stora ambitioner",
    features: [
      "AI-modell: GPT-4.1 Mini + GPT-4o Premium",
      "200 AI-krediter per månad",
      "Premium AI för djupanalyser (GPT-4o)",
      "Komplett strategi + kalender",
      "Konkurrentanalys inkluderad",
      "Premium rapporter & insikter",
    ],
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { credits, getTierLevel, refetch: refetchCredits } = useUserCredits();
  const { user } = useAuth();

  const currentTierLevel = credits?.plan ? getTierLevel(credits.plan) : 0;

  const handleSelectPlan = (tier: string) => {
    navigate(`/swish-checkout?plan=${tier}`);
  };

  const isCurrentPlan = (plan: typeof plans[0]) => {
    return credits?.plan === plan.dbPlan;
  };

  const isLowerOrSameTier = (plan: typeof plans[0]) => {
    return plan.tierLevel <= currentTierLevel;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16 md:py-24 px-4 bg-background font-poppins">
        <div className="container mx-auto">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold px-2 leading-tight">
              Enkla priser,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                kraftfulla resultat
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
              Välj den plan som passar ditt företags tillväxtfas
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`p-6 md:p-8 relative bg-card/50 backdrop-blur-md transition-all duration-300 ${
                  isCurrentPlan(plan)
                    ? "border-2 border-primary/50 bg-primary/5"
                    : plan.popular
                    ? "border-2 border-primary shadow-glow sm:scale-105 hover:-translate-y-2"
                    : "border-2 border-border/50 hover:border-primary/30 hover:-translate-y-2"
                }`}
              >
                {isCurrentPlan(plan) && (
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Din plan
                    </span>
                  </div>
                )}
                {!isCurrentPlan(plan) && plan.popular && (
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                      Mest populär
                    </span>
                  </div>
                )}

                <div className="space-y-5 md:space-y-6">
                  {/* Plan name */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold">{plan.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                    <span className="text-sm md:text-base text-muted-foreground">kr/mån</span>
                  </div>

                  {/* Credits */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      {plan.credits}
                    </span>
                    <span className="text-sm md:text-base">krediter/mån</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 md:space-y-3 py-3 md:py-4">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 md:gap-3">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-xs md:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={isCurrentPlan(plan) ? "outline" : "gradient"}
                    className="w-full"
                    size="lg"
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isLowerOrSameTier(plan) && currentTierLevel > 0}
                  >
                    {isCurrentPlan(plan) 
                      ? "Nuvarande plan" 
                      : isLowerOrSameTier(plan) && currentTierLevel > 0
                      ? "Ej tillgänglig"
                      : `Välj ${plan.name}`}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom note */}
          <p className="text-center text-muted-foreground mt-8 md:mt-12 text-sm md:text-lg px-4">
            Prova gratis i 7 dagar · Ingen betalmetod krävs · Avsluta när du vill
          </p>

          {/* Promo code section */}
          <div className="max-w-md mx-auto mt-8">
            {user ? (
              <PromoCodeInput variant="card" onSuccess={() => refetchCredits()} />
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 text-center space-y-3">
                <p className="font-semibold">Har du en kampanjkod?</p>
                <p className="text-sm text-muted-foreground">
                  Skapa ett konto först för att lösa in din kod
                </p>
                <Button variant="outline" onClick={() => navigate('/auth?mode=register')}>
                  Skapa konto
                </Button>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <PricingFAQ />
        </div>
      </section>
    </div>
  );
};

export default Pricing;
