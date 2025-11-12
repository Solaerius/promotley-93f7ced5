import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import gamlastan from "@/assets/gamlastan.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden font-poppins">
      {/* Background image with blur */}
      <div className="absolute inset-0">
        <img 
          src={gamlastan} 
          alt="Stockholm Gamla Stan background" 
          className="w-full h-full object-cover object-[center_67%] blur-[2px] opacity-60"
        />
      </div>
      
      {/* Animated gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-warm opacity-50" />
      
      {/* Floating glow elements */}
      <div className="absolute top-20 left-5 md:left-10 w-64 h-64 md:w-96 md:h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-5 md:right-10 w-80 h-80 md:w-[500px] md:h-[500px] bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20 md:py-32 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-5 md:space-y-8">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-extrabold tracking-tight animate-fade-in text-hero-foreground leading-[1.15] sm:leading-tight px-2">
            Bli företaget alla{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-hero-foreground via-primary-glow to-hero-foreground">
                pratar om
              </span>
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-2xl text-hero-muted max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium px-2 md:px-0">
            AI som hjälper UF-företag och startups att växa snabbare på sociala medier
          </p>

          {/* Email Capture */}
          <div className="max-w-md mx-auto pt-4 md:pt-6 animate-slide-up px-4" style={{ animationDelay: "0.2s" }}>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); window.location.href = '/auth'; }}>
              <input
                type="email"
                placeholder="Din e-postadress"
                required
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-card/95 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground border-2 border-transparent focus:border-primary focus:outline-none transition-all text-sm sm:text-base font-medium"
              />
              <Button 
                type="submit"
                variant="gradient" 
                className="text-sm sm:text-base px-5 sm:px-6 py-3 sm:py-4 hover:scale-105 transition-all duration-300 shadow-glow font-semibold whitespace-nowrap h-auto sm:h-[52px]"
              >
                Starta gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
            <p className="text-xs md:text-sm text-hero-muted/70 mt-3 text-center px-2">
              Ingen kortinformation krävs. Börja på 30 sekunder.
            </p>
          </div>

          {/* Secondary CTA */}
          <div className="pt-2 md:pt-4 animate-slide-up px-4" style={{ animationDelay: "0.3s" }}>
            <a href="#how-it-works">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-muted-foreground/40 text-muted-foreground hover:bg-muted/10 backdrop-blur-sm transition-all duration-300 font-medium"
              >
                Se hur det funkar
              </Button>
            </a>
          </div>

          {/* Social proof badge */}
          <div className="flex items-center justify-center gap-2 md:gap-3 pt-4 md:pt-8 text-hero-muted animate-fade-in px-4" style={{ animationDelay: "0.4s" }}>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary-glow shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              <span className="font-bold text-hero-foreground">100+</span> UF-företag växer redan med Promotley
            </p>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
