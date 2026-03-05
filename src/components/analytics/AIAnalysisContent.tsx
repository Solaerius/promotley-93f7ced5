import { useState } from 'react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useAIProfile } from '@/hooks/useAIProfile';
import ModelTierSelector from '@/components/ai/ModelTierSelector';
import type { ModelTier } from '@/lib/modelTiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, Calendar, Target, Lightbulb, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const AIAnalysisContent = () => {
  const { latestAnalysis, history, loading, generating, generateAnalysis } = useAIAnalysis();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [modelTier, setModelTier] = useState<ModelTier>('standard');

  // Use selected analysis or latest
  const currentAnalysis = selectedAnalysisId 
    ? history.find(a => a.id === selectedAnalysisId) || latestAnalysis
    : latestAnalysis;

  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  
  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'hög': return 'destructive';
      case 'medel': return 'default';
      case 'låg': return 'secondary';
      default: return 'outline';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'tiktok': return 'bg-black';
      case 'facebook': return 'bg-blue-600';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate + History */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <ModelTierSelector value={modelTier} onChange={setModelTier} compact />
          <Button
            variant="gradient"
            onClick={async () => {
              try {
                await generateAnalysis(modelTier);
                setSelectedAnalysisId(null);
                setHasAccess(true);
                setAccessError(null);
              } catch (error: any) {
                if (error?.message?.includes('NO_ACTIVE_PLAN')) {
                  setHasAccess(false);
                  setAccessError('no_plan');
                } else if (error?.message?.includes('INSUFFICIENT_CREDITS')) {
                  setHasAccess(false);
                  setAccessError('no_credits');
                }
              }
            }}
            disabled={generating || !hasAccess || isAIBlocked}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {generating ? 'Genererar...' : isAIBlocked ? 'Fyll i AI-profil först' : 'Generera Analys'}
          </Button>

          {/* History Selector */}
          {history.length > 1 && (
            <Select
              value={selectedAnalysisId || 'latest'}
              onValueChange={(val) => setSelectedAnalysisId(val === 'latest' ? null : val)}
            >
              <SelectTrigger className="w-[200px] liquid-glass-light border-white/20">
                <History className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="Historik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Senaste analysen</SelectItem>
                {history.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {new Date(item.created_at).toLocaleDateString('sv-SE', { 
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {history.length > 0 && (
          <p className="text-xs dashboard-subheading-dark">
            {history.length} {history.length === 1 ? 'analys' : 'analyser'} sparade
          </p>
        )}
      </div>

      {/* Warnings */}
      {!hasAccess && accessError && (
        <Alert variant="destructive" className="liquid-glass-light border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {accessError === 'no_plan' && 'Du behöver ett aktivt paket för AI-analys'}
              {accessError === 'no_credits' && 'Dina krediter är slut'}
            </span>
            <Button variant="gradient" size="sm" onClick={() => window.location.href = '/pricing'}>
              Visa paket
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isAIBlocked && hasAccess && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-bold mb-1">AI-profil krävs!</p>
            <p>Fyll i minst 3 fält i din AI-profil under Konto → AI-profil.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* No Analysis State */}
      {!currentAnalysis ? (
        <Card className="liquid-glass-light">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 dashboard-heading-dark">Ingen analys genererad än</h3>
              <p className="dashboard-subheading-dark">
                Klicka på "Generera Analys" för att få din AI-drivna marknadsföringsplan
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <Target className="h-5 w-5 text-primary" />
                Sammanfattning
              </CardTitle>
              <CardDescription className="dashboard-subheading-dark">
                Genererad {new Date(currentAnalysis.created_at).toLocaleDateString('sv-SE')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={currentAnalysis.ai_output?.sammanfattning ?? ''} />
            </CardContent>
          </Card>

          {/* Social Media Analysis */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analys av Sociala Medier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={currentAnalysis.ai_output?.social_medier_analys ?? ''} />
            </CardContent>
          </Card>

          {/* 7-Day Plan */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <Calendar className="h-5 w-5 text-primary" />
                7-Dagars Handlingsplan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(currentAnalysis.ai_output?.["7_dagars_plan"] ?? []).map((item: any, index: number) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg dashboard-heading-dark">{item.dag}</h4>
                      <Badge className={getPlatformColor(item.plattform)}>{item.plattform}</Badge>
                    </div>
                    <p className="font-medium mb-1 dashboard-heading-dark">{item.aktivitet}</p>
                    <p className="text-sm dashboard-subheading-dark">{item.beskrivning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Suggestions */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <Lightbulb className="h-5 w-5 text-primary" />
                Content-Förslag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {(currentAnalysis.ai_output?.content_forslag ?? []).map((item: any, index: number) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold dashboard-heading-dark">{item.titel}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-white/30 dashboard-subheading-dark">{item.format}</Badge>
                        <Badge className={getPlatformColor(item.plattform)}>{item.plattform}</Badge>
                      </div>
                    </div>
                    <p className="text-sm dashboard-subheading-dark">{item.beskrivning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* UF Strategy */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <Target className="h-5 w-5 text-primary" />
                UF-Tävlingsstrategi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={currentAnalysis.ai_output?.uf_tavlingsstrategi ?? ''} />
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="liquid-glass-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dashboard-heading-dark">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Rekommendationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(currentAnalysis.ai_output?.rekommendationer ?? []).map((item: any, index: number) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityColor(item.prioritet)}>{item.prioritet}</Badge>
                      <Badge variant="outline" className="border-white/30 dashboard-subheading-dark">{item.kategori}</Badge>
                    </div>
                    <h4 className="font-semibold text-lg dashboard-heading-dark">{item.titel}</h4>
                    <p className="text-sm dashboard-subheading-dark mb-2">{item.beskrivning}</p>
                    <p className="text-xs dashboard-subheading-dark">
                      <strong>Deadline:</strong> {item.deadline}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AIAnalysisContent;
