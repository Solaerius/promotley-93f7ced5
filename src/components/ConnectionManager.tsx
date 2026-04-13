import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Link as LinkIcon, RefreshCw, Instagram, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TikTokIcon from "@/components/icons/TikTokIcon";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import TwitterIcon from "@/components/icons/TwitterIcon";
import FacebookIcon from "@/components/icons/FacebookIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => {
    loadConnections();
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    if (connected) {
      toast({ title: t('connections.connected_title'), description: t('connections.connected_desc', { platform: connected }) });
      if (connected.toLowerCase() === 'tiktok') {
        setTimeout(() => {
          toast({ title: `ℹ️ ${t('connections.limited_access')}`, description: t('connections.limited_access_desc'), duration: 8000 });
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

  const connectTikTok = async () => {
    setConnectingProvider('tiktok');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: t('connections.not_logged_in'), variant: "destructive" }); return; }
      if (isConnected('tiktok')) { toast({ title: t('connections.already_connected'), variant: "destructive" }); setConnectingProvider(null); return; }
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error || !data?.url) throw new Error('Could not initialize TikTok OAuth');
      window.location.href = data.url;
    } catch { toast({ title: t('connections.connect_error'), description: t('connections.connect_error_tiktok'), variant: "destructive" }); setConnectingProvider(null); }
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
      const platformName = provider === 'meta_ig' ? 'Instagram' : provider === 'tiktok' ? 'TikTok' : provider;
      toast({ title: t('connections.disconnected_title'), description: t('connections.disconnected_desc', { platform: platformName }) });
      await loadConnections();
    } catch (error) {
      toast({ title: t('connections.disconnect_error'), description: error instanceof Error ? error.message : t('connections.disconnect_error_desc'), variant: "destructive" });
    }
  };

  const reconnectTikTok = async () => {
    setConnectingProvider('tiktok');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: t('connections.not_logged_in'), variant: "destructive" }); setConnectingProvider(null); return; }
      await supabase.from('tokens').delete().eq('user_id', session.user.id).eq('provider', 'tiktok');
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error || !data?.url) throw new Error('Could not initialize TikTok OAuth');
      window.location.href = data.url;
    } catch { toast({ title: t('connections.connect_error'), variant: "destructive" }); setConnectingProvider(null); }
  };

  const isConnected = (provider: string) => connections.some(c => c.provider === provider);
  const getConnection = (provider: string) => connections.find(c => c.provider === provider);

  const platforms = [
    {
      key: "tiktok",
      name: "TikTok",
      icon: TikTokIcon,
      gradient: "from-black via-gray-800 to-cyan-500",
      available: true,
      onConnect: connectTikTok,
      onReconnect: reconnectTikTok,
    },
    {
      key: "meta_ig",
      name: "Instagram",
      icon: Instagram,
      gradient: "from-purple-600 via-pink-500 to-orange-400",
      available: false,
    },
    {
      key: "linkedin",
      name: "LinkedIn",
      icon: LinkedInIcon,
      gradient: "from-blue-700 to-blue-500",
      available: false,
    },
    {
      key: "twitter",
      name: "X",
      icon: TwitterIcon,
      gradient: "from-gray-900 to-gray-700",
      available: false,
    },
    {
      key: "meta_fb",
      name: "Facebook",
      icon: FacebookIcon,
      gradient: "from-blue-600 to-blue-400",
      available: false,
    },
    {
      key: "youtube",
      name: "YouTube",
      icon: YouTubeIcon,
      gradient: "from-red-600 to-red-500",
      available: false,
    },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          {t('connections.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const connected = isConnected(platform.key);
            const connection = getConnection(platform.key);

            return (
              <Popover key={platform.key}>
                <PopoverTrigger asChild>
                  <button
                    className="relative flex flex-col items-center gap-1.5 group focus:outline-none"
                    disabled={!platform.available && !connected}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                      connected
                        ? "border-green-500/30 bg-green-500/10 shadow-sm"
                        : platform.available
                        ? "border-border bg-muted/50 hover:border-primary/30 hover:bg-primary/5"
                        : "border-border/50 bg-muted/30 opacity-50"
                    }`}>
                      <Icon className={`w-5 h-5 ${connected ? "text-foreground" : "text-muted-foreground"}`} />
                    </div>
                    {connected && (
                      <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-green-500 bg-background rounded-full" />
                    )}
                    <span className="text-[10px] text-muted-foreground">{platform.name}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="center">
                  {connected ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">{platform.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        @{connection?.username || t('connections.not_connected').toLowerCase()}
                      </p>
                      <div className="flex gap-1.5">
                        {platform.onReconnect && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] flex-1"
                            onClick={platform.onReconnect}
                            disabled={connectingProvider !== null}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {t('connections.reconnect')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] text-destructive hover:text-destructive flex-1"
                          onClick={() => disconnectProvider(platform.key)}
                          disabled={connectingProvider !== null}
                        >
                          {t('connections.disconnect')}
                        </Button>
                      </div>
                    </div>
                  ) : platform.available ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">{platform.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t('connections.not_connected')}</p>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-[10px] w-full"
                        onClick={platform.onConnect}
                        disabled={connectingProvider !== null}
                      >
                        {connectingProvider === platform.key ? t('connections.connecting') : t('connections.connect')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{platform.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t('connections.coming_soon')}</p>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
