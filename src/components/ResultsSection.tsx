import { TrendingUp, Users, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    icon: TrendingUp,
    value: "+340%",
    label: "Ökade visningar",
    color: "text-primary",
  },
  {
    icon: Users,
    value: "10×",
    label: "Mer engagemang",
    color: "text-accent",
  },
  {
    icon: Clock,
    value: "5h/v",
    label: "Sparad tid",
    color: "text-primary-glow",
  },
];

const ResultsSection = () => {
  return (
    <section className="relative py-24 px-4 bg-gradient-diagonal overflow-hidden font-poppins">
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
      
      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            När strategi möter{" "}
            <span className="text-primary-glow">
              verkliga resultat
            </span>
          </h2>
          <p className="text-xl text-white/80">
            Resultat från företag som följde sin personliga Promotley-strategi
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-8 bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/15 transition-all duration-300 text-center group hover:scale-105"
              >
                <Icon className={`w-12 h-12 mx-auto mb-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className={`text-5xl font-extrabold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-white/90 text-lg font-medium">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Example showcase */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-white/10 backdrop-blur-md border-2 border-white/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Before */}
              <div className="space-y-4">
                <div className="text-white/60 font-semibold text-sm uppercase tracking-wide">Före</div>
                <div className="space-y-2">
                  <div className="text-white/80">Visningar: <span className="font-bold">1,200</span></div>
                  <div className="text-white/80">Likes: <span className="font-bold">45</span></div>
                  <div className="text-white/80">Kommentarer: <span className="font-bold">3</span></div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* After */}
              <div className="space-y-4">
                <div className="text-primary-glow font-semibold text-sm uppercase tracking-wide">Efter</div>
                <div className="space-y-2">
                  <div className="text-white">Visningar: <span className="font-bold text-primary-glow">5,280</span></div>
                  <div className="text-white">Likes: <span className="font-bold text-primary-glow">420</span></div>
                  <div className="text-white">Kommentarer: <span className="font-bold text-primary-glow">38</span></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
