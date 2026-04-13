import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Check, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Grundinfo" },
  { id: 2, label: "Marknadsföring" },
  { id: 3, label: "Sociala medier" },
  { id: 4, label: "Villkor" },
];

interface FormData {
  // Step 1
  orgName: string;
  industry: string;
  website: string;
  city: string;
  // Step 2
  targetAudience: string;
  uniqueProperties: string;
  tone: string;
  goals: string;
  // Step 3
  instagramHandle: string;
  tiktokHandle: string;
  facebookHandle: string;
  linkedinHandle: string;
  xHandle: string;
  // Step 4
  acceptTerms: boolean;
  newsletterOptIn: boolean;
}

const INITIAL_FORM: FormData = {
  orgName: "", industry: "", website: "", city: "",
  targetAudience: "", uniqueProperties: "", tone: "", goals: "",
  instagramHandle: "", tiktokHandle: "", facebookHandle: "", linkedinHandle: "", xHandle: "",
  acceptTerms: false, newsletterOptIn: false,
};

// Required fields per step
const REQUIRED: Record<number, (keyof FormData)[]> = {
  1: ["orgName"],
  2: ["targetAudience", "uniqueProperties"],
  3: [],
  4: ["acceptTerms"],
};

function RequiredStar() {
  return <span className="text-orange-500 ml-0.5">★</span>;
}

function AutoTextarea({ value, onChange, placeholder, id }: {
  value: string; onChange: (v: string) => void; placeholder: string; id: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none overflow-hidden min-h-[64px]"
    />
  );
}

export default function CreateOrganization() {
  const { createOrganization } = useOrganization();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Set<keyof FormData>>(new Set());
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof FormData) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const isStepValid = (s: number) => {
    return REQUIRED[s].every(field => {
      const val = form[field];
      return typeof val === "boolean" ? val : (val as string).trim().length > 0;
    });
  };

  const validateCurrentStep = () => {
    const missing = new Set<keyof FormData>();
    REQUIRED[step].forEach(field => {
      const val = form[field];
      const empty = typeof val === "boolean" ? !val : !(val as string).trim();
      if (empty) missing.add(field);
    });
    setErrors(missing);
    return missing.size === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCompletedSteps(prev => new Set([...prev, step]));
    setErrors(new Set());
    setStep(s => s + 1);
  };

  const handlePrev = () => {
    setErrors(new Set());
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    const newAttempts = submitAttempts + 1;
    setSubmitAttempts(newAttempts);

    if (!validateCurrentStep()) {
      if (newAttempts >= 2) {
        setTimeout(() => {
          const el = document.querySelector('[data-error="true"]') as HTMLElement;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("animate-pulse");
            setTimeout(() => el.classList.remove("animate-pulse"), 1500);
          }
        }, 50);
      }
      return;
    }

    if (!session) return;
    setIsSubmitting(true);

    try {
      const orgId = await createOrganization(form.orgName.trim());
      if (!orgId) throw new Error("Org creation failed");

      const { error: profileError } = await supabase.from("organization_profiles").insert({
        organization_id: orgId,
        industry: form.industry || null,
        website: form.website || null,
        city: form.city || null,
        target_audience: form.targetAudience || null,
        unique_properties: form.uniqueProperties || null,
        tone: form.tone || null,
        goals: form.goals || null,
        instagram_handle: form.instagramHandle || null,
        tiktok_handle: form.tiktokHandle || null,
        facebook_handle: form.facebookHandle || null,
        linkedin_handle: form.linkedinHandle || null,
        x_handle: form.xHandle || null,
        newsletter_opt_in: form.newsletterOptIn,
      });

      if (profileError) {
        console.error("Failed to save org profile:", profileError);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (key: keyof FormData) => errors.has(key);

  const inputClass = (key: keyof FormData) =>
    cn("w-full", fieldError(key) && "border-red-500 focus-visible:ring-red-500");

  return (
    <div className="min-h-screen flex bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logo} alt="Promotley" className="w-10 h-10" />
          <span className="font-bold text-xl">Promotley</span>
        </Link>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Konfigurera ditt företag</h1>
              <p className="text-sm text-muted-foreground">Steg {step} av {STEPS.length}</p>
            </div>
          </div>

          {/* Step 1: Grundinfo */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="orgName">Företagsnamn<RequiredStar /></Label>
                <Input
                  id="orgName"
                  className={inputClass("orgName")}
                  data-error={fieldError("orgName") || undefined}
                  placeholder='T.ex. "Stockholms Kaffet UF"'
                  value={form.orgName}
                  onChange={e => set("orgName")(e.target.value)}
                />
                {fieldError("orgName") && <p className="text-xs text-red-500 mt-1">Obligatoriskt fält</p>}
              </div>
              <div>
                <Label htmlFor="industry">Bransch</Label>
                <Input
                  id="industry"
                  placeholder='T.ex. "Livsmedel & dryck", "Mode", "Teknik"'
                  value={form.industry}
                  onChange={e => set("industry")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="website">Webbplats</Label>
                <Input
                  id="website"
                  placeholder="T.ex. www.mittuforetag.se"
                  value={form.website}
                  onChange={e => set("website")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  placeholder='T.ex. "Stockholm", "Göteborg"'
                  value={form.city}
                  onChange={e => set("city")(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Marknadsföring */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="targetAudience">Målgrupp<RequiredStar /></Label>
                <AutoTextarea
                  id="targetAudience"
                  value={form.targetAudience}
                  onChange={v => set("targetAudience")(v)}
                  placeholder='T.ex. "Ungdomar 16–25 år i Stockholm som är intresserade av hållbarhet och lokal mat"'
                />
                {fieldError("targetAudience") && <p className="text-xs text-red-500 mt-1">Obligatoriskt fält</p>}
              </div>
              <div>
                <Label htmlFor="uniqueProperties">Unika egenskaper<RequiredStar /></Label>
                <AutoTextarea
                  id="uniqueProperties"
                  value={form.uniqueProperties}
                  onChange={v => set("uniqueProperties")(v)}
                  placeholder='T.ex. "Vi rostar lokalt, all förpackning är återvinningsbar och vi donerar 5% till välgörenhet"'
                />
                {fieldError("uniqueProperties") && <p className="text-xs text-red-500 mt-1">Obligatoriskt fält</p>}
              </div>
              <div>
                <Label htmlFor="tone">Tonalitet</Label>
                <Input
                  id="tone"
                  placeholder='T.ex. "Vänlig och inspirerande", "Professionell men jordnära"'
                  value={form.tone}
                  onChange={e => set("tone")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goals">Marknadsföringsmål</Label>
                <AutoTextarea
                  id="goals"
                  value={form.goals}
                  onChange={v => set("goals")(v)}
                  placeholder='T.ex. "Öka Instagram-följarna med 500 på 3 månader och driva trafik till vår webbshop"'
                />
              </div>
            </div>
          )}

          {/* Step 3: Sociala medier */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Ange era sociala medier-handles så att AI:n kan skräddarsy innehåll för er. Du kan också lägga till dessa senare.
              </p>
              {[
                { key: "instagramHandle" as keyof FormData, label: "Instagram", placeholder: "@mittuforetag" },
                { key: "tiktokHandle" as keyof FormData, label: "TikTok", placeholder: "@mittuforetag" },
                { key: "facebookHandle" as keyof FormData, label: "Facebook", placeholder: "facebook.com/mittuforetag" },
                { key: "linkedinHandle" as keyof FormData, label: "LinkedIn", placeholder: "linkedin.com/company/mittuforetag" },
                { key: "xHandle" as keyof FormData, label: "X (Twitter)", placeholder: "@mittuforetag" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    placeholder={placeholder}
                    value={form[key] as string}
                    onChange={e => set(key)(e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Villkor */}
          {step === 4 && (
            <div className="space-y-6">
              <div
                data-error={fieldError("acceptTerms") || undefined}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border",
                  fieldError("acceptTerms") ? "border-red-500 bg-red-500/5" : "border-border"
                )}
              >
                <Checkbox
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onCheckedChange={v => set("acceptTerms")(!!v)}
                />
                <Label htmlFor="acceptTerms" className="cursor-pointer leading-relaxed">
                  Jag accepterar Promotleys{" "}
                  <Link to="/terms-of-service" className="underline text-primary" target="_blank">
                    villkor och regler
                  </Link>
                  <RequiredStar />
                </Label>
              </div>
              {fieldError("acceptTerms") && (
                <p className="text-xs text-red-500 -mt-4">Du måste acceptera villkoren för att fortsätta</p>
              )}

              <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                <Checkbox
                  id="newsletter"
                  checked={form.newsletterOptIn}
                  onCheckedChange={v => set("newsletterOptIn")(!!v)}
                />
                <Label htmlFor="newsletter" className="cursor-pointer leading-relaxed">
                  Ta emot nyhetsbrev med tips och nyheter om Promotley (valfritt)
                </Label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev} disabled={isSubmitting}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Föregående
              </Button>
            )}
            {step < STEPS.length ? (
              <Button
                type="button"
                className="flex-1"
                onClick={handleNext}
                disabled={!isStepValid(step)}
              >
                Nästa
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Skapar...</>
                ) : (
                  "Skapa företaget nu"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Vertical progress bar */}
      <div className="hidden lg:flex flex-col items-center py-12 px-8 border-l border-border/50 w-56 gap-0">
        <div className="relative flex flex-col items-center gap-0 w-full">
          {STEPS.map((s, i) => {
            const isComplete = completedSteps.has(s.id);
            const isActive = step === s.id;
            const isFuture = step < s.id;
            return (
              <div key={s.id} className="flex flex-col items-center w-full">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300 z-10",
                  isComplete ? "bg-green-500 border-green-500 text-white" : "",
                  isActive ? "bg-primary border-primary text-white" : "",
                  isFuture ? "bg-background border-border text-muted-foreground" : "",
                )}>
                  {isComplete ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-xs mt-1 mb-1 font-medium text-center",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-8 transition-colors duration-500",
                    isComplete ? "bg-green-500" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
