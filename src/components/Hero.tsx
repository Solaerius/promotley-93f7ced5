import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const Hero = () => {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAccent, setShowAccent] = useState(false);

  useEffect(() => {
    // Trigger initial animation after mount
    const loadTimer = setTimeout(() => setIsLoaded(true), 100);
    // Trigger accent color after headline is visible
    const accentTimer = setTimeout(() => setShowAccent(true), 1600);
    
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(accentTimer);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative blur orbs - reduced for cleaner look */}
      <div className="blur-orb blur-orb-primary w-[500px] h-[500px] -top-48 -right-48" />
      <div className="blur-orb blur-orb-secondary w-[400px] h-[400px] bottom-0 -left-32" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-driven marknadsföring för UF-företag</span>
          </div>

          {/* Main Headline with two-stage animation */}
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight transition-all duration-700 delay-100 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ textWrap: 'balance' }}
          >
            <span className="text-foreground">Bli företaget </span>
            <span 
              className={`transition-all duration-700 ease-out ${
                showAccent 
                  ? 'text-transparent bg-clip-text bg-gradient-primary' 
                  : 'text-foreground'
              }`}
            >
              alla pratar om
            </span>
          </h1>

          {/* Subheadline */}
          <p 
            className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ textWrap: 'balance' }}
          >
            Promotley analyserar din målgrupp och skapar personliga innehållsstrategier 
            som hjälper ditt UF-företag att växa på sociala medier.
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <Link to="/auth">
              <Button 
                variant="gradient" 
                size="lg"
                className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                Starta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            {!user && (
              <Link to="/join">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-base px-8 py-6 border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-200"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Anslut till företag
                </Button>
              </Link>
            )}
          </div>

          {/* Social Proof */}
          <div 
            className={`flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground transition-all duration-700 delay-400 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Gratis att börja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Inget kort krävs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>GDPR-säkert</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
