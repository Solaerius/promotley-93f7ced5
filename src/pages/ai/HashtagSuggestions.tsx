import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Copy, Check, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface HashtagGroup {
  label: string;
  hashtags: string[];
}

interface HashtagResult {
  groups?: HashtagGroup[];
  raw?: string;
}

const SYSTEM_PROMPT = `Du är en expert på hashtags för sociala medier. Svara ALLTID i JSON-format.
Gruppera hashtags efter räckvidd. Returnera 15-25 hashtags totalt.
Format: {"groups": [{"label": "Hög räckvidd", "hashtags": ["#tag1", "#tag2"]}, {"label": "Medel räckvidd", "hashtags": [...]}, {"label": "Nisch", "hashtags": [...]}]}`;

const HashtagSuggestions = () => {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState('instagram');
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { result, loading, error, generate } = useAIToolRequest<HashtagResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    if (!topic.trim()) return;
    generate(`Plattform: ${platform}. Ämne/beskrivning: ${topic}`);
  };

  const copyAll = () => {
    if (!result?.groups) return;
    const all = result.groups.flatMap(g => g.hashtags).join(' ');
    navigator.clipboard.writeText(all);
    setCopied(true);
    toast({ title: t('ai_tool.copied_title'), description: t('hashtag.copied_all') });
    setTimeout(() => setCopied(false), 2000);
  };

  const copySingle = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast({ title: t('ai_tool.copied_title'), description: t('hashtag.copied_single', { tag }) });
  };

  return (
    <AIToolPageLayout
      title={t('hashtag.title')}
      description={t('hashtag.description')}
      icon={Hash}
      gradient="from-blue-500 to-cyan-500"
    >
      {/* Loading progress bar */}
      {loading && (
        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      <Card className="liquid-glass-light">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium dashboard-heading-dark">{t('ai_tool.platform')}</label>
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
            <label className="text-sm font-medium dashboard-heading-dark">{t('hashtag.topic_label')}</label>
            <Textarea
              placeholder={t('hashtag.topic_placeholder')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
            />
          </div>
          <Button variant="gradient" className="w-full" onClick={handleGenerate} disabled={loading || !topic.trim()}>
            {loading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t('ai_tool.generating')}</> : <><Wand2 className="w-4 h-4 mr-2" /> {t('hashtag.generate_btn')}</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result?.groups && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold dashboard-heading-dark">{t('hashtag.results_heading')}</h2>
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copied ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
              {t('hashtag.copy_all_btn')}
            </Button>
          </div>
          {result.groups.map((group, i) => (
            <Card key={i} className="liquid-glass-light">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 dashboard-heading-dark">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.hashtags.map((tag, j) => (
                    <Badge
                      key={j}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors text-sm"
                      onClick={() => copySingle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default HashtagSuggestions;
