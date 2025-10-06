import { Card } from "@/components/ui/card";
import { Link2, BarChart3, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Berätta om ditt företag",
    description: "Budget, bransch, målgrupp och hur mycket tid du har. Promotley anpassar strategin efter just dig.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: BarChart3,
    title: "Koppla dina sociala medier",
    description: "AI:n analyserar dina konton och konkurrenterna för att hitta de bästa möjligheterna.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Lightbulb,
    title: "Få din personliga strategi",
    description: "Komplett plan med exakt när, hur ofta och vad du ska posta - anpassat efter din budget och tid.",
    gradient: "from-primary-glow to-accent",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-gradient-hero font-poppins">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Från företagsidé till{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              färdig strategi
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Få din personliga innehållsplan på under 5 minuter
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="relative p-8 bg-card/50 backdrop-blur-md border-2 border-border/50 hover:border-primary/50 transition-all duration-500 group hover:-translate-y-2 hover:shadow-glow"
              >
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-elegant">
                  {index + 1}
                </div>

                <div className="space-y-4 mt-4">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
