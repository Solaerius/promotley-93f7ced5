import { AlertCircle, CheckCircle } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background font-poppins">
      {/* Sentinel for header bubble trigger */}
      <div id="header-bubble-sentinel" aria-hidden="true" className="absolute" />
      <div className="container mx-auto">
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
