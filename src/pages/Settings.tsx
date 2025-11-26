import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Link as LinkIcon, Instagram, Music2, Facebook, Sun, Moon, Monitor } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import logo from "@/assets/logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { connections, loadConnections, isConnected, getConnection } = useConnections();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [originalCompanyName, setOriginalCompanyName] = useState("");
  const [isSavingCompanyName, setIsSavingCompanyName] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Fetch user's company name
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('company_name, email')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setCompanyName(data.company_name || "");
        setOriginalCompanyName(data.company_name || "");
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleDownloadData = () => {
    toast({
      title: "Data exporteras",
      description: "Din data förbereds för nedladdning...",
    });
  };

  const connectFacebook = async () => {
    setConnectingProvider('facebook');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att ansluta konton",
          variant: "destructive",
        });
        setConnectingProvider(null);
        return;
      }

      // Call edge function to initiate OAuth
      const { data, error } = await supabase.functions.invoke('init-meta-oauth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { provider: 'meta_fb' },
      });

      if (error || !data?.url) {
        console.error('Error initiating Facebook OAuth:', error);
        toast({
          title: "Anslutning misslyckades",
          description: "Kunde inte ansluta till Facebook",
          variant: "destructive",
        });
        setConnectingProvider(null);
        return;
      }

      // Redirect to OAuth URL
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      toast({
        title: "Anslutning misslyckades",
        description: "Kunde inte ansluta till Facebook",
        variant: "destructive",
      });
      setConnectingProvider(null);
    }
  };

  const connectInstagram = async () => {
    setConnectingProvider('instagram');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Inte inloggad",
          description: "Du måste vara inloggad för att ansluta konton",
          variant: "destructive",
        });
        setConnectingProvider(null);
        return;
      }

      // Call edge function to initiate OAuth
      const { data, error } = await supabase.functions.invoke('init-meta-oauth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { provider: 'meta_ig' },
      });

      if (error || !data?.url) {
        console.error('Error initiating Instagram OAuth:', error);
        toast({
          title: "Anslutning misslyckades",
          description: "Kunde inte ansluta till Instagram",
          variant: "destructive",
        });
        setConnectingProvider(null);
        return;
      }

      // Redirect to OAuth URL
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      toast({
        title: "Anslutning misslyckades",
        description: "Kunde inte ansluta till Instagram",
        variant: "destructive",
      });
      setConnectingProvider(null);
    }
  };

  const connectTikTok = async () => {
    setConnectingProvider('tiktok');
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

      const { data, error } = await supabase.functions.invoke('init-tiktok-oauth');

      if (error || !data?.url) {
        throw new Error(error?.message || 'Failed to initialize TikTok OAuth');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting TikTok:', error);
      toast({
        title: "Anslutning misslyckades",
        description: "Kunde inte ansluta till TikTok",
        variant: "destructive",
      });
      setConnectingProvider(null);
    }
  };

  const disconnectProvider = async (provider: 'tiktok' | 'meta_fb' | 'meta_ig') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const connection = getConnection(provider);
      if (!connection) return;

      const { error: tokenError } = await supabase
        .from('tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', provider);

      if (tokenError) throw tokenError;

      const { error: connectionError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connection.id);

      if (connectionError) throw connectionError;

      await loadConnections();
      
      toast({
        title: "Frånkopplad",
        description: `${provider === 'tiktok' ? 'TikTok' : 'Facebook'} har kopplats från ditt konto`,
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Fel",
        description: "Kunde inte koppla från kontot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user?.id) {
      toast({
        title: "Fel",
        description: "Ingen användare inloggad",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Call the soft_delete_user_account RPC function
      const { error } = await supabase.rpc('soft_delete_user_account', {
        _user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Konto raderat",
        description: "Ditt konto har markerats för radering. Du har 30 dagar att ångra dig.",
      });

      // Sign out the user
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Fel vid radering",
        description: "Kunde inte radera kontot. Försök igen senare.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const handleSaveCompanyName = async () => {
    if (!user?.id || !companyName.trim()) {
      toast({
        title: "Fel",
        description: "Företagsnamn kan inte vara tomt",
        variant: "destructive",
      });
      return;
    }

    setIsSavingCompanyName(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ company_name: companyName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalCompanyName(companyName);
      toast({
        title: "Namn uppdaterat",
        description: "Ditt företagsnamn har uppdaterats",
      });
    } catch (error) {
      console.error('Error updating company name:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera företagsnamn",
        variant: "destructive",
      });
    } finally {
      setIsSavingCompanyName(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Inställningar</h1>
          <p className="text-muted-foreground">
            Hantera ditt konto och dina integrerade konton
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Utseende</h2>
            <p className="text-muted-foreground mb-6">
              Välj mellan ljust, mörkt eller systemets tema
            </p>

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

          {/* Account info */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Kontoinformation</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">E-post</p>
                <p className="font-medium">{user?.email || "exempel@mittuf.se"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Företagsnamn</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mitt UF-företag"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveCompanyName}
                    disabled={isSavingCompanyName || companyName === originalCompanyName}
                  >
                    {isSavingCompanyName ? "Sparar..." : "Spara"}
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="font-medium">Gratis (1 kredit kvar)</p>
              </div>
            </div>
          </Card>

          {/* Connected accounts */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Anslutna konton</h2>
            <p className="text-muted-foreground mb-6">
              Hantera dina sociala medier-konton för dataanalys
            </p>

            <div className="space-y-4">
              {[
                { name: "Instagram", provider: "meta_ig" as const, icon: Instagram, color: "from-purple-600 via-pink-500 to-orange-400", connect: connectInstagram },
                { name: "TikTok", provider: "tiktok" as const, icon: Music2, color: "from-cyan-500 to-pink-500", connect: connectTikTok },
                { name: "Facebook", provider: "meta_fb" as const, icon: Facebook, color: "from-blue-600 to-blue-400", connect: connectFacebook },
              ].map((platform) => {
                const Icon = platform.icon;
                const connected = isConnected(platform.provider);
                const connection = getConnection(platform.provider);
                const providerName = platform.provider === 'meta_fb' ? 'facebook' : platform.provider === 'meta_ig' ? 'instagram' : platform.provider;
                const isConnecting = connectingProvider === providerName;
                
                return (
                  <div key={platform.provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {connected ? (
                            <>Ansluten {connection?.username && `som @${connection.username}`}</>
                          ) : (
                            "Ej ansluten"
                          )}
                        </p>
                      </div>
                    </div>
                    {connected ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => disconnectProvider(platform.provider)}
                      >
                        Koppla från
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={platform.connect}
                        disabled={isConnecting}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {isConnecting ? "Kopplar..." : "Anslut"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* GDPR - My Data */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Min Data (GDPR)</h2>
            <p className="text-muted-foreground mb-6">
              Hantera din data i enlighet med GDPR
            </p>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Exportera min data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ladda ner all din lagrade data inklusive statistik och AI-förslag
                </p>
                <Button variant="outline" onClick={handleDownloadData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportera data
                </Button>
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive">Radera mitt konto</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanent radera ditt konto och all tillhörande data. Denna åtgärd kan inte ångras.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Radera konto
                </Button>
              </div>
            </div>
          </Card>

          {/* Privacy note */}
          <Card className="p-6 bg-gradient-hero">
            <p className="text-sm text-muted-foreground">
              📋 <strong>Integritetspolicy:</strong> Promotley behandlar din data säkert enligt GDPR.
              All kommunikation är krypterad (SSL/TLS) och vi samlar endast in data som är 
              nödvändig för tjänstens funktionalitet. Du har full kontroll över din data.
            </p>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kommer att radera ditt konto permanent efter 30 dagar.
              Under dessa 30 dagar kan du kontakta oss för att återställa ditt konto.
              All din data, inklusive anslutna konton, AI-förslag och statistik kommer att raderas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Raderar..." : "Radera mitt konto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Settings;
