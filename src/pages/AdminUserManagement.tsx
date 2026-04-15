import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Gift, Users, Mail, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

type UserPlan = "starter" | "growth" | "pro";
interface User { id: string; email: string; plan: UserPlan; credits_left: number; max_credits: number; renewal_date: string; sponsored_until: string | null; created_at: string; }

const PLAN_NAMES: Record<UserPlan, string> = { starter: "Starter (29 kr)", growth: "Growth (49 kr)", pro: "Pro (99 kr)" };
const PLAN_CREDITS: Record<UserPlan, number> = { starter: 50, growth: 100, pro: 300 };

export default function AdminUserManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSearching, setEmailSearching] = useState(false);
  const [selectedPlanByEmail, setSelectedPlanByEmail] = useState<string>("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { setLoading(true); const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false }); if (error) throw error; setUsers((data || []) as unknown as User[]); }
    catch (error) { console.error("Error loading users:", error); toast.error(t('admin.could_not_load_users')); } finally { setLoading(false); }
  };

  const sponsorUser = async (userId: string, plan: UserPlan, months: number) => {
    try {
      setUpdating(userId);
      const sponsoredUntil = new Date(); sponsoredUntil.setMonth(sponsoredUntil.getMonth() + months);
      const renewalDate = new Date(); renewalDate.setMonth(renewalDate.getMonth() + 1);
      const maxCredits = PLAN_CREDITS[plan];
      const { error } = await supabase.from("users").update({ plan, sponsored_until: sponsoredUntil.toISOString(), renewal_date: renewalDate.toISOString(), max_credits: maxCredits, credits_left: maxCredits, credits_used: 0 }).eq("id", userId);
      if (error) throw error;
      toast.success(t('admin.user_sponsored', { plan: PLAN_NAMES[plan], months }));
      loadUsers();
    } catch (error) { console.error("Error sponsoring user:", error); toast.error(t('admin.could_not_sponsor')); } finally { setUpdating(null); }
  };

  const removeSponsor = async (userId: string) => {
    try {
      setUpdating(userId);
      const { error } = await supabase.from("users").update({ plan: "starter", sponsored_until: null, max_credits: 50, credits_left: 1 }).eq("id", userId);
      if (error) throw error;
      toast.success(t('admin.sponsor_removed')); loadUsers();
    } catch (error) { console.error("Error removing sponsor:", error); toast.error(t('admin.could_not_remove_sponsor')); } finally { setUpdating(null); }
  };

  const sponsorByEmail = async () => {
    if (!emailInput.trim() || !selectedPlanByEmail) { toast.error(t('admin.enter_email_and_package')); return; }
    const [plan, months] = selectedPlanByEmail.split("-");
    try {
      setEmailSearching(true);
      const { data: userData, error: findError } = await supabase.from("users").select("id, email").eq("email", emailInput.trim().toLowerCase()).maybeSingle();
      if (findError) throw findError;
      if (!userData) { toast.error(t('admin.no_user_found')); return; }
      await sponsorUser(userData.id, plan as UserPlan, parseInt(months));
      setEmailInput(""); setSelectedPlanByEmail("");
    } catch (error) { console.error("Error sponsoring by email:", error); toast.error(t('admin.could_not_give_email')); } finally { setEmailSearching(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" />{t('admin.back_to_admin')}</Button>
      <div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><h1 className="text-3xl font-bold text-foreground">{t('admin.user_mgmt_title')}</h1><p className="text-muted-foreground">{t('admin.user_mgmt_subtitle')}</p></div></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />{t('admin.give_by_email_title')}</CardTitle><CardDescription>{t('admin.give_by_email_desc')}</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]"><label className="text-sm font-medium mb-1 block">{t('admin.email_label')}</label><Input type="email" placeholder="exempel@email.se" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={emailSearching} /></div>
            <div className="min-w-[180px]"><label className="text-sm font-medium mb-1 block">{t('admin.select_package')}</label>
              <Select value={selectedPlanByEmail} onValueChange={setSelectedPlanByEmail} disabled={emailSearching}>
                <SelectTrigger><SelectValue placeholder={t('admin.select_package')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter-1">Starter - 1 mån</SelectItem><SelectItem value="starter-3">Starter - 3 mån</SelectItem>
                  <SelectItem value="growth-1">Growth - 1 mån</SelectItem><SelectItem value="growth-3">Growth - 3 mån</SelectItem>
                  <SelectItem value="pro-1">Pro - 1 mån</SelectItem><SelectItem value="pro-3">Pro - 3 mån</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sponsorByEmail} disabled={emailSearching || !emailInput.trim() || !selectedPlanByEmail}>
              {emailSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}{t('admin.give_package')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {users.map((u) => (
          <Card key={u.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{u.email}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{PLAN_NAMES[u.plan] || u.plan}</Badge>
                    {u.sponsored_until && new Date(u.sponsored_until) > new Date() && <Badge variant="default" className="bg-accent"><Gift className="h-3 w-3 mr-1" />{t('admin.sponsored_until', { date: new Date(u.sponsored_until).toLocaleDateString("sv-SE") })}</Badge>}
                  </CardDescription>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{t('admin.credits_display', { left: u.credits_left, max: u.max_credits })}</p>
                  <p className="text-xs">{t('admin.member_since', { date: new Date(u.created_at).toLocaleDateString("sv-SE") })}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Select disabled={updating === u.id} onValueChange={(value) => { const [plan, months] = value.split("-"); sponsorUser(u.id, plan as UserPlan, parseInt(months)); }}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('admin.give_package_select')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter-1">Starter - 1 mån</SelectItem><SelectItem value="starter-3">Starter - 3 mån</SelectItem>
                    <SelectItem value="growth-1">Growth - 1 mån</SelectItem><SelectItem value="growth-3">Growth - 3 mån</SelectItem>
                    <SelectItem value="pro-1">Pro - 1 mån</SelectItem><SelectItem value="pro-3">Pro - 3 mån</SelectItem>
                  </SelectContent>
                </Select>
                {u.sponsored_until && new Date(u.sponsored_until) > new Date() && (
                  <Button variant="outline" size="sm" onClick={() => removeSponsor(u.id)} disabled={updating === u.id}>
                    {updating === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.remove_sponsor')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
