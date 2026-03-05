import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAIProfile } from "@/hooks/useAIProfile";
import { ConnectionManager } from "@/components/ConnectionManager";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import logo from "@/assets/logo.png";

const STEPS = [
  { title: "Grundläggande information", description: "Berätta om ditt företag" },
  { title: "Verksamhet & mål", description: "Vad gör ni och vart vill ni?" },
  { title: "Kanaler & extra", description: "Desto mer vi vet, desto bättre hjälper vi" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, updateProfile, loading } = useAIProfile();

  const [formData, setFormData] = useState({
    foretagsnamn: "",
    branch: "",
    stad: "",
    postnummer: "",
    lan: "",
    land: "Sverige",
    malgrupp: "",
    produkt_beskrivning: "",
    malsattning: "",
    prisniva: "",
    nyckelord: "",
    tonalitet: "",
    allman_info: "",
  });

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        foretagsnamn: profile.foretagsnamn || "",
        branch: profile.branch || "",
        stad: profile.stad || "",
        postnummer: profile.postnummer || "",
        lan: profile.lan || "",
        land: profile.land || "Sverige",
        malgrupp: profile.malgrupp || "",
        produkt_beskrivning: profile.produkt_beskrivning || "",
        malsattning: profile.malsattning || "",
        prisniva: profile.prisniva || "",
        nyckelord: profile.nyckelord?.join(", ") || "",
        tonalitet: profile.tonalitet || "",
        allman_info: profile.allman_info || "",
      }));
    }
  }, [profile]);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Validation per step
  const validateStep1 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.foretagsnamn.trim()) errors.foretagsnamn = "Företagsnamn krävs";
    else if (formData.foretagsnamn.trim().length < 2) errors.foretagsnamn = "Företagsnamn måste vara minst 2 tecken";
    else if (formData.foretagsnamn.trim().length > 100) errors.foretagsnamn = "Max 100 tecken";

    if (!formData.branch.trim()) errors.branch = "Bransch krävs";
    else if (formData.branch.trim().length < 2) errors.branch = "Bransch måste vara minst 2 tecken";
    else if (formData.branch.trim().length > 100) errors.branch = "Max 100 tecken";

    if (!formData.stad.trim()) errors.stad = "Stad krävs";
    else if (!/^[\p{L}\s\-]+$/u.test(formData.stad.trim())) errors.stad = "Stad kan bara innehålla bokstäver";
    else if (formData.stad.trim().length > 100) errors.stad = "Max 100 tecken";

    if (!formData.postnummer.trim()) errors.postnummer = "Postnummer krävs";
    else {
      const cleaned = formData.postnummer.replace(/\s/g, "");
      if (!/^\d{5}$/.test(cleaned)) errors.postnummer = "Postnummer måste vara exakt 5 siffror";
    }

    return errors;
  };

  const validateStep2 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.malgrupp.trim()) errors.malgrupp = "Målgrupp krävs";
    else if (formData.malgrupp.trim().length < 5) errors.malgrupp = "Målgrupp måste vara minst 5 tecken";
    else if (formData.malgrupp.trim().length > 300) errors.malgrupp = "Max 300 tecken";

    if (!formData.produkt_beskrivning.trim()) errors.produkt_beskrivning = "Företagsbeskrivning krävs";
    else if (formData.produkt_beskrivning.trim().length < 10) errors.produkt_beskrivning = "Beskrivningen måste vara minst 10 tecken";
    else if (formData.produkt_beskrivning.trim().length > 1000) errors.produkt_beskrivning = "Max 1000 tecken";

    return errors;
  };

  const isStep1Valid = () => Object.keys(validateStep1()).length === 0;
  const isStep2Valid = () => Object.keys(validateStep2()).length === 0;

  const canProceed = () => {
    if (step === 0) return isStep1Valid();
    if (step === 1) return isStep2Valid();
    return true; // Step 3 is all optional
  };

  const handleNext = () => {
    const errors = step === 0 ? validateStep1() : step === 1 ? validateStep2() : {};
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Fyll i obligatoriska fält korrekt",
        description: Object.values(errors)[0],
        variant: "destructive",
      });
      return;
    }
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsSubmitting(true);
    try {
      const wasAlreadyComplete = profile?.onboarding_completed === true;

      await updateProfile({
        foretagsnamn: formData.foretagsnamn.trim(),
        branch: formData.branch.trim(),
        stad: formData.stad.trim(),
        postnummer: formData.postnummer.replace(/\s/g, "").trim(),
        lan: formData.lan.trim() || undefined,
        land: formData.land.trim() || "Sverige",
        malgrupp: formData.malgrupp.trim(),
        produkt_beskrivning: formData.produkt_beskrivning.trim(),
        malsattning: formData.malsattning.trim() || undefined,
        prisniva: formData.prisniva.trim() || undefined,
        nyckelord: formData.nyckelord
          ? formData.nyckelord.split(",").map((k) => k.trim()).filter(Boolean)
          : undefined,
        tonalitet: formData.tonalitet.trim() || undefined,
        allman_info: formData.allman_info.trim() || undefined,
        onboarding_completed: true,
      });

      // Send welcome email + in-app notification (only first time)
      if (!wasAlreadyComplete) {
        trackEvent("onboarding_complete");
        supabase.functions.invoke("send-onboarding-complete").catch((err) => {
          console.error("Failed to send onboarding complete notification:", err);
        });
      }

      toast({
        title: "Välkommen! 🎉",
        description: "Din profil är nu komplett. Välkommen till Promotely!",
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

  const progressValue = ((step + 1) / STEPS.length) * 100;

  const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;
  const OptionalHint = () => (
    <span className="text-xs text-muted-foreground font-normal ml-1">Valfritt, men rekommenderas</span>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-12">
      <Card className="w-full max-w-2xl p-6 sm:p-8 shadow-elegant">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <img src={logo} alt="Promotely Logo" className="w-10 h-10" />
            <span>Promotely</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  i <= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {/* Step header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{STEPS[step].title}</h1>
          <p className="text-muted-foreground text-sm">{STEPS[step].description}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Företagsnamn <RequiredStar /></Label>
                  <Input
                    value={formData.foretagsnamn}
                    onChange={(e) => updateField("foretagsnamn", e.target.value)}
                    placeholder="T.ex. Solglimtar UF"
                    disabled={isSubmitting}
                    className={fieldErrors.foretagsnamn ? "border-destructive" : ""}
                  />
                  {fieldErrors.foretagsnamn && <p className="text-xs text-destructive">{fieldErrors.foretagsnamn}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Bransch <RequiredStar /></Label>
                  <Input
                    value={formData.branch}
                    onChange={(e) => updateField("branch", e.target.value)}
                    placeholder="T.ex. Mode, Teknik, Livsmedel"
                    disabled={isSubmitting}
                    className={fieldErrors.branch ? "border-destructive" : ""}
                  />
                  {fieldErrors.branch && <p className="text-xs text-destructive">{fieldErrors.branch}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stad/kommun <RequiredStar /></Label>
                    <Input
                      value={formData.stad}
                      onChange={(e) => updateField("stad", e.target.value)}
                      placeholder="T.ex. Stockholm"
                      disabled={isSubmitting}
                      className={fieldErrors.stad ? "border-destructive" : ""}
                    />
                    {fieldErrors.stad && <p className="text-xs text-destructive">{fieldErrors.stad}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Postnummer <RequiredStar /></Label>
                    <Input
                      value={formData.postnummer}
                      onChange={(e) => updateField("postnummer", e.target.value)}
                      placeholder="T.ex. 114 52"
                      disabled={isSubmitting}
                      maxLength={6}
                      className={fieldErrors.postnummer ? "border-destructive" : ""}
                    />
                    {fieldErrors.postnummer && <p className="text-xs text-destructive">{fieldErrors.postnummer}</p>}
                    {!fieldErrors.postnummer && <p className="text-xs text-muted-foreground">5 siffror, t.ex. 11452</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Land <OptionalHint /></Label>
                    <Input
                      value={formData.land}
                      onChange={(e) => updateField("land", e.target.value)}
                      placeholder="Sverige"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Målgrupp <RequiredStar /></Label>
                  <Input
                    value={formData.malgrupp}
                    onChange={(e) => updateField("malgrupp", e.target.value)}
                    placeholder="T.ex. Unga vuxna 18-25 år som gillar hållbart mode"
                    disabled={isSubmitting}
                    className={fieldErrors.malgrupp ? "border-destructive" : ""}
                  />
                  {fieldErrors.malgrupp && <p className="text-xs text-destructive">{fieldErrors.malgrupp}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Beskriv ditt företag <RequiredStar /></Label>
                  <Textarea
                    value={formData.produkt_beskrivning}
                    onChange={(e) => updateField("produkt_beskrivning", e.target.value)}
                    placeholder="T.ex. Vi säljer handgjorda smycken inspirerade av nordisk natur. Vi riktar oss till unga vuxna som gillar hållbart mode."
                    rows={4}
                    disabled={isSubmitting}
                    className={fieldErrors.produkt_beskrivning ? "border-destructive" : ""}
                  />
                  {fieldErrors.produkt_beskrivning && <p className="text-xs text-destructive">{fieldErrors.produkt_beskrivning}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Målsättning <OptionalHint /></Label>
                  <Input
                    value={formData.malsattning}
                    onChange={(e) => updateField("malsattning", e.target.value)}
                    placeholder="T.ex. Öka synlighet och nå 1000 följare"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prisnivå/budget <OptionalHint /></Label>
                    <Input
                      value={formData.prisniva}
                      onChange={(e) => updateField("prisniva", e.target.value)}
                      placeholder="T.ex. 0-500 kr/mån"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Era grundprinciper <OptionalHint /></Label>
                    <Input
                      value={formData.nyckelord}
                      onChange={(e) => updateField("nyckelord", e.target.value)}
                      placeholder="hållbarhet, handgjort"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Separera med komma</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Desto mer information du fyller i, desto bättre kan AI:n hjälpa dig 🚀
                  </p>
                </div>

                {/* OAuth connections */}
                <div className="space-y-2">
                  <Label>Koppla sociala konton <OptionalHint /></Label>
                  <ConnectionManager />
                </div>

                <div className="space-y-2">
                  <Label>Vilken ton ska Promotely AI ha? <OptionalHint /></Label>
                  <Input
                    value={formData.tonalitet}
                    onChange={(e) => updateField("tonalitet", e.target.value)}
                    placeholder="T.ex. Lekfull, professionell, inspirerande"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allmän information <OptionalHint /></Label>
                  <Textarea
                    value={formData.allman_info}
                    onChange={(e) => updateField("allman_info", e.target.value)}
                    placeholder="Berätta något mer om ert företag – allt är välkommet! T.ex. era värderingar, framtidsplaner, unika styrkor, utmaningar ni har. Desto mer vi vet, desto bättre kan vi hjälpa er."
                    rows={5}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </Button>

          {step < 2 ? (
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gap-1"
            >
              Nästa
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1"
            >
              {isSubmitting ? "Sparar..." : "Slutför"}
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Du kan alltid uppdatera denna information senare i dina inställningar
        </p>
      </Card>
    </div>
  );
};

export default Onboarding;
