// Admin pages are Swedish-only (internal use). i18n not applied here.
import { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type StatusFilter = "all" | "active" | "canceled" | "past_due";

const statusLabel: Record<string, string> = {
  active: "Aktiv",
  canceled: "Avslutad",
  past_due: "Försenad",
  incomplete: "Ofullständig",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  canceled: "secondary",
  past_due: "destructive",
  incomplete: "outline",
};

const AdminStripeOrders = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, loading, error } = useSupabaseQuery(
    async () => {
      const { data, error } = await supabase
        .from("stripe_subscriptions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    []
  );

  const filtered = data?.filter((row: any) =>
    statusFilter === "all" ? true : row.status === statusFilter
  ) ?? [];

  const formatDate = (ts: string | null) => {
    if (!ts) return "—";
    return format(new Date(ts), "d MMM yyyy", { locale: sv });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stripe-prenumerationer</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrera status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla</SelectItem>
            <SelectItem value="active">Aktiva</SelectItem>
            <SelectItem value="canceled">Avslutade</SelectItem>
            <SelectItem value="past_due">Försenade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-muted-foreground">Laddar...</p>}
      {error && <p className="text-destructive">Fel: {(error as any).message}</p>}

      {!loading && !error && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3">E-post</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Period start</th>
                <th className="text-left px-4 py-3">Period slut</th>
                <th className="text-left px-4 py-3">Avslutar vid period</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Inga prenumerationer hittades
                  </td>
                </tr>
              )}
              {filtered.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">{row.users?.email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{row.plan}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[row.status] ?? "outline"}>
                      {statusLabel[row.status] ?? row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(row.current_period_start)}</td>
                  <td className="px-4 py-3">{formatDate(row.current_period_end)}</td>
                  <td className="px-4 py-3">{row.cancel_at_period_end ? "Ja" : "Nej"}</td>
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
