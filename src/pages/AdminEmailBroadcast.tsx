import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, Users, Loader2, Plus, X, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminEmailBroadcast = () => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecipientCount(); }, []);

  const fetchRecipientCount = async () => {
    try {
      const { count } = await supabase.from("users").select("id", { count: "exact", head: true }).eq("email_newsletter", true).is("deleted_at", null);
      setRecipientCount(count || 0);
    } catch (err) { console.error("Error fetching count:", err); } finally { setLoading(false); }
  };

  const addCustomEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error(t('admin.invalid_email')); return; }
    if (customEmails.includes(email)) { toast.error(t('admin.address_exists')); return; }
    setCustomEmails([...customEmails, email]); setNewEmail("");
  };

  const removeCustomEmail = (email: string) => { setCustomEmails(customEmails.filter((e) => e !== email)); };

  const buildHtml = () => {
    return `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8" /></head>
      <body style="background-color: #FFF8F5; font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 16px; margin: 0;">
        <div style="background-color: #ffffff; border-radius: 20px; max-width: 480px; margin: 0 auto; box-shadow: 0 8px 40px rgba(53,20,29,0.08); overflow: hidden;">
          <div style="background-color: #ffffff; border-bottom: 1px solid #F0E6E8; padding: 20px 32px;">
            <table cellpadding="0" cellspacing="0"><tr><td style="vertical-align: middle;"><img src="https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Promotely" width="40" height="40" /></td><td style="vertical-align: middle; padding-left: 12px;"><span style="font-size: 18px; font-weight: 700; color: #952A5E;">Promotely UF</span></td></tr></table>
          </div>
          <div style="padding: 36px 32px 28px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #35141D; margin: 0 0 16px;">${subject}</h1>
            <div style="font-size: 15px; color: #5C3D45; line-height: 1.7;">${content.replace(/\n/g, "<br />")}</div>
          </div>
          <hr style="border: none; border-top: 1px solid #F0E6E8; margin: 0 32px;" />
          <div style="padding: 24px 32px 32px; text-align: center;"><p style="font-size: 11px; color: #B8A5AA; margin: 0;">© ${new Date().getFullYear()} Promotely · Stockholm, Sverige</p></div>
        </div>
      </body></html>`;
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) { toast.error(t('admin.fill_required')); return; }
    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) { toast.error(t('admin.must_be_logged_in')); return; }
      const htmlContent = buildHtml();
      const payload: Record<string, unknown> = { subject, htmlContent };
      if (customEmails.length > 0) payload.customEmails = customEmails;
      const { data, error } = await supabase.functions.invoke("send-broadcast-email", { body: payload, headers: { Authorization: `Bearer ${session.session.access_token}` } });
      if (error) { toast.error(t('admin.send_failed', { error: error.message })); return; }
      toast.success(t('admin.send_success', { sent: data.sent, failed: data.failed }));
      setSubject(""); setContent(""); setCustomEmails([]);
    } catch (err) { console.error(err); toast.error(t('admin.something_wrong')); } finally { setSending(false); }
  };

  const targetCount = customEmails.length > 0 ? customEmails.length : recipientCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><Mail className="w-8 h-8" />{t('admin.email_broadcast_title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.email_broadcast_subtitle')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('admin.write_email')}</CardTitle><CardDescription>{t('admin.fill_subject_content')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="subject">{t('admin.subject_label')}</Label><Input id="subject" placeholder={t('admin.subject_placeholder')} value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="content">{t('admin.content_label')}</Label><Textarea id="content" placeholder={t('admin.content_placeholder')} value={content} onChange={(e) => setContent(e.target.value)} rows={10} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t('admin.specific_recipients')}</CardTitle><CardDescription>{t('admin.leave_empty_all')}</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="namn@exempel.se" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomEmail()} />
                  <Button size="icon" variant="outline" onClick={addCustomEmail}><Plus className="w-4 h-4" /></Button>
                </div>
                {customEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customEmails.map((email) => (<Badge key={email} variant="secondary" className="gap-1">{email}<button onClick={() => removeCustomEmail(email)}><X className="w-3 h-3" /></button></Badge>))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />{t('admin.recipients')}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-foreground">{loading ? "..." : targetCount}</div>
                  <p className="text-sm text-muted-foreground">{customEmails.length > 0 ? t('admin.specific_recipients_label') : t('admin.subscribers_label')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />{t('admin.preview_title')}</CardTitle></CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full mb-4" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? t('admin.hide_preview') : t('admin.show_preview')} {t('admin.preview_suffix')}
                </Button>
                {showPreview && (<div className="border rounded-lg overflow-hidden" style={{ maxHeight: "400px", overflowY: "auto" }}><iframe srcDoc={buildHtml()} title={t('admin.preview_title')} className="w-full h-96 border-0" /></div>)}
              </CardContent>
            </Card>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={!subject.trim() || !content.trim() || sending}>
                  {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('admin.sending_label')}</> : <><Send className="w-4 h-4 mr-2" />{t('admin.send_to', { count: targetCount })}</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('admin.confirm_broadcast_title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('admin.confirm_broadcast_desc', { subject, count: targetCount })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>{t('admin.send_now')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmailBroadcast;
