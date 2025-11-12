import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import PricingFAQ from "./PricingFAQ";

const plans = [
  {
    name: "Start",
    price: "49",
    credits: "100",
    description: "Perfekt för nya UF-företag som precis börjat",
    features: [
      "Personlig postningsstrategi",
      "Budgetbaserad innehållsplan",
      "Veckovis innehållskalender",
      "Branschanpassade strategier",
      "Optimal frekvens & tidpunkter",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "99",
    credits: "300",
    description: "Idealisk för snabbväxande UF-team",
    features: [
      "Allt från Start",
      "Flera plattformar samtidigt",
      "Konkurrentanalys inkluderad",
      "Prioriterad support",
      "Månatliga strategijusteringar",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "199",
    credits: "∞",
    description: "För etablerade företag med stora ambitioner",
    features: [
      "Obegränsade strategier",
      "Dedikerad strategikonsult",
      "Anpassad AI för din bransch",
      "Daglig innehållsproduktion",
      "API-tillgång",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 px-4 bg-background font-poppins">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold px-2 leading-tight">
            Enkla priser,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              kraftfulla resultat
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
            Välj den plan som passar ditt företags tillväxtfas
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-6 md:p-8 relative bg-card/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-2 border-primary shadow-glow sm:scale-105"
                  : "border-2 border-border/50 hover:border-primary/30"
              }`}
            >
                {plan.popular && (
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                    Mest populär ⭐
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
                <Link to="/auth" className="block">
                  <Button
                    variant="gradient"
                    className="w-full"
                    size="lg"
                  >
                    Starta gratis
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-muted-foreground mt-8 md:mt-12 text-sm md:text-lg px-4">
          Skapa din första strategi gratis · Ingen betalmetod krävs · Avsluta när du vill
        </p>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
    </section>
  );
};

export default Pricing;
