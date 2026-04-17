import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Zap, Wand2, Brain, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface UpgradePromptOverlayProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const plans = [
  { name: "Starter", price: "49 kr/mån", credits: "250 krediter", icon: Zap },
  { name: "Growth", price: "159 kr/mån", credits: "950 krediter", icon: Wand2 },
  { name: "Max", price: "299 kr/mån", credits: "2000 krediter", icon: Brain },
];

const UpgradePromptOverlay = ({ open, onClose, feature }: UpgradePromptOverlayProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-background p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{t('upgrade.title')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {feature
                  ? t('upgrade.desc_feature', { feature })
                  : t('upgrade.desc_generic')}
              </p>
            </div>

            <div className="grid gap-3 mb-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.name}
                    className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.credits}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{plan.price}</span>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => { onClose(); navigate("/pricing"); }}
            >
              {t('upgrade.view_plans')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradePromptOverlay;
