import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Wand2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIToolRequest } from '@/hooks/useAIToolRequest';
import AIToolPageLayout from '@/components/ai/AIToolPageLayout';

interface Tip {
  title: string;
  summary: string;
  actions: string[];
}

interface UFTipsResult {
  tips?: Tip[];
  raw?: string;
}

const SYSTEM_PROMPT = `Du är en UF-expert och mentor. Svara ALLTID i JSON-format.
Ge konkreta, praktiska tips med tydliga åtgärder. Varje tips ska ha 2-4 steg.
Format: {"tips": [{"title": "Tipsets titel", "summary": "Kort sammanfattning", "actions": ["Konkret steg 1", "Konkret steg 2"]}]}
Ge 4-6 tips.`;

const UFTips = () => {
  const { t } = useTranslation();
  const CATEGORIES = [
    { value: 'tavling', label: t('uf_tips.cat_competition') },
    { value: 'monter', label: t('uf_tips.cat_fair') },
    { value: 'pitch', label: t('uf_tips.cat_pitch') },
    { value: 'sociala_medier', label: t('uf_tips.cat_social') },
    { value: 'forsaljning', label: t('uf_tips.cat_sales') },
    { value: 'bokforing', label: t('uf_tips.cat_accounting') },
  ];
  const [category, setCategory] = useState('tavling');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { result, loading, error, generate } = useAIToolRequest<UFTipsResult>({ toolSystemPrompt: SYSTEM_PROMPT });

  const handleGenerate = () => {
    const cat = CATEGORIES.find(c => c.value === category)?.label || category;
    generate(`Ge tips för UF-företag inom kategorin: ${cat}. Fokusera på praktiska och konkreta råd som hjälper UF-företagare att lyckas.`);
  };

  return (
    <AIToolPageLayout
      title={t('uf_tips.title')}
      description={t('uf_tips.description')}
      icon={Lightbulb}
      gradient="from-indigo-500 to-purple-500"
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
            <label className="text-sm font-medium dashboard-heading-dark">{t('uf_tips.category_label')}</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="gradient" className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Wand2 className="w-4 h-4 mr-2 animate-spin" /> {t('ai_tool.generating')}</> : <><Wand2 className="w-4 h-4 mr-2" /> {t('uf_tips.generate_btn')}</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result?.tips && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold dashboard-heading-dark">{t('uf_tips.results_heading')}</h2>
          {result.tips.map((tip, i) => (
            <Collapsible key={i} open={openIndex === i} onOpenChange={(open) => setOpenIndex(open ? i : null)}>
              <Card className="liquid-glass-light">
                <CollapsibleTrigger className="w-full text-left">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm dashboard-heading-dark">{tip.title}</h3>
                        <p className="text-xs dashboard-subheading-dark">{tip.summary}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform text-muted-foreground ${openIndex === i ? 'rotate-180' : ''}`} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-border/50 pt-3 space-y-2">
                      {tip.actions.map((action, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm dashboard-subheading-dark">
                          <span className="text-primary font-bold mt-0.5">→</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </AIToolPageLayout>
  );
};

export default UFTips;
