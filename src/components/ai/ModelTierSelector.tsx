import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODEL_TIERS, TIER_ORDER, type ModelTier } from '@/lib/modelTiers';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserCredits } from '@/hooks/useUserCredits';
import UpgradePromptOverlay from '@/components/UpgradePromptOverlay';
import { motion } from 'framer-motion';

interface ModelTierSelectorProps {
  value: ModelTier;
  onChange: (tier: ModelTier) => void;
  compact?: boolean;
}

const ModelTierSelector = ({ value, onChange, compact = false }: ModelTierSelectorProps) => {
  const { t } = useTranslation();
  const { credits } = useUserCredits();
  const isFreePlan = credits?.plan === 'free_trial';
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleSelect = (tierId: ModelTier) => {
    if (isFreePlan && tierId !== 'fast') {
      setShowUpgrade(true);
      return;
    }
    onChange(tierId);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "relative flex rounded-xl border border-border/50 bg-muted/30 p-0.5",
        compact ? "gap-0" : "gap-0.5"
      )}>
        {/* Glass bubble indicator */}
        {TIER_ORDER.map((tierId, index) => {
          if (tierId !== value) return null;
          return (
            <motion.div
              key="glass-bubble"
              className="absolute top-0.5 bottom-0.5 rounded-lg bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              layoutId="model-tier-bubble"
              style={{
                width: `calc(${100 / TIER_ORDER.length}% - 2px)`,
                left: `calc(${(index * 100) / TIER_ORDER.length}% + 1px)`,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          );
        })}

        {TIER_ORDER.map((tierId) => {
          const tier = MODEL_TIERS[tierId];
          const isActive = value === tierId;
          const isLocked = isFreePlan && tierId !== 'fast';
          return (
            <Tooltip key={tierId}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleSelect(tierId)}
                  className={cn(
                    "relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "text-primary shadow-sm"
                      : isLocked
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tier.icon className="w-3.5 h-3.5" />
                  {!compact && <span>{tier.label}</span>}
                  {compact && <span className="hidden sm:inline">{tier.label}</span>}
                  {isLocked && <span className="text-[9px]">🔒</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                <p className="font-medium">{tier.label}</p>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tier.creditMultiplier}{t('common.credit_cost')}
                </p>
                {isLocked && (
                  <p className="text-xs text-primary mt-1">{t('common.upgrade_unlock')}</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <UpgradePromptOverlay
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={t('common.standard_premium_models')}
      />
    </TooltipProvider>
  );
};

export default ModelTierSelector;
