import { TrendingUp, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCountUp } from "@/hooks/useCountUp";

const stats = [
  {
    icon: TrendingUp,
    value: 87,
    suffix: "%",
    label: "Förbättrat engagemang",
    description: "Genomsnittlig ökning för företag som följer strategin",
    color: "text-primary",
  },
  {
    icon: Users,
    value: 2400,
    suffix: "+",
    label: "Nya följare i snitt",
    description: "Per företag under de första 3 månaderna",
    color: "text-primary",
  },
  {
    icon: Clock,
    value: 5,
    suffix: "h",
    label: "Sparad tid per vecka",
    description: "Genom automatiserad innehållsplanering",
    color: "text-primary-glow",
  },
];

const ResultsSection = () => {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section 
      ref={ref as any}
      className="relative py-16 md:py-24 px-4 bg-gradient-diagonal overflow-hidden font-poppins"
    >
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
      
      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white px-2 leading-tight">
            När strategi möter{" "}
            <span className="text-primary-glow">
              verkliga resultat
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 px-4">
            Resultat från företag som följde sin personliga Promotley-strategi
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mb-12 md:mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const count = useCountUp({ 
              end: stat.value, 
              duration: 2000 + (index * 200), 
              isVisible 
            });
            
            return (
              <Card
                key={index}
                className="p-8 bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/15 transition-all duration-300 text-center group hover:scale-105"
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                }}
              >
                <Icon className={`w-12 h-12 mx-auto mb-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className={`text-4xl font-extrabold mb-3 ${stat.color} tabular-nums`}>
                  {count}{stat.suffix}
                </div>
                <div className="text-white/90 text-lg font-medium mb-2">
                  {stat.label}
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  {stat.description}
                </p>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ResultsSection;
