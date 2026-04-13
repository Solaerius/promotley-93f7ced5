import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
  const { t } = useTranslation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const contacts = [
    { label: "General", email: "uf@promotley.se" },
    { label: "Support", email: "support@promotley.se" },
    { label: "Privacy", email: "privacy@promotley.se" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('terms.back')}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4 text-foreground">Contact us</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have a question, a problem, or just want to say hello? We're here.
        </p>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {contacts.map((c) => (
            <a
              key={c.email}
              href={`mailto:${c.email}`}
              className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card/20 hover:bg-card/40 transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "hsl(var(--primary) / 0.12)" }}
              >
                <Mail className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{c.label}</p>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {c.email}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Address */}
        <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card/20 mb-12">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <MapPin className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Address</p>
            <p className="text-sm font-medium text-foreground">Borgarfjordsgatan 6C</p>
            <p className="text-sm text-muted-foreground">164 40 Kista, Sverige</p>
          </div>
        </div>

        {/* Quick message */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/20">
          <h2 className="font-semibold text-foreground mb-3">Send us a message</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click the email address above to open your email client, or write to{" "}
            <a href="mailto:uf@promotley.se" className="text-primary hover:underline">
              uf@promotley.se
            </a>{" "}
            directly. We usually respond within one business day.
          </p>
          <a href="mailto:uf@promotley.se">
            <Button variant="gradient" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Email us
            </Button>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
