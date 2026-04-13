import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { ConnectionManager } from "@/components/ConnectionManager";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Mode = "create" | "join" | null;

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function Onboarding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createOrganization, joinByCode } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Join flow state
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [foundOrg, setFoundOrg] = useState<{ id: string; name: string } | null>(null);

  // Create flow form data
  const [formData, setFormData] = useState({
    full_name: "",
    foretagsnamn: "",
    branch: "",
    stad: "",
    postnummer: "",
    land: "Sverige",
    malgrupp: "",
    produkt_beskrivning: "",
    malsattning: "",
    prisniva: "",
    nyckelord: "",
    tonalitet: "",
    allman_info: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  const set = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const clearErrors = () => setFieldErrors({});

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
    clearErrors();
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
    clearErrors();
  };

  // Verify invite code against organizations table
  const handleVerifyCode = async () => {
    if (!inviteCode.trim()) return;
    setJoinLoading(true);
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("invite_code", inviteCode.toUpperCase())
        .eq("invite_link_enabled", true)
        .maybeSingle();

      if (org) {
        setFoundOrg(org);
      } else {
        toast({ title: t("errors.invite_code_not_found"), variant: "destructive" });
        setFoundOrg(null);
      }
    } catch {
      toast({ title: t("errors.network"), variant: "destructive" });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!foundOrg) return;
    setIsSubmitting(true);
    const success = await joinByCode(inviteCode);
    if (success) {
      await supabase
        .from("ai_profiles")
        .upsert({ user_id: user!.id, onboarding_completed: true }, { onConflict: "user_id" });
      trackEvent("onboarding_join_complete");
      navigate("/dashboard");
    }
    setIsSubmitting(false);
  };

  // Validate step fields
  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    const req = t("errors.field_required");
    if (step === 1) {
      if (!formData.foretagsnamn.trim()) errs.foretagsnamn = req;
      if (!formData.branch) errs.branch = req;
      if (!formData.stad.trim()) errs.stad = req;
      if (!formData.postnummer.trim()) errs.postnummer = req;
      else if (!/^\d{5}$/.test(formData.postnummer)) errs.postnummer = t("onboarding.postal_code_digits");
    }
    if (step === 2) {
      if (!formData.malgrupp.trim()) errs.malgrupp = req;
      if (!formData.produkt_beskrivning.trim()) errs.produkt_beskrivning = req;
    }
    if (step === 4) {
      if (!acceptedTerms) errs.terms = t("errors.terms_required");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) goNext();
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Save full name to Supabase user metadata so dashboard greeting works
      if (formData.full_name.trim()) {
        await supabase.auth.updateUser({ data: { full_name: formData.full_name.trim() } });
      }

      const orgId = await createOrganization(formData.foretagsnamn);
      if (!orgId) throw new Error("org_failed");

      const { error: profileError } = await supabase
        .from("ai_profiles")
        .upsert(
          {
            user_id: user.id,
            foretagsnamn: formData.foretagsnamn,
            branch: formData.branch,
            stad: formData.stad,
            postnummer: formData.postnummer,
            land: formData.land,
            malgrupp: formData.malgrupp,
            produkt_beskrivning: formData.produkt_beskrivning,
            malsattning: formData.malsattning || null,
            prisniva: formData.prisniva || null,
            nyckelord: formData.nyckelord || null,
            tonalitet: formData.tonalitet || null,
            allman_info: formData.allman_info || null,
            onboarding_completed: true,
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      trackEvent("onboarding_complete");
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding submit failed:", err);
      toast({ title: t("common.error_generic"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const INDUSTRIES = t("onboarding.industries", { returnObjects: true }) as string[];
  const TONALITY_OPTIONS = t("onboarding.tones", { returnObjects: true }) as string[];
  const PROGRESS_LABELS = t("onboarding.progress_labels", { returnObjects: true }) as string[];

  const RequiredMark = () => (
    <span className="text-[hsl(var(--accent-brand))] ml-0.5">*</span>
  );

  const FieldError = ({ id }: { id: string }) =>
    fieldErrors[id] ? (
      <p className="text-xs text-destructive mt-1">{fieldErrors[id]}</p>
    ) : null;

  // ─── STEP 0 — Mode selection ───────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{t("onboarding.step0_title")}</h1>
        <p className="text-muted-foreground mt-2">{t("onboarding.step0_subtitle")}</p>
      </div>
      <div className="grid gap-4">
        <button
          onClick={() => { setMode("create"); goNext(); }}
          className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/60 hover:bg-primary/5 text-left transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-base">{t("onboarding.create_company")}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("onboarding.create_company_desc")}</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => { setMode("join"); goNext(); }}
          className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/60 hover:bg-primary/5 text-left transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-base">{t("onboarding.join_company")}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("onboarding.join_company_desc")}</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // ─── JOIN FLOW ─────────────────────────────────────────────────────────────
  const renderJoinStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold">{t("onboarding.join_company")}</h2>
        <p className="text-muted-foreground mt-2">{t("onboarding.join_company_desc")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inviteCode">{t("onboarding.invite_code")}</Label>
        <div className="flex gap-2">
          <Input
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setFoundOrg(null); }}
            placeholder={t("onboarding.invite_code_placeholder")}
            className="flex-1"
          />
          <Button onClick={handleVerifyCode} disabled={joinLoading || !inviteCode.trim()} variant="outline">
            {t("onboarding.verify_code")}
          </Button>
        </div>
      </div>
      {foundOrg && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
        >
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✓ {foundOrg.name}
          </p>
          <Button onClick={handleJoin} disabled={isSubmitting} className="mt-3 w-full button-primary">
            {t("onboarding.join_org", { name: foundOrg.name })}
          </Button>
        </motion.div>
      )}
    </div>
  );

  // ─── CREATE STEP 1 — Basic info ────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("onboarding.step1_title")}</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">{t("onboarding.your_name")}</Label>
        <Input id="full_name" value={formData.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder={t("onboarding.name_placeholder")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="foretagsnamn">{t("onboarding.company_name")}<RequiredMark /></Label>
        <Input id="foretagsnamn" value={formData.foretagsnamn} onChange={(e) => set("foretagsnamn", e.target.value)} />
        <FieldError id="foretagsnamn" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="branch">{t("onboarding.industry")}<RequiredMark /></Label>
        <Select value={formData.branch} onValueChange={(v) => set("branch", v)}>
          <SelectTrigger id="branch">
            <SelectValue placeholder={t("onboarding.select_industry")} />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4}>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="branch" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stad">{t("onboarding.city")}<RequiredMark /></Label>
          <Input id="stad" value={formData.stad} onChange={(e) => set("stad", e.target.value)} />
          <FieldError id="stad" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postnummer">{t("onboarding.postal_code")}<RequiredMark /></Label>
          <Input id="postnummer" value={formData.postnummer} onChange={(e) => set("postnummer", e.target.value)} maxLength={5} />
          <FieldError id="postnummer" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="land">{t("onboarding.country")}</Label>
        <Input id="land" value={formData.land} onChange={(e) => set("land", e.target.value)} />
      </div>
    </div>
  );

  // ─── CREATE STEP 2 — Target audience ──────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("onboarding.step2_title")}</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="malgrupp">{t("onboarding.target_audience")}<RequiredMark /></Label>
        <Input id="malgrupp" value={formData.malgrupp} onChange={(e) => set("malgrupp", e.target.value)} placeholder={t("onboarding.target_audience_placeholder")} />
        <FieldError id="malgrupp" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="produkt_beskrivning">{t("onboarding.description")}<RequiredMark /></Label>
        <Textarea id="produkt_beskrivning" value={formData.produkt_beskrivning} onChange={(e) => set("produkt_beskrivning", e.target.value)} placeholder={t("onboarding.description_placeholder")} rows={4} />
        <FieldError id="produkt_beskrivning" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="malsattning">{t("onboarding.goal")}</Label>
        <Input id="malsattning" value={formData.malsattning} onChange={(e) => set("malsattning", e.target.value)} placeholder={t("onboarding.goal_placeholder")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prisniva">{t("onboarding.price_level")}</Label>
        <Input id="prisniva" value={formData.prisniva} onChange={(e) => set("prisniva", e.target.value)} placeholder={t("onboarding.price_level_placeholder")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nyckelord">{t("onboarding.keywords")}</Label>
        <Input id="nyckelord" value={formData.nyckelord} onChange={(e) => set("nyckelord", e.target.value)} placeholder={t("onboarding.keywords_placeholder")} />
      </div>
    </div>
  );

  // ─── CREATE STEP 3 — Channels ──────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("onboarding.step3_title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("onboarding.optional_recommended")}</p>
      </div>
      <ConnectionManager />
      <div className="space-y-2">
        <Label htmlFor="tonalitet">{t("onboarding.tonality")}</Label>
        <Select value={formData.tonalitet} onValueChange={(v) => set("tonalitet", v)}>
          <SelectTrigger id="tonalitet">
            <SelectValue placeholder={t("onboarding.select_tone")} />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4}>
            {TONALITY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="allman_info">{t("onboarding.general_info")}</Label>
        <Textarea id="allman_info" value={formData.allman_info} onChange={(e) => set("allman_info", e.target.value)} placeholder={t("onboarding.general_info_placeholder")} rows={3} />
      </div>
    </div>
  );

  // ─── CREATE STEP 4 — Confirmation ─────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("onboarding.step4_title")}</h2>
      </div>
      {/* Summary box */}
      <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("onboarding.company_name")}</span>
          <span className="font-medium">{formData.foretagsnamn}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("onboarding.industry")}</span>
          <span className="font-medium">{formData.branch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("onboarding.city")}</span>
          <span className="font-medium">{formData.stad}</span>
        </div>
      </div>
      {/* Terms */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(v) => { setAcceptedTerms(!!v); if (v) setFieldErrors((e) => ({ ...e, terms: "" })); }}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            {t("onboarding.terms")}{" "}
            <Link to="/terms-of-service" className="text-primary underline" target="_blank">
              {t("footer.terms")}
            </Link>
            <span className="text-[hsl(var(--accent-brand))] ml-0.5">*</span>
          </label>
        </div>
        <FieldError id="terms" />
        <div className="flex items-start gap-3">
          <Checkbox id="newsletter" checked={newsletter} onCheckedChange={(v) => setNewsletter(!!v)} className="mt-0.5" />
          <label htmlFor="newsletter" className="text-sm text-muted-foreground cursor-pointer">
            {t("onboarding.newsletter")}
          </label>
        </div>
      </div>
    </div>
  );

  // ─── RIGHT SIDE PROGRESS CHECKLIST ────────────────────────────────────────
  const renderProgressChecklist = () => {
    if (mode !== "create") return null;
    return (
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wide">
            {t("onboarding.your_progress")}
          </h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />
            <div className="space-y-8">
              {PROGRESS_LABELS.map((label, i) => {
                const checkpointStep = i + 1;
                const isDone = step > checkpointStep;
                const isCurrent = step === checkpointStep;
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        isDone
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? "text-foreground" : isDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-primary animate-ping opacity-30" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── MOBILE PROGRESS BAR ──────────────────────────────────────────────────
  const renderMobileProgress = () => {
    if (mode !== "create" || step === 0) return null;
    const pct = ((step - 1) / 4) * 100;
    return (
      <div className="lg:hidden mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{t("onboarding.step_progress", { step })}</span>
          <span>{PROGRESS_LABELS[step - 1]}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (step === 0) return renderStep0();
    if (mode === "join") return renderJoinStep();
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (step === 3) return renderStep3();
    if (step === 4) return renderStep4();
    return null;
  };

  const showNextButton = mode === "create" && step >= 1 && step < 4;
  const showSubmitButton = mode === "create" && step === 4;
  const showBackButton = step > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Promotley" className="h-7 w-7" />
          <span className="font-bold text-foreground">Promotley</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="flex gap-16 w-full max-w-5xl">
          {/* Form area */}
          <div className="flex-1 max-w-xl">
            {renderMobileProgress()}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${mode}-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/40">
              {showBackButton ? (
                <Button variant="ghost" onClick={goBack} disabled={isSubmitting}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("onboarding.back")}
                </Button>
              ) : <div />}
              {showNextButton && (
                <Button onClick={handleNext} className="button-primary">
                  {t("onboarding.next")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {showSubmitButton && (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="button-primary">
                  {isSubmitting ? t("common.loading") : t("onboarding.submit")}
                </Button>
              )}
            </div>
          </div>

          {/* Right progress checklist (desktop only) */}
          {renderProgressChecklist()}
        </div>
      </div>
    </div>
  );
}
