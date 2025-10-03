import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Link as LinkIcon, Instagram, Music2, Facebook, Sun, Moon, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const handleDownloadData = () => {
    toast({
      title: "Data exporteras",
      description: "Din data förbereds för nedladdning...",
    });
  };

  const handleDisconnect = (platform: string) => {
    toast({
      title: `${platform} frånkopplad`,
      description: "Inga fler data kommer att hämtas från denna plattform.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Bekräftelse krävs",
      description: "Är du säker? Denna åtgärd kan inte ångras.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <img src={logo} alt="Promotely Logo" className="w-10 h-10" />
              <span>Promotely</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">E-post</p>
                <p className="font-medium">exempel@mittuf.se</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Företagsnamn</p>
                <p className="font-medium">Mitt UF-företag</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
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
                { name: "Instagram", icon: Instagram, connected: true, color: "from-pink-500 to-purple-500" },
                { name: "TikTok", icon: Music2, connected: true, color: "from-cyan-500 to-pink-500" },
                { name: "Facebook", icon: Facebook, connected: false, color: "from-blue-600 to-blue-400" },
              ].map((platform, index) => {
                const Icon = platform.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {platform.connected ? "Ansluten" : "Ej ansluten"}
                        </p>
                      </div>
                    </div>
                    {platform.connected ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(platform.name)}
                      >
                        Koppla från
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Anslut
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
              📋 <strong>Integritetspolicy:</strong> Promotely behandlar din data säkert enligt GDPR. 
              All kommunikation är krypterad (SSL/TLS) och vi samlar endast in data som är 
              nödvändig för tjänstens funktionalitet. Du har full kontroll över din data.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
