import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CalendarErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

export const CalendarErrorState = ({ error, onRetry }: CalendarErrorStateProps) => {
  const { t } = useTranslation();

  const getErrorMessage = (error: Error | null) => {
    if (!error) return t('calendar_error.generic');

    const message = error.message?.toLowerCase() || "";

    if (message.includes("unauthorized") || message.includes("jwt") || message.includes("401")) {
      return t('calendar_error.session_expired');
    }
    if (message.includes("network") || message.includes("fetch")) {
      return t('calendar.error_connect');
    }
    if (message.includes("not_authenticated")) {
      return t('calendar_error.auth_required');
    }

    return error.message || t('calendar_error.generic');
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t('calendar.error_load')}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {getErrorMessage(error)}
        </p>
        <div className="flex gap-3">
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Försök igen
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} variant="ghost">
            <Calendar className="w-4 h-4 mr-2" />
            Till dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarErrorState;
