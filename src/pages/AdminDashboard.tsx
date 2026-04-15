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
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importingDocs, setImportingDocs] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, pendingOrders: 0, totalRevenue: 0, totalAIRequests: 0, unreadMessages: 0 });
  const [notificationStatus, setNotificationStatus] = useState({ discord: false, email: false, sms: false });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

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
      const users = usersRes.data || []; const orders = ordersRes.data || []; const msgs = msgsRes.data || [];
      const today = new Date().toISOString().split("T")[0];
      setStats({
        totalUsers: usersRes.count || users.length,
        activeToday: users.filter((u: any) => u.created_at?.startsWith(today)).length,
        pendingOrders: orders.filter((o: any) => o.status === "pending").length,
        totalRevenue: orders.filter((o: any) => o.status === "approved").reduce((s: number, o: any) => s + (o.amount || 0), 0),
        totalAIRequests: aiRes.count || 0,
        unreadMessages: msgs.filter((m: any) => m.sender_type === "user" && !m.read).length,
      });
      if (settingsRes.data) { const s = settingsRes.data; setNotificationStatus({ discord: !!s.discord_webhook_url, email: !!s.notification_email, sms: false }); }
      setRecentEvents(eventsRes.data || []);
    } catch (err) { console.error("Error:", err); } finally { setLoading(false); }
  };

  const handleImportKnowledge = async () => {
    setImportingDocs(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) { toast.error(t('admin.not_logged_in')); return; }
      const { data, error } = await supabase.functions.invoke("parse-knowledge-docs", { headers: { Authorization: `Bearer ${session.session.access_token}` } });
      if (error) { toast.error(t('admin.import_failed')); return; }
      toast.success(t('admin.import_success', { imported: data.summary.imported, updated: data.summary.updated }));
    } catch { toast.error(t('admin.something_wrong')); } finally { setImportingDocs(false); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div><h1 className="text-2xl font-bold">{t('admin.dashboard_title')}</h1><p className="text-sm text-muted-foreground">{t('admin.dashboard_subtitle')}</p></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t('admin.metric_users'), value: stats.totalUsers, icon: Users, color: "text-blue-500" },
            { label: t('admin.metric_unread'), value: stats.unreadMessages, icon: MessageCircle, color: "text-amber-500" },
            { label: t('admin.metric_pending_orders'), value: stats.pendingOrders, icon: CreditCard, color: "text-orange-500" },
            { label: t('admin.metric_revenue'), value: stats.totalRevenue, icon: BarChart3, color: "text-emerald-500" },
            { label: t('admin.metric_ai_requests'), value: stats.totalAIRequests, icon: Wand2, color: "text-purple-500" },
            { label: t('admin.metric_new_today'), value: stats.activeToday, icon: Activity, color: "text-pink-500" },
          ].map((m) => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-2 mb-1"><m.icon className={`w-4 h-4 ${m.color}`} /><span className="text-xs text-muted-foreground">{m.label}</span></div>
              <p className="text-2xl font-bold">{m.value}</p>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t('admin.quick_access')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: "/admin/chat", icon: MessageCircle, label: t('admin.chats'), variant: "default" as const },
                { href: "/admin/swish", icon: CreditCard, label: t('admin.swish_orders'), variant: "default" as const },
                { href: "/admin/users", icon: Users, label: t('admin.users_label'), variant: "outline" as const },
                { href: "/admin/bans", icon: Shield, label: t('admin.bans'), variant: "outline" as const },
                { href: "/admin/promotions", icon: Gift, label: t('admin.campaigns'), variant: "outline" as const },
                { href: "/admin/email", icon: Mail, label: t('admin.email_broadcast'), variant: "outline" as const },
                { href: "/admin/email-automation", icon: Settings, label: t('admin.email_automation_label'), variant: "outline" as const },
                { href: "/admin/settings/notifications", icon: Bell, label: t('admin.notifications_label'), variant: "outline" as const },
              ].map((a) => (
                <Link key={a.href} to={a.href}><Button variant={a.variant} className="w-full justify-start text-sm h-9" size="sm"><a.icon className="w-3.5 h-3.5 mr-2" />{a.label}</Button></Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> {t('admin.notification_channels')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[{ label: "Discord", active: notificationStatus.discord }, { label: "E-post", active: notificationStatus.email }, { label: "SMS (Twilio)", active: notificationStatus.sms }].map((ch) => (
                <div key={ch.label} className="flex items-center justify-between">
                  <span className="text-sm">{ch.label}</span>
                  <Badge variant={ch.active ? "default" : "secondary"} className="gap-1 text-xs">
                    {ch.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{ch.active ? t('admin.channel_active') : t('admin.channel_off')}
                  </Badge>
                </div>
              ))}
              <Link to="/admin/settings/notifications"><Button variant="outline" size="sm" className="w-full mt-2">{t('admin.manage_btn')}</Button></Link>
            </CardContent>
          </Card>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> {t('admin.ai_knowledge_base')}</CardTitle><CardDescription className="text-xs">{t('admin.import_docs_desc')}</CardDescription></CardHeader>
            <CardContent>
              <Button onClick={handleImportKnowledge} disabled={importingDocs} className="w-full" size="sm">
                {importingDocs ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.importing')}</> : <><BookOpen className="w-4 h-4 mr-2" />{t('admin.import_docs_btn')}</>}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> {t('admin.recent_activity')}</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                {recentEvents.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">{t('admin.no_activity')}</p> : (
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
        <p className="text-xs text-muted-foreground">{t('admin.admin_id_note', { id: user?.id?.slice(0, 8) + '...' })}</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
