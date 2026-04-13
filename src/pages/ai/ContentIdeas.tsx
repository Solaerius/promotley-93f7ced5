import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Wand2, Film, Camera, Layout, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface ContentIdea {
  title: string;
  description: string;
  format: string;
  platform: string;
  day?: string;
}

interface ContentIdeasResult {
  ideas?: ContentIdea[];
  raw?: string;
}

const formatIcons: Record<string, any> = {
  reel: Film,
  reels: Film,
  video: Film,
  story: Camera,
  stories: Camera,
  carousel: Layout,
  post: Image,
  bild: Image,
  text: MessageSquare,
};

const SYSTEM_PROMPT = `Du är en kreativ content-strateg. Svara ALLTID i JSON-format.
Generera content-idéer med varierade format (Reel, Story, Carousel, Post). Varje idé ska vara konkret och genomförbar.
Format: {"ideas": [{"title": "Kort catchy titel", "description": "Detaljerad beskrivning av innehållet", "format": "Reel/Story/Carousel/Post", "platform": "instagram/tiktok/facebook", "day": "Måndag"}]}`;

const ContentIdeas = () => {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState('alla');
  const [count, setCount] = useState('5');
  const { result, loading, error, generate } = useAIToolRequest<ContentIdeasResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    generate(`Plattform: ${platform === 'alla' ? 'Instagram, TikTok och Facebook' : platform}. Antal idéer: ${count}. Ge konkreta och kreativa idéer för UF-företag.`);
  };

  const getFormatIcon = (format: string) => {
    const key = format.toLowerCase();
    const Icon = formatIcons[key] || Image;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <AIToolPageLayout
      title={t('content_ideas.title')}
      description={t('content_ideas.description')}
      icon={Image}
      gradient="from-purple-500 to-pink-500"
    >
      {/* Loading progress bar */}
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
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getFormatIcon(idea.format)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm dashboard-heading-dark truncate">{idea.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm dashboard-subheading-dark">{idea.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{idea.format}</Badge>
                    {idea.platform && <Badge variant="secondary" className="text-xs capitalize">{idea.platform}</Badge>}
                    {idea.day && <Badge variant="secondary" className="text-xs">{idea.day}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default ContentIdeas;
