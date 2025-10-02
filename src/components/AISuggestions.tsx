import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  idea: string;
  caption: string;
  hashtags: string[];
  best_time: string;
}

export const AISuggestions = () => {
  const [platform, setPlatform] = useState<string>("Instagram");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateSuggestion = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att använda AI-förslag",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("generate-suggestion", {
        body: { platform },
      });

      if (response.error) {
        if (response.error.message?.includes("PAYWALL")) {
          toast({
            title: "Uppgradera till Pro",
            description: "Du har använt ditt gratis förslag. Uppgradera för obegränsade AI-förslag!",
            variant: "destructive",
          });
        } else {
          throw response.error;
        }
        return;
      }

      setSuggestion(response.data);
      toast({
        title: "✨ Förslag genererat!",
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
          <div className="flex gap-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Välj plattform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={generateSuggestion}
              disabled={loading}
              className="gap-2"
              variant="gradient"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Genererar..." : "Generera förslag"}
            </Button>
          </div>

          {suggestion && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    💡 Idé
                  </h4>
                  <p className="text-foreground">{suggestion.idea}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      📝 Caption
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
                    🏷️ Hashtags
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
                    ⏰ Bästa posttid
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
