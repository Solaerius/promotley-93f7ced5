// Admin pages are Swedish-only (internal use). i18n not applied here.
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

const AdminEmailBroadcast = () => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipientCount();
  }, []);

  const fetchRecipientCount = async () => {
    try {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("email_newsletter", true)
        .is("deleted_at", null);
      setRecipientCount(count || 0);
    } catch (err) {
      console.error("Error fetching count:", err);
    } finally {
      setLoading(false);
    }
  };

  const addCustomEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ogiltig e-postadress");
      return;
    }
    if (customEmails.includes(email)) {
      toast.error("Adressen finns redan");
      return;
    }
    setCustomEmails([...customEmails, email]);
    setNewEmail("");
  };

  const removeCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter((e) => e !== email));
  };

  const buildHtml = () => {
    return `
      <!DOCTYPE html>
      <html lang="sv">
      <head><meta charset="utf-8" /></head>
      <body style="background-color: #FFF8F5; font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 16px; margin: 0;">
        <div style="background-color: #ffffff; border-radius: 20px; max-width: 480px; margin: 0 auto; box-shadow: 0 8px 40px rgba(53,20,29,0.08); overflow: hidden;">
          <div style="background-color: #ffffff; border-bottom: 1px solid #F0E6E8; padding: 20px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align: middle;">
                <img src="https://fmvbzhlqzzwzciqgbzgp.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Promotely" width="40" height="40" />
              </td>
              <td style="vertical-align: middle; padding-left: 12px;">
                <span style="font-size: 18px; font-weight: 700; color: #952A5E;">Promotely UF</span>
              </td>
            </tr></table>
          </div>
          <div style="padding: 36px 32px 28px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #35141D; margin: 0 0 16px;">${subject}</h1>
            <div style="font-size: 15px; color: #5C3D45; line-height: 1.7;">
              ${content.replace(/\n/g, "<br />")}
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #F0E6E8; margin: 0 32px;" />
          <div style="padding: 24px 32px 32px; text-align: center;">
            <p style="font-size: 11px; color: #B8A5AA; margin: 0;">© ${new Date().getFullYear()} Promotely · Stockholm, Sverige</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Fyll i ämne och innehåll");
      return;
    }

    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error("Du måste vara inloggad");
        return;
      }

      const htmlContent = buildHtml();
      const payload: Record<string, unknown> = { subject, htmlContent };
      if (customEmails.length > 0) {
        payload.customEmails = customEmails;
      }

      const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        toast.error("Skickandet misslyckades: " + error.message);
        return;
      }

      toast.success(`Mejl skickat! ${data.sent} lyckades, ${data.failed} misslyckades`);
      setSubject("");
      setContent("");
      setCustomEmails([]);
    } catch (err) {
      console.error(err);
      toast.error("Något gick fel");
    } finally {
      setSending(false);
    }
  };

  const targetCount = customEmails.length > 0 ? customEmails.length : recipientCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-8 h-8" />
            E-postutskick
          </h1>
          <p className="text-muted-foreground mt-1">
            Skicka reklamutskick till registrerade användare
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skriv mejl</CardTitle>
                <CardDescription>Fyll i ämne och innehåll</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Ämne</Label>
                  <Input
                    id="subject"
                    placeholder="T.ex. Nyhet från Promotely!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Innehåll</Label>
                  <Textarea
                    id="content"
                    placeholder="Skriv ditt mejlinnehåll här..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Specifika mottagare (valfritt)</CardTitle>
                <CardDescription>
                  Lämna tomt för att skicka till alla prenumeranter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="namn@exempel.se"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomEmail()}
                  />
                  <Button size="icon" variant="outline" onClick={addCustomEmail}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button onClick={() => removeCustomEmail(email)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview & send */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mottagare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    {loading ? "..." : targetCount}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {customEmails.length > 0
                      ? "specifika mottagare"
                      : "prenumeranter (email_newsletter = true)"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Förhandsgranskning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Dölj" : "Visa"} förhandsgranskning
                </Button>
                {showPreview && (
                  <div
                    className="border rounded-lg overflow-hidden"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    <iframe
                      srcDoc={buildHtml()}
                      title="E-post förhandsgranskning"
                      className="w-full h-96 border-0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!subject.trim() || !content.trim() || sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Skicka till {targetCount} mottagare
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bekräfta utskick</AlertDialogTitle>
                  <AlertDialogDescription>
                    Du skickar mejlet "{subject}" till {targetCount} mottagare.
                    Detta kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>
                    Skicka nu
                  </AlertDialogAction>
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
