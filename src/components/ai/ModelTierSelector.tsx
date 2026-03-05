import { MODEL_TIERS, TIER_ORDER, type ModelTier } from '@/lib/modelTiers';
import { cn } from '@/lib/utils';

interface ModelTierSelectorProps {
  value: ModelTier;
  onChange: (tier: ModelTier) => void;
  compact?: boolean;
}

const ModelTierSelector = ({ value, onChange, compact = false }: ModelTierSelectorProps) => {
  return (
    <div className={cn(
      "flex rounded-xl border border-border/50 bg-muted/30 p-0.5",
      compact ? "gap-0" : "gap-0.5"
    )}>
      {TIER_ORDER.map((tierId) => {
        const tier = MODEL_TIERS[tierId];
        const isActive = value === tierId;
        return (
          <button
            key={tierId}
            type="button"
            onClick={() => onChange(tierId)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title={tier.description}
          >
            <span>{tier.emoji}</span>
            {!compact && <span>{tier.label}</span>}
            {compact && <span className="hidden sm:inline">{tier.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ModelTierSelector;
