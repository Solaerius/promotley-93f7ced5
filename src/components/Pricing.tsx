import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Promotely Pro",
    price: "49",
    credits: "100",
    features: [
      "100 AI-förslag per månad",
      "Analys av alla plattformar",
      "AI-highlightade insikter",
      "Hashtag-förslag",
      "Optimal postningstid",
    ],
    popular: false,
  },
  {
    name: "Pro XL",
    price: "99",
    credits: "300",
    features: [
      "300 AI-förslag per månad",
      "Allt från Pro",
      "Prioriterad support",
      "Avancerad analys",
      "Historisk data export",
    ],
    popular: true,
  },
  {
    name: "Pro Unlimited",
    price: "199",
    credits: "∞",
    features: [
      "Obegränsade AI-förslag",
      "Allt från Pro XL",
      "Dedikerad support",
      "Anpassad AI-träning",
      "API-tillgång",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 px-4 bg-gradient-hero">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Välj din plan
          </h2>
          <p className="text-xl text-muted-foreground">
            Börja gratis med 1 AI-förslag, uppgradera när du är redo
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative ${
                plan.popular
                  ? "border-primary shadow-glow scale-105"
                  : "border-border/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mest populär
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan name */}
                <h3 className="text-2xl font-bold">{plan.name}</h3>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">kr/mån</span>
                </div>

                {/* Credits */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-3xl font-bold text-primary">
                    {plan.credits}
                  </span>
                  <span>krediter/mån</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 py-4">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/auth" className="block">
                  <Button
                    variant={plan.popular ? "gradient" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    Kom igång
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-muted-foreground mt-12">
          Alla planer inkluderar 1 gratis AI-förslag för att testa. Ingen betalmetod krävs.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
