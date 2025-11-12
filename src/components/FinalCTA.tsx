import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="relative py-20 md:py-32 px-4 bg-gradient-warm overflow-hidden font-poppins">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-hero-foreground/20 backdrop-blur-sm rounded-full border border-hero-foreground/30 text-hero-foreground text-xs md:text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Börja din tillväxtresa idag
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-hero-foreground leading-tight px-2">
            Nästa virala inlägg{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hero-foreground via-primary-glow to-hero-foreground">
              börjar här
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-base sm:text-lg md:text-2xl text-hero-muted max-w-2xl mx-auto px-4 leading-relaxed">
            Få din personliga innehållsstrategi - anpassad efter din budget, bransch och tillgängliga tid
          </p>

          {/* CTA Button */}
          <div className="pt-6 md:pt-8">
            <Link to="/auth">
              <Button
                size="lg"
                className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 md:py-8 bg-card text-primary hover:bg-card/90 hover:scale-110 transition-all duration-300 shadow-glow font-bold"
              >
                Starta gratis
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 md:pt-8 text-hero-muted px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-medium">Gratis strategisession</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-hero-foreground/40" />
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-medium">Ingen betalmetod krävs</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-hero-foreground/40" />
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-medium">Avsluta när du vill</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
