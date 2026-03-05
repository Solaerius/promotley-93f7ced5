import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  CalendarDays,
  Settings,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useAIProfile } from "@/hooks/useAIProfile";

const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Här ser du en översikt av dina siffror — följare, visningar och engagemang. Tillväxtgrafen visar hur ditt konto växer över tid och snabblänkarna tar dig direkt till de viktigaste verktygen.",
  },
  {
    icon: BarChart3,
    title: "Statistik",
    description:
      "Utforska detaljerad data från dina kopplade sociala medier. Se historik, engagemangsöversikt och jämför prestanda mellan plattformar — allt på ett ställe.",
  },
  {
    icon: Bot,
    title: "AI-assistent",
    description:
      "Chatta med din personliga AI, använd smarta verktyg för innehållsidéer, hashtags, bildtexter och marknadsföringsplaner. Allt anpassat efter ditt företag.",
  },
  {
    icon: CalendarDays,
    title: "Kalender",
    description:
      "Planera och schemalägg ditt innehåll visuellt. AI:n kan fylla i kalendern åt dig med förslag baserade på din bransch och målgrupp.",
  },
  {
    icon: Settings,
    title: "Konto & Inställningar",
    description:
      "Koppla dina sociala medier, hantera din profil, uppdatera företagsinformation och se dina krediter. Allt du behöver för att hålla koll.",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { updateProfile } = useAIProfile();
  const navigate = useNavigate();

  const markSeen = async () => {
    try {
      await updateProfile({ tutorial_seen: true } as any);
    } catch {
      // silent — profile hook already toasts
    }
  };

  const handleSkip = async () => {
    await markSeen();
    onComplete();
    navigate("/onboarding");
  };

  const handleStartTutorial = () => setShowTutorial(true);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    await markSeen();
    onComplete();
    navigate("/onboarding");
  };

  const step = STEPS[currentStep];
  const StepIcon = step?.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {!showTutorial ? (
          /* ── Welcome screen ── */
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.35 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-background/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Välkommen till Promotely! 🎉
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Vi hjälper dig att växa på sociala medier — snabbt, smart och
                  enkelt. Vill du få en snabb rundtur?
                </p>
              </div>
              <div className="flex w-full flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full text-base"
                  onClick={handleStartTutorial}
                >
                  Visa mig runt 🚀
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleSkip}
                >
                  Hoppa till företagsinformation
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Tutorial steps ── */
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-background/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Stäng"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Steg {currentStep + 1} av {STEPS.length}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center text-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <StepIcon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrev}
                >
                  Tillbaka
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button className="flex-1" onClick={handleNext}>
                  Nästa
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleFinish}>
                  Fyll i företagsinformation
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingTutorial;
