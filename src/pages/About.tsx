import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const { t } = useTranslation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('terms.back')}
          </Button>
        </Link>

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            We are{" "}
            <span
              className="text-gradient"
              style={{
                background: "var(--gradient-text)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Promotley
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            We built Promotley to give Swedish UF companies the same marketing power as established brands — without the budget, agency fees, or wasted hours.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16 p-8 rounded-2xl border border-border/50 bg-card/30">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Our mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every year, thousands of Swedish high school students launch their own companies through Ungdomsföretag (UF). They have great ideas, real ambition — but almost no time or marketing knowledge. Promotley exists to change that. Our AI analyzes your company, your audience, and your industry, then delivers a complete content strategy tailored exactly to you.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-foreground">What we stand for</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Youth first",
                body: "We design every feature with UF students in mind — fast, simple, and built for people who have a lot going on.",
              },
              {
                title: "Honest AI",
                body: "Our AI gives you real, actionable strategy — not generic advice. We tell you exactly when, how often, and what to post.",
              },
              {
                title: "Full transparency",
                body: "No hidden costs, no confusing tiers. You own your data. You can export or delete everything at any time.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="p-6 rounded-xl border border-border/50 bg-card/20"
              >
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16 p-8 rounded-2xl border border-border/50 bg-card/30">
          <h2 className="text-2xl font-bold mb-6 text-foreground">The team</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Promotley was founded by three students who wanted to solve the exact problem they saw around them — UF companies with great products but no strategy for getting seen.
          </p>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Jonas Khaldi</span> — Jonas.khaldi@promotley.se</p>
            <p><span className="font-medium text-foreground">Thami Alami</span> — Thami.Alami@promotley.se</p>
            <p><span className="font-medium text-foreground">Eddie Ervenius</span> — Eddie.Ervenius@promotley.se</p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Borgarfjordsgatan 6C, 164 40 Kista, Sverige
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link to="/auth?mode=register">
            <Button size="lg" variant="gradient" className="text-base px-8">
              Get started for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
