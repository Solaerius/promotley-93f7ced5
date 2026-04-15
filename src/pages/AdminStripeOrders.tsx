import { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type StatusFilter = "all" | "active" | "canceled" | "past_due";

const AdminStripeOrders = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusLabel: Record<string, string> = {
    active: t('admin.stripe_active'),
    canceled: t('admin.stripe_canceled'),
    past_due: t('admin.stripe_past_due'),
    incomplete: t('admin.stripe_incomplete'),
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default", canceled: "secondary", past_due: "destructive", incomplete: "outline",
  };

  const { data, loading, error } = useSupabaseQuery(async () => {
    const { data, error } = await supabase.from("stripe_subscriptions" as any).select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  }, []);

  const filtered = data?.filter((row: any) => statusFilter === "all" ? true : row.status === statusFilter) ?? [];

  const formatDate = (ts: string | null) => { if (!ts) return "—"; return format(new Date(ts), "d MMM yyyy", { locale: sv }); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.stripe_title')}</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('admin.stripe_filter_placeholder')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.stripe_all')}</SelectItem>
            <SelectItem value="active">{t('admin.stripe_active')}</SelectItem>
            <SelectItem value="canceled">{t('admin.stripe_canceled')}</SelectItem>
            <SelectItem value="past_due">{t('admin.stripe_past_due')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading && <p className="text-muted-foreground">{t('admin.stripe_loading')}</p>}
      {error && <p className="text-destructive">{t('admin.stripe_error', { message: (error as any).message })}</p>}
      {!loading && !error && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_email')}</th>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_plan')}</th>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_status')}</th>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_period_start')}</th>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_period_end')}</th>
                <th className="text-left px-4 py-3">{t('admin.stripe_col_cancel_at_period')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{t('admin.stripe_no_subscriptions')}</td></tr>}
              {filtered.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">{row.users?.email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{row.plan}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[row.status] ?? "outline"}>{statusLabel[row.status] ?? row.status}</Badge></td>
                  <td className="px-4 py-3">{formatDate(row.current_period_start)}</td>
                  <td className="px-4 py-3">{formatDate(row.current_period_end)}</td>
                  <td className="px-4 py-3">{row.cancel_at_period_end ? t('admin.stripe_yes') : t('admin.stripe_no')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminStripeOrders;
