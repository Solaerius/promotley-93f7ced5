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
          className="w-full h-full object-cover blur-[2px] opacity-60"
        />
      </div>
      
      {/* Animated gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-warm opacity-50" />
      
      {/* Floating glow elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-32 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight animate-fade-in text-white">
            Bli företaget alla{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-glow to-white">
                pratar om
              </span>
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium">
            AI som skapar din personliga innehållsstrategi baserat på budget, företagstyp och optimal postningsfrekvens
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth">
              <Button 
                variant="default" 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-glow font-semibold"
              >
                Testa gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300 font-semibold"
              >
                Se hur det funkar
              </Button>
            </a>
          </div>

          {/* Social proof badge */}
          <div className="flex items-center justify-center gap-3 pt-8 text-white/80 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <TrendingUp className="w-5 h-5 text-primary-glow" />
            <p className="text-sm font-medium">
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
