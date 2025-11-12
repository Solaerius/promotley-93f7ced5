import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="relative py-32 px-4 bg-gradient-warm overflow-hidden font-poppins">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-hero-foreground/20 backdrop-blur-sm rounded-full border border-hero-foreground/30 text-hero-foreground text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            Börja din tillväxtresa idag
          </div>

          {/* Headline */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-hero-foreground leading-tight">
            Nästa virala inlägg{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hero-foreground via-primary-glow to-hero-foreground">
              börjar här
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-hero-muted max-w-2xl mx-auto">
            Få din personliga innehållsstrategi - anpassad efter din budget, bransch och tillgängliga tid
          </p>

          {/* CTA Button */}
          <div className="pt-8">
            <Link to="/auth">
              <Button
                size="lg"
                className="text-xl px-12 py-8 bg-card text-primary hover:bg-card/90 hover:scale-110 transition-all duration-300 shadow-glow font-bold"
              >
                Starta gratis
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 text-hero-muted">
            <div className="flex items-center gap-2">
              <span className="font-medium">Gratis strategisession</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-hero-foreground/40" />
            <div className="flex items-center gap-2">
              <span className="font-medium">Ingen betalmetod krävs</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-hero-foreground/40" />
            <div className="flex items-center gap-2">
              <span className="font-medium">Avsluta när du vill</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
