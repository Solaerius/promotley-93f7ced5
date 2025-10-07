import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, CheckCircle2, Link as LinkIcon, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  provider: string;
  username: string | null;
  connected_at: string;
}

export const ConnectionManager = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
    
    // Check for successful connection from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    if (connected) {
      toast({
        title: "✓ Ansluten!",
        description: `${connected} har kopplats till ditt konto`,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      loadConnections();
    }
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const connectFacebook = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att ansluta konton",
          variant: "destructive",
        });
        return;
      }

      // Generate cryptographically secure state token
      const stateToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store state token in database
      const { error: stateError } = await supabase
        .from('oauth_states')
        .insert({
          state_token: stateToken,
          user_id: session.user.id,
          provider: 'meta_fb'
        });

      if (stateError) {
        console.error('Failed to create OAuth state:', stateError);
        toast({
          title: "Säkerhetsfel",
          description: "Kunde inte initiera säker anslutning.",
          variant: "destructive",
        });
        return;
      }

      // Get Meta App ID from backend
      const { data: appIdData, error: appIdError } = await supabase.functions.invoke('get-meta-app-id');
      
      if (appIdError || !appIdData?.app_id) {
        throw new Error('Could not get Meta App ID');
      }

      const metaAppId = appIdData.app_id;
      const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-callback?provider=meta_fb`;
      
      // Permissions we need from Facebook
      const permissions = [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'read_insights'
      ].join(',');

      // Build OAuth URL with secure state token
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${metaAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(permissions)}&` +
        `state=${stateToken}&` +
        `response_type=code`;

      // Redirect to Facebook OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      toast({
        title: "Fel vid anslutning",
        description: "Kunde inte ansluta till Facebook",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const connectTikTok = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att ansluta konton",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to initiate TikTok OAuth
      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.url) {
        throw new Error('Could not initialize TikTok OAuth');
      }

      // Redirect to TikTok OAuth
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting TikTok:', error);
      toast({
        title: "Fel vid anslutning",
        description: "Kunde inte ansluta till TikTok",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const disconnectProvider = async (provider: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', provider as any);

      if (error) throw error;

      toast({
        title: "Frånkopplad",
        description: `${provider} har kopplats från ditt konto`,
      });

      loadConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Fel",
        description: "Kunde inte koppla från kontot",
        variant: "destructive",
      });
    }
  };

  const isConnected = (provider: string) => {
    return connections.some(c => c.provider === provider);
  };

  const getConnection = (provider: string) => {
    return connections.find(c => c.provider === provider);
  };

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
        {/* Facebook */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Facebook</p>
              {isConnected('meta_fb') ? (
                <p className="text-sm text-muted-foreground">
                  Ansluten som {getConnection('meta_fb')?.username || 'Okänd'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Inte ansluten
                </p>
              )}
            </div>
          </div>
          
          {isConnected('meta_fb') ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectProvider('meta_fb')}
              >
                Koppla från
              </Button>
            </div>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              onClick={connectFacebook}
              disabled={loading}
            >
              {loading ? "Ansluter..." : "Anslut"}
            </Button>
          )}
        </div>

        {/* TikTok */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-black via-gray-800 to-cyan-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">TikTok</p>
              {isConnected('tiktok') ? (
                <p className="text-sm text-muted-foreground">
                  Ansluten som {getConnection('tiktok')?.username || 'Okänd'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Inte ansluten
                </p>
              )}
            </div>
          </div>
          
          {isConnected('tiktok') ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectProvider('tiktok')}
              >
                Koppla från
              </Button>
            </div>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              onClick={connectTikTok}
              disabled={loading}
            >
              {loading ? "Ansluter..." : "Anslut"}
            </Button>
          )}
        </div>

        {/* More platforms */}
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
          <p className="text-sm">Fler plattformar kommer snart...</p>
          <p className="text-xs mt-1">Instagram, LinkedIn, Twitter</p>
        </div>
      </CardContent>
    </Card>
  );
};
