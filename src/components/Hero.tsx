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
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20 md:py-32 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-extrabold tracking-tight animate-fade-in text-white leading-tight">
            Bli företaget alla{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-glow to-white">
                pratar om
              </span>
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium px-4 md:px-0">
            Få AI-genererade innehållsförslag som ökar engagemang med 30% på 4 veckor
          </p>

          {/* Email Capture */}
          <div className="max-w-md mx-auto pt-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); window.location.href = '/auth'; }}>
              <input
                type="email"
                placeholder="Din e-postadress"
                required
                className="flex-1 px-6 py-4 rounded-lg bg-white/95 backdrop-blur-sm text-foreground placeholder:text-muted-foreground border-2 border-transparent focus:border-primary focus:outline-none transition-all text-base font-medium"
              />
              <Button 
                type="submit"
                variant="gradient" 
                className="text-base px-6 py-4 hover:scale-105 transition-all duration-300 shadow-glow font-semibold whitespace-nowrap h-[52px]"
              >
                Starta gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
            <p className="text-xs md:text-sm text-white/70 mt-3 text-center">Ingen betalmetod krävs · Avsluta när du vill</p>
          </div>

          {/* Secondary CTA */}
          <div className="pt-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <a href="#how-it-works">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base px-6 py-3 border-2 border-white/40 !text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-medium"
              >
                Se hur det funkar
              </Button>
            </a>
          </div>

          {/* Social proof badge */}
          <div className="flex items-center justify-center gap-2 md:gap-3 pt-6 md:pt-8 text-white/80 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary-glow" />
            <p className="text-xs md:text-sm font-medium">
              <span className="font-bold text-white">100+</span> UF-företag växer redan med Promotley
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
