import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Link as LinkIcon, RefreshCw, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TikTokIcon from "@/components/icons/TikTokIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import TwitterIcon from "@/components/icons/TwitterIcon";
import FacebookIcon from "@/components/icons/FacebookIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";

interface Connection {
  id: string;
  provider: string;
  username: string | null;
  connected_at: string;
}

export const ConnectionManager = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    if (connected) {
      toast({ title: "✓ Ansluten!", description: `${connected} har kopplats till ditt konto` });
      if (connected.toLowerCase() === 'tiktok') {
        setTimeout(() => {
          toast({ title: "ℹ️ Begränsad åtkomst", description: "För full statistikåtkomst krävs TikTok API-behörigheterna video.query och video.data.", duration: 8000 });
        }, 2000);
      }
      window.history.replaceState({}, '', window.location.pathname);
      loadConnections();
    }
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.from('connections').select('*').eq('user_id', session.user.id);
      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const connectInstagram = async () => {
    setConnectingProvider('meta_ig');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Inte inloggad", description: "Du måste vara inloggad", variant: "destructive" }); setConnectingProvider(null); return; }
      const { data, error } = await supabase.functions.invoke('init-meta-oauth', { headers: { Authorization: `Bearer ${session.access_token}` }, body: { provider: 'meta_ig' } });
      if (error || !data?.url) { toast({ title: "Säkerhetsfel", description: "Kunde inte initiera säker anslutning.", variant: "destructive" }); setConnectingProvider(null); return; }
      window.location.href = data.url;
    } catch { toast({ title: "Fel vid anslutning", description: "Kunde inte ansluta till Instagram", variant: "destructive" }); setConnectingProvider(null); }
  };

  const connectTikTok = async () => {
    setConnectingProvider('tiktok');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Inte inloggad", description: "Du måste vara inloggad", variant: "destructive" }); return; }
      if (isConnected('tiktok')) { toast({ title: "Redan ansluten", description: "TikTok är redan anslutet.", variant: "destructive" }); setConnectingProvider(null); return; }
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error || !data?.url) throw new Error('Could not initialize TikTok OAuth');
      window.location.href = data.url;
    } catch { toast({ title: "Fel vid anslutning", description: "Kunde inte ansluta till TikTok", variant: "destructive" }); setConnectingProvider(null); }
  };

  const disconnectProvider = async (provider: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (provider === 'meta_ig' || provider === 'meta_fb') {
        const { error } = await supabase.functions.invoke('disconnect-meta', { headers: { Authorization: `Bearer ${session.access_token}` }, body: { provider } });
        if (error) throw error;
      } else {
        const { data: deletedConnection, error: connectionError } = await supabase.from('connections').delete().eq('user_id', session.user.id).eq('provider', provider as any).select();
        if (connectionError) throw connectionError;
        if (!deletedConnection || deletedConnection.length === 0) throw new Error('No connection was deleted');
        const { error: tokenError } = await supabase.from('tokens').delete().eq('user_id', session.user.id).eq('provider', provider as any);
        if (tokenError) throw tokenError;
      }
      toast({ title: "✓ Frånkopplad", description: `${provider === 'meta_ig' ? 'Instagram' : provider === 'tiktok' ? 'TikTok' : provider} har kopplats från` });
      await loadConnections();
    } catch (error) {
      toast({ title: "Fel vid frånkoppling", description: error instanceof Error ? error.message : "Kunde inte koppla från kontot", variant: "destructive" });
    }
  };

  const reconnectTikTok = async () => {
    setConnectingProvider('tiktok');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Inte inloggad", variant: "destructive" }); setConnectingProvider(null); return; }
      await supabase.from('tokens').delete().eq('user_id', session.user.id).eq('provider', 'tiktok');
      toast({ title: "Återansluter...", description: "Godkänn behörigheterna på TikTok", duration: 3000 });
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error || !data?.url) throw new Error('Could not initialize TikTok OAuth');
      window.location.href = data.url;
    } catch { toast({ title: "Fel vid anslutning", description: "Kunde inte starta TikTok reconnect", variant: "destructive" }); setConnectingProvider(null); }
  };

  const isConnected = (provider: string) => connections.some(c => c.provider === provider);
  const getConnection = (provider: string) => connections.find(c => c.provider === provider);

  const comingSoonPlatforms = [
    { name: "Instagram", icon: Instagram, gradient: "from-purple-600 via-pink-500 to-orange-400" },
    { name: "LinkedIn", icon: LinkedInIcon, gradient: "from-blue-700 to-blue-500" },
    { name: "X (Twitter)", icon: TwitterIcon, gradient: "from-gray-900 to-gray-700" },
    { name: "Facebook", icon: FacebookIcon, gradient: "from-blue-600 to-blue-400" },
    { name: "YouTube", icon: YouTubeIcon, gradient: "from-red-600 to-red-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Anslutna konton
        </CardTitle>
        <CardDescription>
          Anslut dina sociala medier-konton för att få personliga AI-insikter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TikTok */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-black via-gray-800 to-cyan-500 flex items-center justify-center">
              <TikTokIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">TikTok</p>
              {isConnected('tiktok') ? (
                <p className="text-sm text-accent flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected as {getConnection('tiktok')?.username || 'Okänd'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Koppla ditt konto för personliga insikter</p>
              )}
            </div>
          </div>
          {isConnected('tiktok') ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <Button variant="outline" size="sm" onClick={reconnectTikTok} disabled={connectingProvider !== null}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {connectingProvider === 'tiktok' ? 'Kopplar...' : 'Återanslut'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => disconnectProvider('tiktok')} disabled={connectingProvider !== null}>
                Koppla från
              </Button>
            </div>
          ) : (
            <Button variant="gradient" size="sm" onClick={connectTikTok} disabled={connectingProvider !== null}>
              {connectingProvider === 'tiktok' ? "Kopplar..." : "Anslut konto"}
            </Button>
          )}
        </div>

        {/* Coming Soon Platforms */}
        {comingSoonPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.name} className="flex items-center justify-between p-4 border rounded-lg opacity-70">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.gradient} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">Koppla ditt konto för personliga insikter</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Kommer snart
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
