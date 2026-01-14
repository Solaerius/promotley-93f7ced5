import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
const ProblemSection = () => {
  return <section className="py-24 md:py-32 px-4 bg-background font-poppins">
      <div className="container mx-auto max-w-6xl">
        {/* Section header */}
        

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* Before - Problem */}
          <Card className="relative p-8 md:p-10 border-2 border-destructive/20 bg-destructive/5 hover:border-destructive/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">Innan Promotley</h3>
            </div>
            
            <ul className="space-y-4">
              {["Vet inte när eller hur ofta du ska posta", "Ingen koll på budget för marknadsföring", "Låga visningar och engagemang", "Saknar strategi för innehållsplanering", "Osäker på vad som funkar för din bransch"].map((item, idx) => <li key={idx} className="flex items-start gap-4 text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-destructive text-sm font-bold">✗</span>
                  </span>
                  <span className="text-base">{item}</span>
                </li>)}
            </ul>
          </Card>

          {/* After - Solution */}
          <Card className="relative p-8 md:p-10 border-2 border-primary/30 bg-gradient-hero shadow-elegant hover:border-primary/50 transition-all duration-300">
            {/* Recommended badge */}
            <div className="absolute -top-3 right-8">
              <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold shadow-md">
                Rekommenderat
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">Med Promotley</h3>
            </div>
            
            <ul className="space-y-4">
              {["Personlig postningsstrategi", "Budgetanpassad innehållsplan", "Skräddarsytt för din bransch och målgrupp", "Komplett innehållskalender varje vecka", "AI-genererat innehåll redo att publicera"].map((item, idx) => <li key={idx} className="flex items-start gap-4 text-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">✓</span>
                  </span>
                  <span className="text-base font-medium">{item}</span>
                </li>)}
            </ul>
          </Card>
        </div>

        {/* Transition arrow for mobile */}
        <div className="flex justify-center mt-8 md:hidden">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </section>;
};
export default ProblemSection;