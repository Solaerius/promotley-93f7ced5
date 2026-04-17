import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import PricingFAQ from "@/components/PricingFAQ";
import Navbar from "@/components/Navbar";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAuth } from "@/hooks/useAuth";
import PromoCodeInput from "@/components/PromoCodeInput";
import { ComingSoonBadge } from "@/components/ComingSoonBadge";
import { PUBLIC_PLANS, getPlanConfig } from "@/lib/planConfig";

interface FeatureRow {
  label: string;
  values: (string | boolean)[]; // one per plan in PUBLIC_PLANS order
  comingSoon?: boolean;
}

// Index order matches PUBLIC_PLANS: [Free, Starter, Growth, Max]
const FEATURE_ROWS: FeatureRow[] = [
  { label: "AI-chatt", values: [true, true, true, true] },
  { label: "AI Content-idéer", values: ["Basic", "Ja", "Avancerade", "Premium"] },
  { label: "Caption Generator", values: ["3/mån", "Ja", "Ja", "Ja"] },
  { label: "Hashtag-förslag", values: [true, true, true, true] },
  { label: "UF-tips", values: [true, true, true, true] },
  { label: "Veckoplanering", values: [false, true, true, true] },
  { label: "Marknadsplaner", values: [false, "1/mån", "5/mån", "Obegränsat"] },
  { label: "Säljradar", values: [false, false, "10/mån", "Obegränsat"] },
  { label: "AI-analys av statistik", values: [false, "Basic", "Djup", "Premium"] },
  { label: "Schemaläggning (manuell)", values: ["3/mån", "10/mån", "Obegränsat", "Obegränsat"] },
  { label: "Kalender + content planner", values: [true, true, true, true] },
  { label: "TikTok-koppling (read-only)", values: [true, true, true, true] },
  { label: "Instagram & Facebook-koppling", values: [true, true, true, true] },
  { label: "Video-upload + auto-publicering", values: ["", "", "", ""], comingSoon: true },
  { label: "AI video-analys", values: ["", "", "", ""], comingSoon: true },
  { label: "Sound-bibliotek från TikTok", values: ["", "", "", ""], comingSoon: true },
  { label: "Organisationer (team)", values: ["1", "1", "3", "Obegränsat"] },
  { label: "Support", values: ["Community", "E-post", "E-post (prio)", "Live chat"] },
];

const PLAN_TAGLINES: Record<string, string> = {
  free_trial: "Testa Promotley utan att betala",
  starter: "För nya UF-företag som precis börjat",
  growth: "För snabbväxande UF-team",
  max: "För etablerade företag med stora ambitioner",
};

const POPULAR_PLAN_ID = "growth";

const renderValue = (value: string | boolean) => {
  if (value === true) return <span className="text-foreground">Ja</span>;
  if (value === false) return <span className="text-muted-foreground/50">—</span>;
  if (value === "") return <span className="text-muted-foreground/50">—</span>;
  return <span className="text-foreground">{value}</span>;
};

const Pricing = () => {
  const navigate = useNavigate();
  const { credits, refetch: refetchCredits } = useUserCredits();
  const { user } = useAuth();

  const currentPlanConfig = getPlanConfig(credits?.plan);
  const currentTier = currentPlanConfig.tier;

  const handleSelectPlan = (planId: string) => {
    if (planId === "free_trial") {
      navigate(user ? "/dashboard" : "/auth?mode=register");
      return;
    }
    navigate(`/checkout?plan=${planId}&type=plan`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 md:py-24 px-4 bg-background font-poppins">
        <div className="container mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold px-2 leading-tight">
              Enkla priser,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                kraftfulla resultat
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
              Välj den plan som passar ditt företags tillväxtfas
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {PUBLIC_PLANS.map((plan) => {
              const isCurrent = credits?.plan === plan.id ||
                (plan.id === "growth" && credits?.plan === "pro") ||
                (plan.id === "max" && (credits?.plan === "pro_xl" || credits?.plan === "pro_unlimited"));
              const isLowerOrSame = user && plan.tier <= currentTier;
              const isPopular = plan.id === POPULAR_PLAN_ID;

              return (
                <Card
                  key={plan.id}
                  className={`p-6 relative bg-card/50 backdrop-blur-md transition-all duration-300 ${
                    isCurrent
                      ? "border-2 border-primary/50 bg-primary/5"
                      : isPopular
                      ? "border-2 border-primary shadow-glow lg:scale-105 hover:-translate-y-2"
                      : "border-2 border-border/50 hover:border-primary/30 hover:-translate-y-2"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Din plan
                      </span>
                    </div>
                  )}
                  {!isCurrent && isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Mest populär
                      </span>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold">{plan.displayName}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2 min-h-[2.5rem]">
                        {PLAN_TAGLINES[plan.id]}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                      <span className="text-sm md:text-base text-muted-foreground">
                        {plan.price === 0 ? "" : "kr/mån"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        {plan.credits}
                      </span>
                      <span className="text-sm">
                        krediter/mån
                        {plan.dailyCreditCap > 0 && (
                          <span className="block text-xs text-muted-foreground/70">
                            (max {plan.dailyCreditCap}/dag)
                          </span>
                        )}
                      </span>
                    </div>

                    <Button
                      variant={isCurrent ? "outline" : "gradient"}
                      className="w-full"
                      size="lg"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || (isLowerOrSame && currentTier > 0)}
                    >
                      {isCurrent
                        ? "Nuvarande plan"
                        : isLowerOrSame && currentTier > 0
                        ? "Ej tillgänglig"
                        : plan.price === 0
                        ? "Kom igång gratis"
                        : `Välj ${plan.displayName}`}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="max-w-7xl mx-auto mt-16">
            <h2 className="text-center text-2xl md:text-3xl font-bold mb-8">
              Jämför planerna
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Funktion</th>
                    {PUBLIC_PLANS.map((p) => (
                      <th
                        key={p.id}
                        className={`text-center p-4 font-semibold ${
                          p.id === POPULAR_PLAN_ID ? "text-primary" : ""
                        }`}
                      >
                        {p.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border/30 last:border-b-0 ${
                        row.comingSoon ? "opacity-60" : ""
                      }`}
                    >
                      <td className="p-4 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={row.comingSoon ? "text-muted-foreground" : "text-foreground"}>
                            {row.label}
                          </span>
                          {row.comingSoon && <ComingSoonBadge />}
                        </div>
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-4 text-center">
                          {row.comingSoon
                            ? <span className="text-muted-foreground/50 text-xs">—</span>
                            : renderValue(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Funktioner märkta <span className="font-medium">"Kommer snart"</span> ingår automatiskt i din plan när de släpps.
            </p>
          </div>

          {/* Bottom note */}
          <p className="text-center text-muted-foreground mt-12 text-sm md:text-base px-4">
            Inga bindningstider · Avsluta när du vill · Top-up tillgängligt
          </p>

          {/* Promo code */}
          <div className="max-w-md mx-auto mt-8">
            {user ? (
              <PromoCodeInput variant="card" onSuccess={() => refetchCredits()} />
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 text-center space-y-3">
                <p className="font-semibold">Har du en kampanjkod?</p>
                <p className="text-sm text-muted-foreground">
                  Skapa ett konto först för att lösa in din kod
                </p>
                <Button variant="outline" onClick={() => navigate("/auth?mode=register")}>
                  Skapa konto
                </Button>
              </div>
            )}
          </div>

          <PricingFAQ />
        </div>
      </section>
    </div>
  );
};

export default Pricing;
