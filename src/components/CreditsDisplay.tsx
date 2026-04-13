import { useTranslation } from 'react-i18next';
import { Coins, Wand2 } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  variant?: 'compact' | 'full';
  showUpgrade?: boolean;
}

const CreditsDisplay = ({ variant = 'compact', showUpgrade = true }: CreditsDisplayProps) => {
  const { t } = useTranslation();
  const { credits, loading, getPlanLabel } = useUserCredits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
        <Coins className="w-4 h-4" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    );
  }

  if (!credits) return null;

  const percentage = credits.max_credits > 0 
    ? (credits.credits_left / credits.max_credits) * 100 
    : 0;

  const barColor = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-destructive';
  const isLow = credits.credits_left <= 5;

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        isLow ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}>
        <Wand2 className="w-4 h-4" />
        <span>{credits.credits_left} {t('common.credits')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isLow ? 'bg-destructive/10' : 'bg-primary/10'
          )}>
            <Coins className={cn("w-4 h-4", isLow ? 'text-destructive' : 'text-primary')} />
          </div>
          <div>
            <p className="font-medium text-sm">{t('common.ai_credits')}</p>
            <p className="text-xs text-muted-foreground">
              {credits.plan === 'free_trial' ? t('common.free') : getPlanLabel(credits.plan)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-bold", isLow && 'text-destructive')}>
            {credits.credits_left}
          </p>
          <p className="text-xs text-muted-foreground">{t('common.of')} {credits.max_credits}</p>
        </div>
      </div>

      {/* Color-coded progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full transition-all rounded-full", barColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isLow && showUpgrade && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/pricing')}
        >
          {t('common.upgrade_for_credits')}
        </Button>
      )}

      {credits.plan === 'free_trial' && (
        <p className="text-xs text-muted-foreground text-center">
          {t('common.free_plan')} – <button onClick={() => navigate('/pricing')} className="text-primary hover:underline font-medium">{t('common.upgrade_for_more')}</button>
        </p>
      )}
    </div>
  );
};

export default CreditsDisplay;
