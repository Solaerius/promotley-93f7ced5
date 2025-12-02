import { AlertCircle, CheckCircle } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="relative py-16 md:py-24 px-4 font-poppins overflow-hidden">
      {/* Brand gradient background - dark/light mode variants */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 dark:from-primary/30 dark:via-secondary/25 dark:to-accent/30" />
      {/* Light mode white overlay for readability */}
      <div className="absolute inset-0 bg-background/60 dark:bg-transparent" />
      {/* Subtle animated glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section title */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 px-2 leading-tight">
            Du vet känslan när du lägger tid på{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              content som ingen ser?
            </span>
          </h2>

          {/* Split screen comparison */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* Before - Problem */}
            <div className="relative p-6 md:p-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5 backdrop-blur-sm">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-destructive shrink-0" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">Innan Promotley</h3>
              </div>
              
              <ul className="space-y-3 md:space-y-4">
                {[
                  "Vet inte när eller hur ofta du ska posta",
                  "Ingen koll på budget för marknadsföring",
                  "Låga visningar och engagemang",
                  "Saknar strategi för innehållsplanering",
                  "Osäker på vad som funkar för din bransch",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-muted-foreground">
                    <span className="text-destructive text-lg md:text-xl shrink-0">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After - Solution */}
            <div className="relative p-6 md:p-8 rounded-2xl border-2 border-primary/30 bg-gradient-hero backdrop-blur-sm shadow-glow">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">Med Promotley</h3>
              </div>
              
              <ul className="space-y-3 md:space-y-4">
                {[
                  "Personlig postningsstrategi",
                  "Budgetanpassad innehållsplan",
                  "Skräddarsytt för din bransch och målgrupp",
                  "Komplett innehållskalender varje vecka",
                  "AI-genererat innehåll redo att publicera",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-foreground">
                    <span className="text-primary text-lg md:text-xl shrink-0">✓</span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
