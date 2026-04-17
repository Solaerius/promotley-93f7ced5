import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface Step {
  title: string;
  description: string;
  deadline: string;
  actions: string[];
}

interface CampaignResult {
  steps?: Step[];
  summary?: string;
  raw?: string;
}

const SYSTEM_PROMPT = `Du är en kampanjstrateg för UF-företag och startups. Svara ALLTID i JSON-format.
Skapa en steg-för-steg-kampanjplan med tydliga deadlines och åtgärder.
Format: {"summary": "Kort sammanfattning av strategin", "steps": [{"title": "Steg-titel", "description": "Beskrivning", "deadline": "Dag 1-3", "actions": ["Konkret åtgärd 1", "Konkret åtgärd 2"]}]}
Skapa 4-6 steg.`;

const CampaignStrategy = () => {
  const { t } = useTranslation();
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [timeframe, setTimeframe] = useState('2_weeks');
  const { result, loading, error, generate } = useAIToolRequest<CampaignResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    if (!goal.trim()) return;
    const timeLabel = timeframe === '1_week' ? '1 vecka' : timeframe === '2_weeks' ? '2 veckor' : '4 veckor';
    generate(`Mål: ${goal}. Tidsperiod: ${timeLabel}. ${budget ? `Budget: ${budget} kr.` : 'Ingen specifik budget.'}`);
  };

  return (
    <AIToolPageLayout
      title={t('campaign.title')}
      description={t('campaign.description')}
      icon={Target}
      gradient="from-amber-500 to-orange-500"
      requiredFeature="marketing_plans"
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
            <label className="text-sm font-medium dashboard-heading-dark">{t('campaign.goal_label')}</label>
            <Textarea
              placeholder={t('campaign.goal_placeholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">{t('campaign.timeframe_label')}</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_week">{t('campaign.timeframe_1w')}</SelectItem>
                  <SelectItem value="2_weeks">{t('campaign.timeframe_2w')}</SelectItem>
                  <SelectItem value="4_weeks">{t('campaign.timeframe_4w')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium dashboard-heading-dark">{t('campaign.budget_label')}</label>
              <Input placeholder={t('campaign.budget_placeholder')} value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>
          <Button variant="gradient" className="w-full" onClick={handleGenerate} disabled={loading || !goal.trim()}>
            {loading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t('ai_tool.generating')}</> : <><Wand2 className="w-4 h-4 mr-2" /> {t('campaign.generate_btn')}</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result?.steps && (
        <div className="space-y-4">
          {result.summary && (
            <Card className="liquid-glass-light border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm dashboard-heading-dark">{result.summary}</p>
              </CardContent>
            </Card>
          )}
          <h2 className="text-lg font-semibold dashboard-heading-dark">{t('campaign.results_heading')}</h2>
          {/* Timeline */}
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-primary/30" />
            {result.steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[14px] top-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <Card className="liquid-glass-light">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm dashboard-heading-dark">{step.title}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">{step.deadline}</Badge>
                    </div>
                    <p className="text-sm dashboard-subheading-dark">{step.description}</p>
                    {step.actions?.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {step.actions.map((action, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs dashboard-subheading-dark">
                            <span className="text-primary mt-0.5">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default CampaignStrategy;
