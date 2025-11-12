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
    <section id="how-it-works" className="py-16 md:py-24 px-4 bg-gradient-hero font-poppins">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold px-2 leading-tight">
            Från företagsidé till{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              färdig strategi
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
            Få din personliga innehållsplan på under 5 minuter
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="relative p-6 md:p-8 bg-card/50 backdrop-blur-md border-2 border-border/50 hover:border-primary/50 transition-all duration-500 group hover:-translate-y-2 hover:shadow-glow"
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-elegant">
                  {index + 1}
                </div>

                <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                  {/* Icon with gradient background */}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
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
