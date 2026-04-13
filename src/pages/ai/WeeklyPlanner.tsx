import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Wand2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface DayPlan {
  day: string;
  type: string;
  time: string;
  title: string;
  description: string;
  platform: string;
}

interface WeeklyPlanResult {
  days?: DayPlan[];
  raw?: string;
}

const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

const SYSTEM_PROMPT = `Du är en social media-planerare. Svara ALLTID i JSON-format.
Skapa en veckoplan med ett inlägg per dag. Variera format och plattform.
Format: {"days": [{"day": "Måndag", "type": "Reel", "time": "18:00", "title": "Catchy titel", "description": "Kort beskrivning", "platform": "instagram"}]}
Skapa exakt 7 poster, en för varje dag måndag till söndag.`;

const WeeklyPlanner = () => {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'tiktok']);
  const { result, loading, error, generate } = useAIToolRequest<WeeklyPlanResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleGenerate = () => {
    generate(`Plattformar att använda: ${platforms.join(', ')}. Skapa en veckoplan för ett UF-företag.`);
  };

  const platformColor = (p: string) => {
    if (p.includes('instagram')) return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
    if (p.includes('tiktok')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    if (p.includes('facebook')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <AIToolPageLayout
      title={t('weekly.title')}
      description={t('weekly.description')}
      icon={Calendar}
      gradient="from-green-500 to-emerald-500"
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
            <label className="text-sm font-medium dashboard-heading-dark">{t('weekly.platforms_label')}</label>
            <div className="flex gap-4">
              {['instagram', 'tiktok', 'facebook'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={platforms.includes(p)} onCheckedChange={() => togglePlatform(p)} />
                  <span className="text-sm capitalize dashboard-heading-dark">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <Button variant="gradient" className="w-full" onClick={handleGenerate} disabled={loading || platforms.length === 0}>
            {loading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t('ai_tool.generating')}</> : <><Wand2 className="w-4 h-4 mr-2" /> {t('weekly.generate_btn')}</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result?.days && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold dashboard-heading-dark">{t('weekly.results_heading')}</h2>
          <div className="grid grid-cols-1 gap-2">
            {DAYS.map(dayName => {
              const plan = result.days?.find(d => d.day.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3)));
              if (!plan) return null;
              return (
                <Card key={dayName} className="liquid-glass-light">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-20 shrink-0">
                      <p className="font-bold text-sm dashboard-heading-dark">{plan.day}</p>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{plan.time}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm dashboard-heading-dark">{plan.title}</p>
                      <p className="text-xs dashboard-subheading-dark mt-0.5">{plan.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{plan.type}</Badge>
                        <Badge className={`text-xs ${platformColor(plan.platform)}`}>{plan.platform}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default WeeklyPlanner;
