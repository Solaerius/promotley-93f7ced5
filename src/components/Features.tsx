import { Card } from "@/components/ui/card";
import { BarChart3, Brain, Hash, Clock, Sparkles, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-driven analys",
    description: "OpenAI analyserar din statistik från Instagram, TikTok och Facebook för att hitta förbättringsområden.",
  },
  {
    icon: Sparkles,
    title: "Innehållsförslag",
    description: "Få färdiga inläggsidéer med captions, hashtags och optimal postningstid - allt skräddarsytt för din målgrupp.",
  },
  {
    icon: BarChart3,
    title: "Smart dashboard",
    description: "Se all din statistik på ett ställe med AI-highlightade insikter som visar vad du bör fokusera på.",
  },
  {
    icon: Target,
    title: "Kontextuella råd",
    description: "AI:n ger konkreta förslag direkt vid relevant data - t.ex. \"Öka CTR genom att ändra CTA i dina Reels\".",
  },
  {
    icon: Hash,
    title: "Optimerade hashtags",
    description: "Få förslag på populära och relevanta hashtags baserat på ditt innehåll och bransch.",
  },
  {
    icon: Clock,
    title: "Bästa postningstid",
    description: "AI analyserar när din publik är som mest aktiv och rekommenderar optimal tid att publicera.",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Allt du behöver för att{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              växa snabbt
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Promotely kombinerar avancerad AI-teknologi med djup förståelse för sociala medier
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
