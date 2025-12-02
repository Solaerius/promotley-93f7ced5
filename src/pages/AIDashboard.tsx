import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useAIProfile } from '@/hooks/useAIProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, TrendingUp, Calendar, Target, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const AIDashboard = () => {
  const { latestAnalysis, loading, generating, generateAnalysis } = useAIAnalysis();
  const { profile: aiProfile } = useAIProfile();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'hög':
        return 'destructive';
      case 'medel':
        return 'default';
      case 'låg':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'tiktok':
        return 'bg-black';
      case 'facebook':
        return 'bg-blue-600';
      default:
        return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI-Analys & Rekommendationer
            </h1>
            <p className="text-muted-foreground mt-1">
              Din skräddarsydda marknadsföringsplan baserad på UF-regler
            </p>
          </div>
          <Button
            onClick={async () => {
              try {
                await generateAnalysis();
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
            disabled={generating || !hasAccess || !aiProfile}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {generating ? 'Genererar...' : !aiProfile ? 'Fyll i AI-profil först' : 'Generera Ny Analys'}
          </Button>
        </div>

        {/* Access blocked warning */}
        {!hasAccess && accessError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {accessError === 'no_plan' && 'Du behöver ett aktivt paket för att använda AI-analys'}
                {accessError === 'no_credits' && 'Dina krediter är slut. Fyll på för att fortsätta'}
              </span>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/pricing'}>
                Visa paket
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Varning om profil saknas - LARGER */}
        {!aiProfile && hasAccess && (
          <Alert variant="destructive" className="border-2 border-destructive">
            <AlertCircle className="h-5 w-5" />
            <div className="ml-2">
              <p className="font-bold text-lg mb-1">AI-profil krävs!</p>
              <p className="mb-3">
                Du måste fylla i din AI-profil i Inställningar innan du kan generera analyser. 
                AI:n behöver information om ditt företag för att ge relevanta rekommendationer.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/settings'}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Gå till Inställningar
              </Button>
            </div>
          </Alert>
        )}

        {!latestAnalysis ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ingen analys genererad än</h3>
                <p className="text-muted-foreground mb-6">
                  Klicka på "Generera Ny Analys" för att få din första AI-driven marknadsföringsplan
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Sammanfattning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Sammanfattning
                </CardTitle>
                <CardDescription>
                  Genererad {new Date(latestAnalysis.created_at).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={latestAnalysis.ai_output?.sammanfattning ?? ''} />
              </CardContent>
            </Card>

            {/* Social Medier Analys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Analys av Sociala Medier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={latestAnalysis.ai_output?.social_medier_analys ?? ''} />
              </CardContent>
            </Card>

            {/* 7-dagarsplan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  7-Dagars Handlingsplan
                </CardTitle>
                <CardDescription>Konkreta aktiviteter för varje dag</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                  {(latestAnalysis.ai_output?.["7_dagars_plan"] ?? []).map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{item.dag}</h4>
                        <Badge className={getPlatformColor(item.plattform)}>
                          {item.plattform}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{item.aktivitet}</p>
                      <p className="text-sm text-muted-foreground">{item.beskrivning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content-förslag */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Content-Förslag
                </CardTitle>
                <CardDescription>Idéer för ditt sociala medier-innehåll</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {(latestAnalysis.ai_output?.content_forslag ?? []).map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.titel}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">{item.format}</Badge>
                          <Badge className={getPlatformColor(item.plattform)}>
                            {item.plattform}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.beskrivning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* UF-Tävlingsstrategi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  UF-Tävlingsstrategi
                </CardTitle>
                <CardDescription>Vägen till framgång i UF-tävlingarna</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={latestAnalysis.ai_output?.uf_tavlingsstrategi ?? ''} />
              </CardContent>
            </Card>

            {/* Rekommendationer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Rekommendationer & Action Items
                </CardTitle>
                <CardDescription>Prioriterade åtgärder för din tillväxt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(latestAnalysis.ai_output?.rekommendationer ?? []).map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPriorityColor(item.prioritet)}>
                              {item.prioritet}
                            </Badge>
                            <Badge variant="outline">{item.kategori}</Badge>
                          </div>
                          <h4 className="font-semibold text-lg">{item.titel}</h4>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.beskrivning}</p>
                      <p className="text-xs text-muted-foreground">
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
    </DashboardLayout>
  );
};

export default AIDashboard;