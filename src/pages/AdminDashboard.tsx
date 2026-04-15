// Admin pages are Swedish-only (internal use). i18n not applied here.
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Bell, Users, CheckCircle, XCircle, BookOpen, Loader2, Shield, CreditCard, Gift, Mail, BarChart3, Wand2, Activity, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importingDocs, setImportingDocs] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalAIRequests: 0,
    unreadMessages: 0,
  });
  const [notificationStatus, setNotificationStatus] = useState({ discord: false, email: false, sms: false });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [usersRes, ordersRes, msgsRes, settingsRes, eventsRes, aiRes] = await Promise.all([
        supabase.from("users").select("id, created_at", { count: "exact" }),
        supabase.from("swish_orders").select("status, amount"),
        supabase.from("live_chat_messages").select("sender_type, read"),
        supabase.from("notification_settings").select("*").maybeSingle(),
        supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("ai_chat_messages").select("id", { count: "exact", head: true }),
      ]);

      const users = usersRes.data || [];
      const orders = ordersRes.data || [];
      const msgs = msgsRes.data || [];
      const today = new Date().toISOString().split("T")[0];

      setStats({
        totalUsers: usersRes.count || users.length,
        activeToday: users.filter((u: any) => u.created_at?.startsWith(today)).length,
        pendingOrders: orders.filter((o: any) => o.status === "pending").length,
        totalRevenue: orders.filter((o: any) => o.status === "approved").reduce((s: number, o: any) => s + (o.amount || 0), 0),
        totalAIRequests: aiRes.count || 0,
        unreadMessages: msgs.filter((m: any) => m.sender_type === "user" && !m.read).length,
      });

      if (settingsRes.data) {
        const s = settingsRes.data;
        setNotificationStatus({
          discord: !!s.discord_webhook_url,
          email: !!s.notification_email,
          sms: false, // Twilio credentials managed via environment secrets
        });
      }

      setRecentEvents(eventsRes.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportKnowledge = async () => {
    setImportingDocs(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) { toast.error("Ej inloggad"); return; }
      const { data, error } = await supabase.functions.invoke("parse-knowledge-docs", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) { toast.error("Import misslyckades"); return; }
      toast.success(`Import klar! ${data.summary.imported} nya, ${data.summary.updated} uppdaterade`);
    } catch { toast.error("Något gick fel"); } finally { setImportingDocs(false); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Överblick och snabbåtkomst till alla verktyg</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Användare", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
            { label: "Olästa meddelanden", value: stats.unreadMessages, icon: MessageCircle, color: "text-amber-500" },
            { label: "Väntande ordrar", value: stats.pendingOrders, icon: CreditCard, color: "text-orange-500" },
            { label: "Intäkter (kr)", value: stats.totalRevenue, icon: BarChart3, color: "text-emerald-500" },
            { label: "AI-anrop", value: stats.totalAIRequests, icon: Wand2, color: "text-purple-500" },
            { label: "Nya idag", value: stats.activeToday, icon: Activity, color: "text-pink-500" },
          ].map((m) => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions + Notification Status */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Snabbåtkomst</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/admin/chat", icon: MessageCircle, label: "Chattar", variant: "default" as const },
                { href: "/admin/swish", icon: CreditCard, label: "Swish-ordrar", variant: "default" as const },
                { href: "/admin/users", icon: Users, label: "Användare", variant: "outline" as const },
                { href: "/admin/bans", icon: Shield, label: "Bannlysning", variant: "outline" as const },
                { href: "/admin/promotions", icon: Gift, label: "Kampanjer", variant: "outline" as const },
                { href: "/admin/email", icon: Mail, label: "E-postutskick", variant: "outline" as const },
                { href: "/admin/email-automation", icon: Settings, label: "E-postautomation", variant: "outline" as const },
                { href: "/admin/settings/notifications", icon: Bell, label: "Notiser", variant: "outline" as const },
              ].map((a) => (
                <Link key={a.href} to={a.href}>
                  <Button variant={a.variant} className="w-full justify-start text-sm h-9" size="sm">
                    <a.icon className="w-3.5 h-3.5 mr-2" />
                    {a.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Notification Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" /> Notifikationskanaler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Discord", active: notificationStatus.discord },
                { label: "E-post", active: notificationStatus.email },
                { label: "SMS (Twilio)", active: notificationStatus.sms },
              ].map((ch) => (
                <div key={ch.label} className="flex items-center justify-between">
                  <span className="text-sm">{ch.label}</span>
                  <Badge variant={ch.active ? "default" : "secondary"} className="gap-1 text-xs">
                    {ch.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {ch.active ? "Aktiv" : "Av"}
                  </Badge>
                </div>
              ))}
              <Link to="/admin/settings/notifications">
                <Button variant="outline" size="sm" className="w-full mt-2">Hantera</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* AI Knowledge + Activity Log */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> AI Kunskapsbas
              </CardTitle>
              <CardDescription className="text-xs">Importera dokument till AI:ns kunskapsbas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleImportKnowledge} disabled={importingDocs} className="w-full" size="sm">
                {importingDocs ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importerar...</> : <><BookOpen className="w-4 h-4 mr-2" />Importera Dokument</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" /> Senaste aktivitet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                {recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ingen aktivitet</p>
                ) : (
                  <div className="space-y-2">
                    {recentEvents.map((ev: any) => (
                      <div key={ev.id} className="flex items-center justify-between text-xs border-b border-border/50 pb-1.5 last:border-0">
                        <span className="font-medium truncate max-w-[60%]">{ev.event_type}</span>
                        <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString("sv-SE")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Admin note */}
        <p className="text-xs text-muted-foreground">
          Admin-ID: <code className="bg-muted px-1 rounded">{user?.id?.slice(0, 8)}...</code> — Lägg till fler admins via user_roles-tabellen i backend.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
