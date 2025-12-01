import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Calendar } from "lucide-react";

interface CalendarErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

export const CalendarErrorState = ({ error, onRetry }: CalendarErrorStateProps) => {
  const getErrorMessage = (error: Error | null) => {
    if (!error) return "Ett oväntat fel uppstod";
    
    const message = error.message?.toLowerCase() || "";
    
    if (message.includes("unauthorized") || message.includes("jwt") || message.includes("401")) {
      return "Din session har gått ut. Logga in igen för att fortsätta.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Kunde inte ansluta till servern. Kontrollera din internetanslutning.";
    }
    if (message.includes("not_authenticated")) {
      return "Du måste vara inloggad för att se kalendern.";
    }
    
    return error.message || "Ett oväntat fel uppstod";
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Kunde inte ladda kalendern
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
