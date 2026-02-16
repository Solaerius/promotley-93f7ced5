import { useState, useEffect } from 'react';
import { useSalesRadar } from '@/hooks/useSalesRadar';
import { useSalesRadarWatches } from '@/hooks/useSalesRadarWatches';
import { useAIProfile } from '@/hooks/useAIProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Radar,
  Users,
  Handshake,
  CalendarDays,
  Share2,
  Hash,
  Film,
  MessageCircle,
  Star,
  Leaf,
  TrendingUp,
  AlertCircle,
  History,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Coins,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/trackEvent';

const SalesRadarContent = () => {
  const { latestResult, history, loading, generating, generateRadar } = useSalesRadar();
  const { isWatched, addWatch, removeWatch, watches } = useSalesRadarWatches();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const [hasAccess, setHasAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Track sales radar view once on mount
  useEffect(() => {
    trackEvent("sales_opportunities_viewed");
  }, []);

  const currentResult = selectedId
    ? history.find(r => r.id === selectedId) || latestResult
    : latestResult;

  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  
  const isAIProfileComplete = filledFields >= 3;
  const isBlocked = !isAIProfileComplete && !aiProfileLoading;

  const getLeadIcon = (typ: string) => {
    switch (typ) {
      case 'kund': return Users;
      case 'samarbete': return Handshake;
      case 'event': return CalendarDays;
      case 'kanal': return Share2;
      default: return Zap;
    }
  };

  const getTrendIcon = (typ: string) => {
    switch (typ) {
      case 'hashtag': return Hash;
      case 'format': return Film;
      case 'ämne': return MessageCircle;
      case 'event': return Star;
      case 'säsong': return Leaf;
      default: return TrendingUp;
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'hög': return 'destructive';
      case 'medel': return 'default';
      case 'låg': return 'secondary';
      default: return 'outline';
    }
  };

  const getAktualitetLabel = (a: string) => {
    switch (a) {
      case 'nu': return '🔴 Nu';
      case 'denna_vecka': return '🟡 Denna vecka';
      case 'denna_månad': return '🟢 Denna månad';
      default: return a;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="gradient"
            onClick={async () => {
              try {
                await generateRadar();
                setSelectedId(null);
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
            disabled={generating || !hasAccess || isBlocked}
            size="lg"
            className="gap-2"
          >
            <Radar className="h-5 w-5" />
            {generating ? 'Skannar...' : isBlocked ? 'Fyll i AI-profil först' : 'Skanna möjligheter'}
          </Button>

          {history.length > 1 && (
            <Select
              value={selectedId || 'latest'}
              onValueChange={(val) => setSelectedId(val === 'latest' ? null : val)}
            >
              <SelectTrigger className="w-[200px] liquid-glass-light border-white/20">
                <History className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="Historik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Senaste skanningen</SelectItem>
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
            {history.length} {history.length === 1 ? 'skanning' : 'skanningar'} sparade
          </p>
        )}
      </div>

      {/* Warnings */}
      {!hasAccess && accessError && (
        <Alert variant="destructive" className="liquid-glass-light border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {accessError === 'no_plan' && 'Du behöver ett aktivt paket för Säljradarn'}
              {accessError === 'no_credits' && 'Dina krediter är slut'}
            </span>
            <Button variant="gradient" size="sm" onClick={() => window.location.href = '/pricing'}>
              Visa paket
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isBlocked && hasAccess && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-bold mb-1">AI-profil krävs!</p>
            <p>Fyll i minst 3 fält i din AI-profil under Konto → AI-profil.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!currentResult ? (
        <Card className="liquid-glass-light">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Radar className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 dashboard-heading-dark">
                Ingen skanning gjord än
              </h3>
              <p className="dashboard-subheading-dark max-w-md mx-auto">
                Klicka på "Skanna möjligheter" för att hitta leads, trender och affärsmöjligheter anpassade för ditt företag
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          {currentResult.sammanfattning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="liquid-glass-light border-primary/20">
                <CardContent className="p-5">
                  <p className="dashboard-heading-dark text-sm leading-relaxed">
                    {currentResult.sammanfattning}
                  </p>
                  <p className="text-xs dashboard-subheading-dark mt-2">
                    Skanning {new Date(currentResult.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Leads */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dashboard-heading-dark flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads & Möjligheter
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {(currentResult.leads || []).map((lead: any, index: number) => {
                const Icon = getLeadIcon(lead.typ);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="liquid-glass-light hover:shadow-elegant transition-all h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold dashboard-heading-dark">{lead.titel}</h4>
                              <Badge variant={getPriorityColor(lead.prioritet)} className="text-[10px]">
                                {lead.prioritet}
                              </Badge>
                            </div>
                            <p className="text-sm dashboard-subheading-dark mb-2">{lead.beskrivning}</p>
                            {lead.plats && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <MapPin className="w-3 h-3" />
                                {lead.plats}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              <ArrowRight className="w-3 h-3" />
                              {lead.action}
                            </div>
                            {lead.potential && (
                              <p className="text-xs dashboard-subheading-dark mt-1 italic">
                                Potential: {lead.potential}
                              </p>
                            )}
                            <div className="mt-2 flex justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={isWatched(currentResult.id, 'lead', index) ? 'secondary' : 'outline'}
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => {
                                        if (isWatched(currentResult.id, 'lead', index)) {
                                          const w = watches.find(w => w.result_id === currentResult.id && w.item_type === 'lead' && w.item_index === index);
                                          if (w) removeWatch(w.id);
                                        } else {
                                          addWatch(currentResult.id, 'lead', index, lead.titel);
                                        }
                                      }}
                                    >
                                      {isWatched(currentResult.id, 'lead', index) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      {isWatched(currentResult.id, 'lead', index) ? 'Bevakas' : 'Bevaka'}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isWatched(currentResult.id, 'lead', index) ? 'Klicka för att ta bort bevakning' : 'Bevaka denna möjlighet (1 kredit)'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Trends */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dashboard-heading-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trender & Aktuellt
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {(currentResult.trends || []).map((trend: any, index: number) => {
                const Icon = getTrendIcon(trend.typ);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="liquid-glass-light hover:shadow-elegant transition-all h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 dashboard-heading-dark" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold dashboard-heading-dark">{trend.titel}</h4>
                              <Badge variant="outline" className="text-[10px] border-white/30 dashboard-subheading-dark">
                                {trend.plattform}
                              </Badge>
                            </div>
                            <p className="text-sm dashboard-subheading-dark mb-2">{trend.beskrivning}</p>
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              <ArrowRight className="w-3 h-3" />
                              {trend.tips}
                            </div>
                            <p className="text-[10px] dashboard-subheading-dark mt-1">
                              {getAktualitetLabel(trend.aktualitet)}
                            </p>
                            <div className="mt-2 flex justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={isWatched(currentResult.id, 'trend', index) ? 'secondary' : 'outline'}
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => {
                                        if (isWatched(currentResult.id, 'trend', index)) {
                                          const w = watches.find(w => w.result_id === currentResult.id && w.item_type === 'trend' && w.item_index === index);
                                          if (w) removeWatch(w.id);
                                        } else {
                                          addWatch(currentResult.id, 'trend', index, trend.titel);
                                        }
                                      }}
                                    >
                                      {isWatched(currentResult.id, 'trend', index) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      {isWatched(currentResult.id, 'trend', index) ? 'Bevakas' : 'Bevaka'}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isWatched(currentResult.id, 'trend', index) ? 'Klicka för att ta bort bevakning' : 'Bevaka denna trend (1 kredit)'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesRadarContent;
