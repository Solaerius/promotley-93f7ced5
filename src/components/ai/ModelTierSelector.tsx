import { MODEL_TIERS, TIER_ORDER, type ModelTier } from '@/lib/modelTiers';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelTierSelectorProps {
  value: ModelTier;
  onChange: (tier: ModelTier) => void;
  compact?: boolean;
}

const ModelTierSelector = ({ value, onChange, compact = false }: ModelTierSelectorProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex rounded-xl border border-border/50 bg-muted/30 p-0.5",
        compact ? "gap-0" : "gap-0.5"
      )}>
        {TIER_ORDER.map((tierId) => {
          const tier = MODEL_TIERS[tierId];
          const isActive = value === tierId;
          return (
            <Tooltip key={tierId}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(tierId)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tier.icon className="w-3.5 h-3.5" />
                  {!compact && <span>{tier.label}</span>}
                  {compact && <span className="hidden sm:inline">{tier.label}</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                <p className="font-medium">{tier.label}</p>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tier.creditMultiplier}x kreditkostnad
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ModelTierSelector;
