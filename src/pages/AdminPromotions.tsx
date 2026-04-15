import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Gift, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PromotionLink {
  id: string; code: string; credits_amount: number; max_uses: number | null;
  current_uses: number; expires_at: string | null; is_active: boolean; created_at: string;
}

const AdminPromotions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<PromotionLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", credits_amount: 10, max_uses: "", expires_at: "" });

  useEffect(() => { loadPromotions(); }, []);

  const loadPromotions = async () => {
    const { data, error } = await supabase.from("promotion_links").select("*").order("created_at", { ascending: false });
    if (!error && data) setPromotions(data as any);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.code || !form.credits_amount) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("promotion_links").insert({
      code: form.code.toUpperCase().trim(), credits_amount: form.credits_amount,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null, expires_at: form.expires_at || null, created_by: session?.user?.id,
    });
    if (error) { toast({ title: t('admin.error_title'), description: error.message, variant: "destructive" }); }
    else { toast({ title: t('admin.created_label'), description: t('admin.created_desc', { code: form.code }) }); setForm({ code: "", credits_amount: 10, max_uses: "", expires_at: "" }); setIsDialogOpen(false); loadPromotions(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => { await supabase.from("promotion_links").update({ is_active: !active }).eq("id", id); loadPromotions(); };
  const deletePromotion = async (id: string) => { await supabase.from("promotion_links").delete().eq("id", id); loadPromotions(); toast({ title: t('admin.deleted_label') }); };
  const copyLink = (code: string) => { navigator.clipboard.writeText(`${window.location.origin}/promo/${code}`); toast({ title: t('admin.copied_label'), description: t('admin.copied_desc') }); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">{t('admin.promotions_title')}</h1><p className="text-sm text-muted-foreground">{t('admin.promotions_subtitle')}</p></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />{t('admin.new_promotion')}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('admin.new_promotion_link')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>{t('admin.code_label')}</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="VINTER2025" /></div>
                <div className="space-y-2"><Label>{t('admin.credits_amount')}</Label><Input type="number" value={form.credits_amount} onChange={e => setForm({...form, credits_amount: parseInt(e.target.value) || 0})} /></div>
                <div className="space-y-2"><Label>{t('admin.max_uses')}</Label><Input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} placeholder="∞" /></div>
                <div className="space-y-2"><Label>{t('admin.expiry_date')}</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} /></div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}{t('admin.create_btn')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.col_code')}</TableHead><TableHead>{t('admin.col_credits')}</TableHead><TableHead>{t('admin.col_uses')}</TableHead>
                  <TableHead>{t('admin.col_expires')}</TableHead><TableHead>{t('admin.col_status')}</TableHead><TableHead>{t('admin.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                : promotions.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('admin.no_promotions')}</TableCell></TableRow>
                : promotions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold">{p.code}</TableCell>
                    <TableCell>{p.credits_amount}</TableCell>
                    <TableCell>{p.current_uses}/{p.max_uses ?? "∞"}</TableCell>
                    <TableCell>{p.expires_at ? new Date(p.expires_at).toLocaleDateString("sv-SE") : "—"}</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(p.code)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePromotion(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPromotions;
