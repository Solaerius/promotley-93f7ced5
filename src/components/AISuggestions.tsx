import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/hooks/useAIProfile";
import { useNavigate } from "react-router-dom";
import { suggestionSchema } from "@/lib/validations";

interface Suggestion {
  idea: string;
  caption: string;
  hashtags: string[];
  best_time: string;
}

export const AISuggestions = () => {
  const [platform, setPlatform] = useState<string>("instagram");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const navigate = useNavigate();

  // Check if AI profile has enough fields filled (minimum 3)
  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  
  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const generateSuggestion = async () => {
    setLoading(true);
    setAccessError(null);
    try {
      // Validate platform selection
      const validation = suggestionSchema.safeParse({
        platform,
        brand: "user-brand", // Will be fetched from user profile in production
        keywords: "",
      });

      if (!validation.success) {
        toast({
          title: "Valideringsfel",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att använda AI-förslag",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const requestId = crypto.randomUUID();
      const response = await supabase.functions.invoke("generate-suggestion", {
        body: { platform, requestId },
      });

      if (response.error) {
        const errorData = response.data as any;
        
        if (errorData?.error === 'NO_ACTIVE_PLAN') {
          setHasAccess(false);
          setAccessError('no_plan');
          toast({
            title: "Uppgradera för AI-förslag",
            description: "Du behöver ett aktivt paket för att använda AI-funktioner",
            variant: "destructive",
          });
        } else if (errorData?.error === 'INSUFFICIENT_CREDITS') {
          setHasAccess(false);
          setAccessError('no_credits');
          toast({
            title: "Inga krediter kvar",
            description: `Du behöver ${errorData.credits_needed} krediter. Fyll på ditt konto eller uppgradera.`,
            variant: "destructive",
          });
        } else if (response.error.message?.includes("PAYWALL")) {
          setHasAccess(false);
          setAccessError('paywall');
          toast({
            title: "Uppgradera till Pro",
            description: "Du har använt ditt gratis förslag. Uppgradera för obegränsade AI-förslag!",
            variant: "destructive",
          });
        } else {
          throw response.error;
        }
        setLoading(false);
        return;
      }

      setSuggestion(response.data);
      toast({
        title: "Förslag genererat!",
        description: "Ditt AI-genererade innehållsförslag är klart",
      });
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte generera förslag. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = async () => {
    if (!suggestion) return;
    
    const fullText = `${suggestion.caption}\n\n${suggestion.hashtags.join(" ")}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    
    toast({
      title: "Kopierat!",
      description: "Caption och hashtags kopierade till urklipp",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Innehållsförslag
          </CardTitle>
          <CardDescription>
            Få personliga innehållsidéer baserade på din data och målgrupp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Profile Required Warning */}
          {isAIBlocked && (
            <Alert variant="destructive" className="border-2 border-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <p className="font-bold mb-1">AI-profil krävs</p>
                <p className="mb-2 text-sm">
                  Du måste fylla i minst 3 fält i din AI-profil (bransch, målgrupp, produktbeskrivning, målsättning) innan du kan använda AI-förslag.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Gå till Inställningar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!hasAccess && accessError && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-semibold mb-2">AI-förslag låsta</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {accessError === 'no_plan' && 'Du behöver ett aktivt paket för att använda AI-funktioner'}
                {accessError === 'no_credits' && 'Dina krediter är slut. Fyll på för att fortsätta'}
                {accessError === 'paywall' && 'Uppgradera ditt paket för fler AI-förslag'}
              </p>
              <Button variant="gradient" size="sm" onClick={() => navigate('/pricing')}>
                Visa paket
              </Button>
            </div>
          )}
          
          <div className="flex gap-4">
            <Select value={platform} onValueChange={setPlatform} disabled={!hasAccess || isAIBlocked}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Välj plattform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={generateSuggestion}
              disabled={loading || !hasAccess || isAIBlocked}
              className="gap-2"
              variant="gradient"
              aria-label="Generera AI-innehållsförslag"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Genererar..." : isAIBlocked ? "Fyll i AI-profil" : "Generera förslag"}
            </Button>
          </div>

          {/* Exempel på AI-genererat inlägg */}
          {!suggestion && (
            <div className="mt-6 space-y-3 p-6 rounded-lg border border-dashed border-primary/30 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">Exempel på AI-genererat inlägg</p>
              </div>
              <div className="space-y-2 opacity-75">
                <p className="text-sm font-medium">Idé: Behind-the-scenes av er produktutveckling</p>
                <p className="text-sm">Caption: "Från idé till verklighet! Här är hur vi skapar våra produkter..."</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#ufföretag</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#bakomkulisserna</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#startup</span>
                </div>
              </div>
            </div>
          )}

          {suggestion && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Idé
                  </h4>
                  <p className="text-foreground">{suggestion.idea}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Caption
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyCaption}
                      className="h-8 gap-2"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Kopierad!" : "Kopiera"}
                    </Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">
                    {suggestion.caption}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Hashtags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    Bästa posttid
                  </h4>
                  <p className="text-foreground">{suggestion.best_time}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
