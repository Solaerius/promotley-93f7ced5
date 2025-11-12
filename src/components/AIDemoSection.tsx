import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const AIDemoSection = () => {
  return (
    <section id="demo" className="py-16 md:py-24 px-4 bg-background font-poppins">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-primary rounded-full text-white text-xs md:text-sm font-semibold mb-3 md:mb-4">
              <Brain className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Personlig Strategi
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold px-2 leading-tight">
              Din kompletta{" "}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                innehållsstrategi
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Ingen gissningar - bara en skräddarsydd plan baserad på din budget, bransch och tillgängliga tid
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left - Dashboard mockup */}
            <Card className="p-6 bg-gradient-hero border-2 border-primary/20 shadow-elegant">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary" />
                  <div>
                    <div className="font-bold">Ditt Dashboard</div>
                    <div className="text-sm text-muted-foreground">Instagram Analys</div>
                  </div>
                </div>

                {/* Stats preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border">
                    <div className="text-2xl font-bold text-primary">12.5K</div>
                    <div className="text-sm text-muted-foreground">Visningar</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <div className="text-2xl font-bold text-accent">8.2%</div>
                    <div className="text-sm text-muted-foreground">Engagemang</div>
                  </div>
                </div>

                {/* Graph placeholder */}
                <div className="h-32 rounded-lg bg-gradient-primary/10 border border-primary/20 flex items-end justify-around p-4">
                  {[40, 65, 45, 80, 70, 90, 85].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 bg-gradient-primary rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Right - AI strategy output */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-hero border-2 border-primary/20 animate-fade-in">
                <Sparkles className="w-6 h-6 text-primary shrink-0 animate-pulse" />
                <div className="space-y-2">
                  <div className="font-bold text-lg">Din postningsstrategi:</div>
                  <p className="text-foreground leading-relaxed">
                    "Baserat på din budget (500 kr/mån) och tillgänglig tid: <span className="font-bold text-primary">Posta 3 gånger/vecka på Instagram Reels</span> - måndagar 18:00, onsdagar 19:30, fredagar 17:00."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-hero border-2 border-primary/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <Sparkles className="w-6 h-6 text-accent shrink-0 animate-pulse" />
                <div className="space-y-2">
                  <div className="font-bold text-lg">Innehållsplan denna vecka:</div>
                  <p className="text-foreground leading-relaxed">
                    "Måndag: Produktlansering (15s Reel). Onsdag: Kundcase/testimonial (Story + Reel). Fredag: Bakom kulisserna (30s Reel). <span className="font-bold text-accent">Allt innehåll förberett av AI</span>."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-hero border-2 border-primary/20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Sparkles className="w-6 h-6 text-primary-glow shrink-0 animate-pulse" />
                <div className="space-y-2">
                  <div className="font-bold text-lg">Branschanpassning:</div>
                  <p className="text-foreground leading-relaxed">
                    "Som UF-företag inom <span className="font-bold text-primary-glow">hållbara produkter</span>: Fokusera på #hållbarhet #ufföretag2025 och samarbeta med eco-influencers inom din budget."
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <Link to="/auth?from=demo">
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="w-full text-lg py-6 shadow-glow hover:scale-105 transition-transform"
                  >
                    Skapa min personliga strategi
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDemoSection;
