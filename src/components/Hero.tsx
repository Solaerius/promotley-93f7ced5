import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const Hero = () => {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showElements, setShowElements] = useState({
    badge: false,
    headline: false,
    subheadline: false,
    buttons: false,
    social: false,
  });

  useEffect(() => {
    // Staggered entrance animations
    const timers = [
      setTimeout(() => setIsLoaded(true), 100),
      setTimeout(() => setShowElements(prev => ({ ...prev, badge: true })), 200),
      setTimeout(() => setShowElements(prev => ({ ...prev, headline: true })), 400),
      setTimeout(() => setShowElements(prev => ({ ...prev, subheadline: true })), 700),
      setTimeout(() => setShowElements(prev => ({ ...prev, buttons: true })), 1000),
      setTimeout(() => setShowElements(prev => ({ ...prev, social: true })), 1300),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Vibrant gradient background - restored */}
      <div className="absolute inset-0 bg-gradient-diagonal" />
      
      {/* Animated blur orbs */}
      <div className="blur-orb blur-orb-primary w-[600px] h-[600px] -top-48 -right-48 animate-glow-pulse" />
      <div className="blur-orb blur-orb-secondary w-[500px] h-[500px] bottom-0 -left-32 animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="blur-orb blur-orb-primary w-[300px] h-[300px] top-1/2 left-1/4 animate-glow-pulse" style={{ animationDelay: '0.75s' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with bounce animation */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm ${
              showElements.badge ? 'animate-bounce-in' : 'opacity-0'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">AI-driven marknadsföring för UF-företag</span>
          </div>

          {/* Main Headline with blur-in animation */}
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight text-white ${
              showElements.headline ? 'animate-blur-in' : 'opacity-0'
            }`}
            style={{ textWrap: 'balance' }}
          >
            Bli företaget{" "}
            <span className="text-gradient">
              alla pratar om
            </span>
          </h1>

          {/* Subheadline with fade animation */}
          <p 
            className={`text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed ${
              showElements.subheadline ? 'animate-blur-in' : 'opacity-0'
            }`}
            style={{ textWrap: 'balance', animationDelay: '0.1s' }}
          >
            Promotley analyserar din målgrupp och skapar personliga innehållsstrategier 
            som hjälper ditt UF-företag att växa på sociala medier.
          </p>

          {/* CTA Buttons with staggered slide animation */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 ${
              showElements.buttons ? 'animate-blur-in' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.15s' }}
          >
            <Link to="/auth">
              <Button 
                size="lg"
                className="text-base px-8 py-6 bg-white text-accent hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] font-semibold"
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
                  className="text-base px-8 py-6 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Anslut till företag
                </Button>
              </Link>
            )}
          </div>

          {/* Social Proof with staggered fade */}
          <div 
            className={`flex flex-wrap items-center justify-center gap-6 text-sm text-white/70 ${
              showElements.social ? 'animate-blur-in' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span>Gratis att börja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span>Inget kort krävs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span>GDPR-säkert</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
