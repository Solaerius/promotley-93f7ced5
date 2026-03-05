import { useState } from 'react';
import { FileText, Copy, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface CaptionResult {
  captions?: { text: string; tone: string }[];
  raw?: string;
}

const SYSTEM_PROMPT = `Du är en expert på sociala medier-captions. Svara ALLTID i JSON-format.
Skapa 3 olika captions baserat på användarens input. Variera stil och längd.
Format: {"captions": [{"text": "caption med radbrytningar", "tone": "tonens namn"}]}`;

const CaptionGenerator = () => {
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('proffsig');
  const [topic, setTopic] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { result, loading, error, generate } = useAIToolRequest<CaptionResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    if (!topic.trim()) return;
    generate(`Plattform: ${platform}. Ton: ${tone}. Ämne/beskrivning: ${topic}`);
  };

  const copyCaption = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: 'Kopierat!', description: 'Caption kopierad till urklipp.' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <AIToolPageLayout
      title="Caption-generator"
      description="Skapa engagerande captions för dina inlägg på sociala medier"
      icon={FileText}
      gradient="from-orange-500 to-red-500"
    >
      {/* Input */}
      <Card className="liquid-glass-light">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">Plattform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">Ton</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proffsig">Proffsig</SelectItem>
                  <SelectItem value="rolig">Rolig</SelectItem>
                  <SelectItem value="inspirerande">Inspirerande</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium dashboard-heading-dark">Vad handlar inlägget om?</label>
            <Textarea
              placeholder="T.ex. lansering av ny produkt, bakom kulisserna, kundrecension..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Genererar...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generera captions</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Results */}
      {result?.captions && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold dashboard-heading-dark">Förslag</h2>
          {result.captions.map((cap, i) => (
            <Card key={i} className="liquid-glass-light group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Badge variant="secondary" className="text-xs">{cap.tone}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCaption(cap.text, i)}
                    className="shrink-0"
                  >
                    {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="whitespace-pre-line text-sm dashboard-heading-dark">{cap.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result?.raw && !result.captions && (
        <Card className="liquid-glass-light">
          <CardContent className="p-4">
            <p className="whitespace-pre-line text-sm dashboard-heading-dark">{result.raw}</p>
          </CardContent>
        </Card>
      )}
    </AIToolPageLayout>
  );
};

export default CaptionGenerator;
