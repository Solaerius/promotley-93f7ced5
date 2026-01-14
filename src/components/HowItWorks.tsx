import { Card, CardContent } from "@/components/ui/card";
import { Link2, BarChart3, Lightbulb, Zap } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Berätta om ditt företag",
    description: "Budget, bransch, målgrupp och hur mycket tid du har. Promotley anpassar strategin efter just dig.",
  },
  {
    icon: BarChart3,
    title: "Koppla dina sociala medier",
    description: "AI:n analyserar dina konton och konkurrenterna för att hitta de bästa möjligheterna.",
  },
  {
    icon: Lightbulb,
    title: "Få din personliga strategi",
    description: "Komplett plan med exakt när, hur ofta och vad du ska posta - anpassat efter din budget och tid.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 bg-background overflow-hidden">
      {/* Top transition from dark section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Hur det fungerar</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ textWrap: 'balance' }}>
            Från företagsidé till <span className="text-gradient">färdig strategi</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ textWrap: 'balance' }}>
            Få din personliga innehållsplan på under 5 minuter
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="card-unified group relative"
              >
                <CardContent className="p-6 md:p-8">
                  {/* Step Number */}
                  <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mt-2 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connector dots for desktop */}
        <div className="hidden md:flex justify-center items-center gap-4 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              {i < 2 && <div className="w-16 h-px bg-gradient-to-r from-primary/40 to-primary/20" />}
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom transition to dark section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent to-transparent pointer-events-none" />
    </section>
  );
};

export default HowItWorks;
