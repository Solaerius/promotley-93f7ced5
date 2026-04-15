import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Mail, Loader2, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AutomationSetting { id: string; email_type: string; enabled: boolean; delay_days: number; updated_at: string | null; }
interface AutomationLog { id: string; user_id: string; email_type: string; sent_at: string; }

export default function AdminEmailAutomation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AutomationSetting[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const EMAIL_TYPE_LABELS: Record<string, string> = {
    inactive_reminder: t('admin.automation_inactive_reminder'),
    reengagement: t('admin.automation_reengagement'),
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        supabase.from("email_automation_settings").select("*").order("email_type"),
        supabase.from("email_automation_logs").select("*").order("sent_at", { ascending: false }).limit(50),
      ]);
      if (settingsRes.data) setSettings(settingsRes.data as AutomationSetting[]);
      if (logsRes.data) setLogs(logsRes.data as AutomationLog[]);
    } catch (err) { console.error("Error loading email automation data:", err); } finally { setLoading(false); }
  };

  const updateSetting = async (id: string, updates: Partial<AutomationSetting>) => {
    setSaving(id);
    try {
      const { error } = await supabase.from("email_automation_settings").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      toast.success(t('admin.setting_saved'));
      loadData();
    } catch (err) { toast.error(t('admin.could_not_save_setting')); } finally { setSaving(null); }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" />{t('admin.back_to_admin')}</Button>
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div><h1 className="text-2xl font-bold">{t('admin.email_automation_title')}</h1><p className="text-sm text-muted-foreground">{t('admin.email_automation_subtitle')}</p></div>
        </div>
        <div className="grid gap-4">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{EMAIL_TYPE_LABELS[setting.email_type] || setting.email_type}</CardTitle>
                    <CardDescription>{t('admin.sent_after_days', { days: setting.delay_days })}</CardDescription>
                  </div>
                  <Switch checked={setting.enabled} onCheckedChange={(checked) => updateSetting(setting.id, { enabled: checked })} disabled={saving === setting.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t('admin.delay_label')}</span></div>
                  <Input type="number" min={1} max={90} value={setting.delay_days} onChange={(e) => { const val = parseInt(e.target.value); if (val > 0 && val <= 90) updateSetting(setting.id, { delay_days: val }); }} className="w-20 h-8 text-sm" disabled={saving === setting.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5" />{t('admin.recent_sends')}</CardTitle>
            <CardDescription>{t('admin.recent_sends_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {logs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">{t('admin.no_sends_yet')}</p> : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{EMAIL_TYPE_LABELS[log.email_type] || log.email_type}</Badge>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{log.user_id.slice(0, 8)}...</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.sent_at).toLocaleString("sv-SE")}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
