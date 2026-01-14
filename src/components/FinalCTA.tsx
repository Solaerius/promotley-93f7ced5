import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Gratis strategisession",
  "Ingen betalmetod krävs", 
  "Avsluta när du vill"
];

const FinalCTA = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Vibrant gradient background - matching hero */}
      <div className="absolute inset-0 bg-gradient-diagonal" />
      
      {/* Animated blur orbs */}
      <div className="blur-orb blur-orb-primary w-[600px] h-[600px] -top-64 left-1/2 -translate-x-1/2 animate-glow-pulse" />
      <div className="blur-orb blur-orb-secondary w-[400px] h-[400px] bottom-0 right-0 animate-glow-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Börja din tillväxtresa idag</span>
          </div>
          
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ textWrap: 'balance' }}>
            Nästa virala inlägg <span className="text-gradient">börjar här</span>
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto" style={{ textWrap: 'balance' }}>
            Få din personliga innehållsstrategi - anpassad efter din budget, bransch och tillgängliga tid
          </p>
          
          {/* CTA Button */}
          <Link to="/auth">
            <Button 
              size="lg"
              className="text-lg px-10 py-7 bg-white text-accent hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] mb-8 font-semibold"
            >
              Starta gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
