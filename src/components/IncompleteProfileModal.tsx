import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface IncompleteProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields?: string[];
}

export const IncompleteProfileModal = ({
  open,
  onOpenChange,
  missingFields = [],
}: IncompleteProfileModalProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-xl">
              Företagsinformation saknas
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base leading-relaxed">
            Du måste fylla i all obligatorisk företagsinformation innan du kan använda AI-funktionerna.
            {missingFields.length > 0 && (
              <span className="block mt-3">
                <span className="font-medium text-foreground">Saknade fält:</span>
                <span className="block mt-1 text-sm">
                  {missingFields.join(", ")}
                </span>
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>Stäng</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              navigate("/onboarding");
            }}
          >
            Fyll i information
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
