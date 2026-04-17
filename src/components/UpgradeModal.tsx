import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  requiredPlanName: string;
  currentPlanName: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  requiredPlanName,
  currentPlanName,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uppgradera för att låsa upp {featureName}</DialogTitle>
          <DialogDescription>
            Den här funktionen ingår från och med <strong>{requiredPlanName}</strong>-planen.
            Du har just nu <strong>{currentPlanName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Inte nu
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
          >
            Visa planer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
