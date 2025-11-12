import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { onboardingSchema } from "@/lib/validations";
import logo from "@/assets/logo.png";

const Onboarding = () => {
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [socialAccounts, setSocialAccounts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att fortsätta.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate input
      const result = onboardingSchema.safeParse({ industry, keywords });
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message).join(", ");
        toast({
          title: "Valideringsfel",
          description: errors,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update user profile with onboarding data
      const { error } = await supabase
        .from("users")
        .update({
          industry: result.data.industry,
          keywords: result.data.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Välkommen! 🎉",
        description: "Din profil är nu komplett. Börja koppla dina sociala mediekonton.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte spara din information. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <Card className="w-full max-w-2xl p-8 shadow-elegant">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <img src={logo} alt="Promotley Logo" className="w-12 h-12" />
            <span>Promotley</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Berätta om ditt företag
          </h1>
          <p className="text-muted-foreground">
            Hjälp oss skapa en personlig AI-driven marknadsföringsstrategi för dig
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="industry">Bransch *</Label>
            <Input
              id="industry"
              type="text"
              placeholder="T.ex. Mode, Teknik, Livsmedel"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Målgrupp *</Label>
            <Input
              id="targetAudience"
              type="text"
              placeholder="T.ex. Unga vuxna 18-25 år"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kort beskrivning av företaget *</Label>
            <Textarea
              id="description"
              placeholder="Beskriv vad ditt UF-företag gör och vad som gör er unika..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Nyckelord *</Label>
            <Input
              id="keywords"
              type="text"
              placeholder="Ange nyckelord separerade med komma"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              T.ex. hållbarhet, handgjort, svensktillverkat
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialAccounts">Sociala mediekonton (valfritt)</Label>
            <Input
              id="socialAccounts"
              type="text"
              placeholder="Instagram, TikTok, Facebook användarnamn"
              value={socialAccounts}
              onChange={(e) => setSocialAccounts(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sparar..." : "Slutför och fortsätt"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Du kan alltid uppdatera denna information senare i dina inställningar
        </p>
      </Card>
    </div>
  );
};

export default Onboarding;
