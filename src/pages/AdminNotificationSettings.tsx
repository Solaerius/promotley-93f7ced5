// Admin pages are Swedish-only (internal use). i18n not applied here.
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Phone, Save } from "lucide-react";

interface NotificationSettings {
  discord_webhook_url: string;
  notification_email: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  recipient_phone_number: string;
}

const AdminNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    discord_webhook_url: "",
    notification_email: "",
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_phone_number: "",
    recipient_phone_number: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Error loading settings:", error);
    } else if (data) {
      setSettings({
        discord_webhook_url: data.discord_webhook_url || "",
        notification_email: data.notification_email || "",
        twilio_account_sid: data.twilio_account_sid || "",
        twilio_auth_token: data.twilio_auth_token || "",
        twilio_phone_number: data.twilio_phone_number || "",
        recipient_phone_number: data.recipient_phone_number || "",
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from("notification_settings")
      .update({
        discord_webhook_url: settings.discord_webhook_url || null,
        notification_email: settings.notification_email || null,
        twilio_account_sid: settings.twilio_account_sid || null,
        twilio_auth_token: settings.twilio_auth_token || null,
        twilio_phone_number: settings.twilio_phone_number || null,
        recipient_phone_number: settings.recipient_phone_number || null,
      })
      .eq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningar",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sparat!",
        description: "Notifikationsinställningar uppdaterade",
      });
    }

    setIsSaving(false);
  };

  const handleChange = (field: keyof NotificationSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Notifikationsinställningar</h1>
            <p className="text-muted-foreground">
              Konfigurera hur du vill få notifikationer om nya chattar
            </p>
          </div>
        </div>

        {/* Discord Webhook */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Discord Webhook</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discord_webhook">Webhook URL</Label>
              <Input
                id="discord_webhook"
                type="url"
                value={settings.discord_webhook_url}
                onChange={(e) =>
                  handleChange("discord_webhook_url", e.target.value)
                }
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Skapa en webhook i Discord Server Settings → Integrations →
                Webhooks
              </p>
            </div>
          </div>
        </Card>

        {/* E-post */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">E-postnotifikationer</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification_email">Mottagar-e-post</Label>
              <Input
                id="notification_email"
                type="email"
                value={settings.notification_email}
                onChange={(e) =>
                  handleChange("notification_email", e.target.value)
                }
                placeholder="team@promotely.se"
              />
            </div>
          </div>
        </Card>

        {/* SMS (Twilio) */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">SMS (Twilio) - Valfritt</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="twilio_sid">Account SID</Label>
              <Input
                id="twilio_sid"
                value={settings.twilio_account_sid}
                onChange={(e) =>
                  handleChange("twilio_account_sid", e.target.value)
                }
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="twilio_token">Auth Token</Label>
              <Input
                id="twilio_token"
                type="password"
                value={settings.twilio_auth_token}
                onChange={(e) =>
                  handleChange("twilio_auth_token", e.target.value)
                }
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="twilio_phone">Twilio Phone Number</Label>
                <Input
                  id="twilio_phone"
                  value={settings.twilio_phone_number}
                  onChange={(e) =>
                    handleChange("twilio_phone_number", e.target.value)
                  }
                  placeholder="+46..."
                />
              </div>
              <div>
                <Label htmlFor="recipient_phone">Mottagar-nummer</Label>
                <Input
                  id="recipient_phone"
                  value={settings.recipient_phone_number}
                  onChange={(e) =>
                    handleChange("recipient_phone_number", e.target.value)
                  }
                  placeholder="+46..."
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Skapa ett konto på{" "}
              <a
                href="https://www.twilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                twilio.com
              </a>{" "}
              för SMS-notifikationer
            </p>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-primary hover:shadow-glow"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Sparar..." : "Spara inställningar"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotificationSettings;
