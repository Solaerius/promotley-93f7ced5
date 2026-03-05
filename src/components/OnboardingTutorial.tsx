import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useAIProfile } from "@/hooks/useAIProfile";
import logo from "@/assets/logo.png";

/**
 * Each tutorial step targets a real DOM element by selector,
 * navigates to the correct page, and shows a tooltip explanation.
 */
interface TutorialStep {
  /** CSS selector for the element to spotlight */
  selector: string;
  /** Route to navigate to before highlighting */
  route: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description of the feature */
  description: string;
  /** Where the tooltip should appear relative to the highlighted element */
  tooltipPosition: "top" | "bottom" | "left" | "right";
  /** Padding around the highlighted element */
  padding?: number;
}

const STEPS: TutorialStep[] = [
  // Dashboard page
  {
    selector: '[data-tour="stats-row"]',
    route: "/dashboard",
    title: "Dina siffror",
    description:
      "Här ser du en snabb översikt av dina viktigaste mätvärden – veckoframsteg, följare, planerade inlägg och AI-krediter.",
    tooltipPosition: "bottom",
    padding: 12,
  },
  {
    selector: '[data-tour="growth-chart"]',
    route: "/dashboard",
    title: "Tillväxtgraf",
    description:
      "Grafen visar hur dina följare växer per plattform. Byt tidsperiod för att se trender över tid.",
    tooltipPosition: "top",
    padding: 8,
  },
  {
    selector: '[data-tour="quick-links"]',
    route: "/dashboard",
    title: "Snabblänkar",
    description:
      "Hoppa direkt till Statistik, AI-Chat eller Kalender med ett klick.",
    tooltipPosition: "bottom",
    padding: 8,
  },
  // Analytics page
  {
    selector: '[data-tour="analytics-overview"]',
    route: "/analytics",
    title: "Statistiköversikt",
    description:
      "Utforska detaljerad data från dina kopplade sociala medier. Se följare, räckvidd och engagemang – allt på ett ställe.",
    tooltipPosition: "bottom",
    padding: 8,
  },
  // AI page
  {
    selector: '[data-tour="ai-tabs"]',
    route: "/ai",
    title: "AI-Assistent",
    description:
      "Här hittar du Chat, Verktyg, AI-Analys och Säljradar. Använd dessa för att få personliga marknadsföringstips och innehållsidéer.",
    tooltipPosition: "bottom",
    padding: 8,
  },
  // Calendar page
  {
    selector: '[data-tour="calendar-view"]',
    route: "/calendar",
    title: "Innehållskalender",
    description:
      "Planera och schemalägg dina inlägg visuellt. Klicka på en dag för att lägga till ett inlägg, eller låt AI:n fylla kalendern åt dig.",
    tooltipPosition: "bottom",
    padding: 8,
  },
  // Account page
  {
    selector: '[data-tour="account-section"]',
    route: "/account",
    title: "Konto och inställningar",
    description:
      "Hantera din profil, koppla sociala medier, uppdatera företagsinformation och se dina krediter.",
    tooltipPosition: "bottom",
    padding: 8,
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { updateProfile } = useAIProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const retryRef = useRef<ReturnType<typeof setTimeout>>();

  const markSeen = async () => {
    try {
      await updateProfile({ tutorial_seen: true } as any);
    } catch {
      // silent
    }
  };

  const handleSkip = async () => {
    await markSeen();
    onComplete();
    navigate("/onboarding");
  };

  const handleStartTutorial = () => {
    setShowTutorial(true);
    navigate(STEPS[0].route);
  };

  // Find and measure the target element
  const measureElement = useCallback((step: TutorialStep) => {
    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const padding = step.padding || 8;
      setSpotlightRect(
        new DOMRect(
          rect.x - padding,
          rect.y - padding,
          rect.width + padding * 2,
          rect.height + padding * 2
        )
      );
      setIsTransitioning(false);
      return true;
    }
    return false;
  }, []);

  // When step changes, navigate and find element
  useEffect(() => {
    if (!showTutorial) return;
    const step = STEPS[currentStep];
    if (!step) return;

    // Navigate if needed
    if (location.pathname !== step.route) {
      setIsTransitioning(true);
      setSpotlightRect(null);
      navigate(step.route);
    }

    // Try to find element with retries (page might still be rendering)
    let attempts = 0;
    const tryFind = () => {
      if (measureElement(step)) return;
      attempts++;
      if (attempts < 20) {
        retryRef.current = setTimeout(tryFind, 150);
      } else {
        // Element not found – show without spotlight
        setSpotlightRect(null);
        setIsTransitioning(false);
      }
    };

    // Small delay for page transition
    retryRef.current = setTimeout(tryFind, 300);

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [currentStep, showTutorial, location.pathname, navigate, measureElement]);

  // Update spotlight on resize/scroll
  useEffect(() => {
    if (!showTutorial || !spotlightRect) return;
    const step = STEPS[currentStep];
    
    const handleResize = () => measureElement(step);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [showTutorial, spotlightRect, currentStep, measureElement]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setIsTransitioning(true);
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    await markSeen();
    onComplete();
    navigate("/onboarding");
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const margin = 16;
    const pos = step.tooltipPosition;

    if (pos === "bottom") {
      return {
        position: "fixed",
        top: Math.min(spotlightRect.bottom + margin, window.innerHeight - 280),
        left: Math.max(16, Math.min(spotlightRect.left, window.innerWidth - 400)),
      };
    }
    if (pos === "top") {
      return {
        position: "fixed",
        bottom: window.innerHeight - spotlightRect.top + margin,
        left: Math.max(16, Math.min(spotlightRect.left, window.innerWidth - 400)),
      };
    }
    if (pos === "right") {
      return {
        position: "fixed",
        top: spotlightRect.top,
        left: Math.min(spotlightRect.right + margin, window.innerWidth - 400),
      };
    }
    // left
    return {
      position: "fixed",
      top: spotlightRect.top,
      right: window.innerWidth - spotlightRect.left + margin,
    };
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {!showTutorial ? (
          /* Welcome screen */
          <motion.div
            key="welcome"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.35 }}
              className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-background/80 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <img src={logo} alt="Promotely" className="w-14 h-14" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Välkommen till Promotely!
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
                    Visa mig runt
                    <ArrowRight className="ml-1 h-4 w-4" />
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
          </motion.div>
        ) : (
          /* Spotlight overlay + tooltip */
          <>
            {/* Dark overlay with cutout */}
            <svg
              className="fixed inset-0 w-full h-full z-[100] pointer-events-auto"
              style={{ cursor: "default" }}
              onClick={(e) => e.stopPropagation()}
            >
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {spotlightRect && !isTransitioning && (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      x={spotlightRect.x}
                      y={spotlightRect.y}
                      width={spotlightRect.width}
                      height={spotlightRect.height}
                      rx={12}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.75)"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Spotlight border glow */}
            {spotlightRect && !isTransitioning && (
              <motion.div
                className="fixed z-[101] rounded-xl border-2 border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.3)] pointer-events-none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  left: spotlightRect.x,
                  top: spotlightRect.y,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                }}
              />
            )}

            {/* Tooltip card */}
            <motion.div
              key={`tooltip-${currentStep}`}
              className="z-[102] w-[calc(100vw-32px)] max-w-sm rounded-2xl border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-xl"
              style={getTooltipStyle()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Stäng"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentStep + 1} av {STEPS.length}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Content */}
              <div className="pr-6">
                <h3 className="text-lg font-bold mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Navigation */}
              <div className="mt-5 flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handlePrev}
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Tillbaka
                  </Button>
                )}
                {currentStep < STEPS.length - 1 ? (
                  <Button size="sm" className="flex-1" onClick={handleNext}>
                    Nästa
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={handleFinish}>
                    Fyll i företagsinformation
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingTutorial;
