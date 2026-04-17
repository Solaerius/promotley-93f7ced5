import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Skeleton } from "@/components/ui/skeleton";

interface Tx {
  id: string;
  created_at: string;
  function_name: string;
  credits_used: number;
  cost_usd: number | null;
  model: string | null;
}

const FUNCTION_LABELS: Record<string, string> = {
  "ai-assistant": "AI-chatt",
  "generate-suggestion": "Förslag",
  "generate-ai-analysis": "AI-analys",
  "sales-radar": "Säljradar",
};

export default function CreditsHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("credit_transactions")
        .select("id, created_at, function_name, credits_used, cost_usd, model")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data as Tx[]) || []);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("credits.no_history", "Ingen användning än.")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2 font-medium">{t("credits.col_date", "Datum")}</th>
            <th className="text-left px-3 py-2 font-medium">{t("credits.col_function", "Funktion")}</th>
            <th className="text-right px-3 py-2 font-medium">{t("credits.col_credits", "Krediter")}</th>
            {isAdmin && (
              <>
                <th className="text-left px-3 py-2 font-medium">Modell</th>
                <th className="text-right px-3 py-2 font-medium">USD</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(r.created_at).toLocaleString("sv-SE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-3 py-2">
                {FUNCTION_LABELS[r.function_name] || r.function_name}
              </td>
              <td className="px-3 py-2 text-right font-medium">−{r.credits_used}</td>
              {isAdmin && (
                <>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.model || "—"}</td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {r.cost_usd ? `$${r.cost_usd.toFixed(4)}` : "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
