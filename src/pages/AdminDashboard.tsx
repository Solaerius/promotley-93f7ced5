import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, AlertCircle, Bell, Users, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSessions: 0,
    unreadMessages: 0,
    totalMessages: 0,
  });
  const [notificationStatus, setNotificationStatus] = useState({
    discord: false,
    email: false,
    sms: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Subscribe to live updates
    const channel = supabase
      .channel("admin_dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_messages",
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get chat statistics
      const { data: messages } = await supabase
        .from("live_chat_messages")
        .select("session_id, sender_type, read");

      if (messages) {
        const uniqueSessions = new Set(messages.map((m) => m.session_id)).size;
        const unread = messages.filter(
          (m) => m.sender_type === "user" && !m.read
        ).length;

        setStats({
          activeSessions: uniqueSessions,
          unreadMessages: unread,
          totalMessages: messages.length,
        });
      }

      // Get notification settings
      const { data: settings } = await supabase
        .from("notification_settings")
        .select("*")
        .maybeSingle();

      if (settings) {
        setNotificationStatus({
          discord: !!settings.discord_webhook_url,
          email: !!settings.notification_email,
          sms: !!(settings.twilio_account_sid && settings.twilio_auth_token),
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Översikt över live-chattar och notifikationer
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva Chattar</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unika sessioner
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Olästa Meddelanden</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Väntar på svar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Meddelanden</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Alla konversationer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifikationsstatus
            </CardTitle>
            <CardDescription>
              Vilka notifikationskanaler är konfigurerade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discord Webhook</span>
                {notificationStatus.discord ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aktiverad
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Inte konfigurerad
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">E-post</span>
                {notificationStatus.email ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aktiverad
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Inte konfigurerad
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SMS (Twilio)</span>
                {notificationStatus.sms ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aktiverad
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Inte konfigurerad
                  </Badge>
                )}
              </div>
            </div>
            <Link to="/admin/settings/notifications">
              <Button className="w-full mt-4" variant="outline">
                Hantera Notifikationer
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtkomst</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link to="/admin/chat" className="flex-1">
              <Button className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Öppna Chattar
              </Button>
            </Link>
            <Link to="/admin/settings/notifications" className="flex-1">
              <Button variant="outline" className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Inställningar
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Setup Instructions */}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Lägg till Användare som Admin</AlertTitle>
          <AlertDescription>
            <div className="space-y-3 mt-2">
              <p className="text-sm">
                För att ge någon administratörsrättigheter måste du lägga till deras användar-ID i databasen:
              </p>
              
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-xs font-semibold">Steg 1: Hitta användar-ID</p>
                <p className="text-xs">
                  Din användar-ID: <code className="bg-background px-2 py-1 rounded text-xs">{user?.id}</code>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user?.id || "")}
                  className="text-xs h-7"
                >
                  Kopiera ID
                </Button>
              </div>

              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-xs font-semibold">Steg 2: Öppna Backend</p>
                <p className="text-xs">
                  1. Klicka på "Cloud" i övre menyn<br/>
                  2. Gå till "Database" → "Tables"<br/>
                  3. Välj tabellen <code className="bg-background px-1 rounded">user_roles</code>
                </p>
              </div>

              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-xs font-semibold">Steg 3: Lägg till admin-roll</p>
                <p className="text-xs">Klicka "Insert" och fyll i:</p>
                <div className="text-xs space-y-1 mt-2">
                  <div>• <strong>user_id:</strong> <code className="bg-background px-1 rounded">{user?.id}</code></div>
                  <div>• <strong>role:</strong> <code className="bg-background px-1 rounded">admin</code></div>
                </div>
                <p className="text-xs mt-2">
                  Klicka "Save" → Ladda om sidan → Du har nu admin-åtkomst!
                </p>
              </div>

              <Alert className="border-orange-500/50">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-xs">
                  <strong>OBS!</strong> Ge endast admin-åtkomst till personer du litar på. Admins kan se alla chattar och ändra notifikationsinställningar.
                </AlertDescription>
              </Alert>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
