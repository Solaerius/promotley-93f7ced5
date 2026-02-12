import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Instagram, Music2, Link as LinkIcon, XCircle, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useConnections } from "@/hooks/useConnections";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const AppSettingsContent = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { connections, loadConnections, isConnected, getConnection } = useConnections();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const connectInstagram = async () => {
    setConnectingProvider('instagram');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Inte inloggad", variant: "destructive" });
        setConnectingProvider(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke('init-meta-oauth', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { provider: 'meta_ig' },
      });
      if (error || !data?.url) throw error;
      window.location.href = data.url;
    } catch (error) {
      toast({ title: "Anslutning misslyckades", variant: "destructive" });
      setConnectingProvider(null);
    }
  };

  const connectTikTok = async () => {
    setConnectingProvider('tiktok');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Inte inloggad", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth');
      if (error || !data?.url) throw error;
      window.location.href = data.url;
    } catch (error) {
      toast({ title: "Anslutning misslyckades", variant: "destructive" });
      setConnectingProvider(null);
    }
  };

  const disconnectProvider = async (provider: 'tiktok' | 'meta_ig') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const connection = getConnection(provider);
      if (!connection) return;

      await supabase.from('tokens').delete().eq('user_id', session.user.id).eq('provider', provider);
      await supabase.from('connections').delete().eq('id', connection.id);
      await loadConnections();
      toast({ title: "Frånkopplad" });
    } catch (error) {
      toast({ title: "Fel", variant: "destructive" });
    }
  };

  const platformConnections = [
    {
      name: "Instagram",
      provider: 'meta_ig' as const,
      icon: Instagram,
      color: "from-purple-500 to-pink-500",
      connect: connectInstagram,
      note: "Kräver företagskonto kopplat till Facebook-sida"
    },
    {
      name: "TikTok",
      provider: 'tiktok' as const,
      icon: Music2,
      color: "from-black to-gray-800",
      connect: connectTikTok,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Theme */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Utseende</h2>
        <p className="text-sm text-muted-foreground mb-4">Välj mellan ljust, mörkt eller systemets tema</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "light", label: "Ljust", icon: Sun },
            { value: "dark", label: "Mörkt", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`p-4 border rounded-lg transition-all hover:border-primary ${
                theme === value ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{label}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Social Connections */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Kopplade konton</h2>
        <p className="text-sm text-muted-foreground mb-4">Anslut dina sociala medier för att se statistik</p>
        <div className="space-y-3">
          {platformConnections.map((platform) => {
            const connected = isConnected(platform.provider);
            const connection = getConnection(platform.provider);
            const Icon = platform.icon;
            const isLoading = connectingProvider === platform.provider.replace('meta_', '');

            return (
              <div key={platform.provider} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    {connected && connection?.username && (
                      <p className="text-sm text-muted-foreground">@{connection.username}</p>
                    )}
                    {!connected && platform.note && (
                      <p className="text-xs text-muted-foreground">{platform.note}</p>
                    )}
                  </div>
                </div>
                {connected ? (
                  <Button variant="outline" size="sm" onClick={() => disconnectProvider(platform.provider)}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Koppla från
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={platform.connect} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <LinkIcon className="w-4 h-4 mr-1" />
                    )}
                    Anslut
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default AppSettingsContent;
