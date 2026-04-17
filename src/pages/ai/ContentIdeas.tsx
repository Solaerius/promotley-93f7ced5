import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Wand2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';
import { ComingSoonBadge } from '@/components/ComingSoonBadge';

interface ContentIdea {
  title: string;
  description: string;
  format: string;
  platform: string;
  max_length?: string;
  hooks?: string[];
  day?: string;
}

interface ContentIdeasResult {
  ideas?: ContentIdea[];
  raw?: string;
}

const SYSTEM_PROMPT = `Du är en kreativ content-strateg för svenska UF-företag. Svara ALLTID i JSON.

Generera korta, konkreta content-idéer. Varje idé MÅSTE innehålla:
- title: Catchy titel (max 50 tecken)
- description: Vad inlägget handlar om (1-2 meningar, max 150 tecken)
- format: "Reel" | "Story" | "Carousel" | "Post"
- platform: "instagram" | "tiktok" | "facebook"
- max_length: Rekommenderad längd ("15-30 sek" för Reel, "5-10 bilder" för Carousel, etc)
- hooks: Array med 2-3 första-meningar som fångar uppmärksamhet (max 80 tecken vardera)

Skriv på enkel, naturlig svenska. Undvik jargong. Inga emojis i hooks (ser AI-genererat ut).

Format: {"ideas":[{"title":"...","description":"...","format":"Reel","platform":"tiktok","max_length":"15-30 sek","hooks":["...","...","..."]}]}`;

const ContentIdeas = () => {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState('alla');
  const [count, setCount] = useState('5');
  const [openHooks, setOpenHooks] = useState<Record<number, boolean>>({});
  const { result, loading, error, generate } = useAIToolRequest<ContentIdeasResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    generate(`Plattform: ${platform === 'alla' ? 'Instagram, TikTok och Facebook' : platform}. Antal idéer: ${count}. Ge konkreta och kreativa idéer för UF-företag med tydliga hooks.`);
  };

  return (
    <AIToolPageLayout
      title={t('content_ideas.title')}
      description={t('content_ideas.description')}
      icon={Image}
      gradient="from-purple-500 to-pink-500"
    >
      {loading && (
        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      <Card className="liquid-glass-light">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">{t('ai_tool.platform')}</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alla">{t('ai_tool.all_platforms')}</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">{t('content_ideas.count_label')}</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t('content_ideas.count_3')}</SelectItem>
                  <SelectItem value="5">{t('content_ideas.count_5')}</SelectItem>
                  <SelectItem value="7">{t('content_ideas.count_7')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="gradient" className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t('ai_tool.generating')}</> : <><Wand2 className="w-4 h-4 mr-2" /> {t('content_ideas.generate_btn')}</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result?.ideas && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold dashboard-heading-dark">{t('content_ideas.results_heading')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.ideas.map((idea, i) => (
              <Card key={i} className="liquid-glass-light hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm dashboard-heading-dark">{idea.title}</h3>
                    <p className="text-sm dashboard-subheading-dark mt-1">{idea.description}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{idea.format}</Badge>
                    {idea.platform && <Badge variant="secondary" className="text-xs capitalize">{idea.platform}</Badge>}
                    {idea.max_length && <Badge variant="secondary" className="text-xs">{idea.max_length}</Badge>}
                    {idea.day && <Badge variant="secondary" className="text-xs">{idea.day}</Badge>}
                  </div>

                  {idea.hooks && idea.hooks.length > 0 && (
                    <Collapsible
                      open={openHooks[i]}
                      onOpenChange={(o) => setOpenHooks(prev => ({ ...prev, [i]: o }))}
                    >
                      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                        <ChevronDown className={`w-3 h-3 transition-transform ${openHooks[i] ? 'rotate-180' : ''}`} />
                        {t('content_ideas.show_hooks', { count: idea.hooks.length })}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-1.5">
                        {idea.hooks.map((hook, hi) => (
                          <div key={hi} className="text-xs p-2 rounded bg-muted/50 border border-border/50 dashboard-subheading-dark">
                            "{hook}"
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coming soon section */}
          <Card className="liquid-glass-light opacity-70">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold dashboard-heading-dark">{t('content_ideas.coming_soon_heading')}</h3>
                <ComingSoonBadge />
              </div>
              <ul className="text-xs dashboard-subheading-dark space-y-1 pl-4 list-disc">
                <li>{t('content_ideas.cs_trends')}</li>
                <li>{t('content_ideas.cs_sounds')}</li>
                <li>{t('content_ideas.cs_viral_links')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default ContentIdeas;
