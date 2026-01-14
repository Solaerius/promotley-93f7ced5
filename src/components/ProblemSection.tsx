import { AlertCircle, CheckCircle, ArrowRight, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ProblemSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-background overflow-hidden section-transition-down">
      {/* Subtle top transition from dark hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/20 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Problemet</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ textWrap: 'balance' }}>
            Du vet känslan när du lägger tid på{" "}
            <span className="text-gradient">content som ingen ser?</span>
          </h2>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch max-w-5xl mx-auto">
          {/* Before - Problem */}
          <Card className="card-unified border-destructive/20 bg-destructive/5 hover:border-destructive/30">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Innan Promotley</h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Vet inte när eller hur ofta du ska posta",
                  "Ingen koll på budget för marknadsföring",
                  "Låga visningar och engagemang",
                  "Saknar strategi för innehållsplanering",
                  "Osäker på vad som funkar för din bransch",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-destructive text-sm font-bold">✗</span>
                    </span>
                    <span className="text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* After - Solution */}
          <Card className="card-unified border-primary/30 bg-gradient-warm relative">
            {/* Recommended badge */}
            <div className="absolute -top-3 right-8">
              <span className="bg-gradient-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold shadow-md">
                Rekommenderat
              </span>
            </div>
            
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Med Promotley</h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Personlig postningsstrategi",
                  "Budgetanpassad innehållsplan",
                  "Skräddarsytt för din bransch och målgrupp",
                  "Komplett innehållskalender varje vecka",
                  "AI-genererat innehåll redo att publicera",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-bold">✓</span>
                    </span>
                    <span className="text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Transition arrow for mobile */}
        <div className="flex justify-center mt-8 md:hidden">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
