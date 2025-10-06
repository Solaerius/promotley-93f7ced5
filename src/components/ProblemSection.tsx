import { AlertCircle, CheckCircle } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="py-24 px-4 bg-background font-poppins">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Section title */}
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Du vet känslan när du lägger tid på{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              content som ingen ser?
            </span>
          </h2>

          {/* Split screen comparison */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Before - Problem */}
            <div className="relative p-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-6">
                <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                <h3 className="text-2xl font-bold text-foreground">Innan Promotley</h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Vet inte när eller hur ofta du ska posta",
                  "Ingen koll på budget för marknadsföring",
                  "Låga visningar och engagemang",
                  "Saknar strategi för innehållsplanering",
                  "Osäker på vad som funkar för din bransch",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                    <span className="text-destructive text-xl shrink-0">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After - Solution */}
            <div className="relative p-8 rounded-2xl border-2 border-primary/30 bg-gradient-hero backdrop-blur-sm shadow-glow">
              <div className="flex items-start gap-4 mb-6">
                <CheckCircle className="w-8 h-8 text-primary shrink-0" />
                <h3 className="text-2xl font-bold text-foreground">Med Promotley</h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  "Personlig postningsstrategi (tid & frekvens)",
                  "Budgetanpassad innehållsplan",
                  "Skräddarsytt för din bransch och målgrupp",
                  "Komplett innehållskalender varje vecka",
                  "AI-genererat innehåll redo att publicera",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground">
                    <span className="text-primary text-xl shrink-0">✓</span>
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
