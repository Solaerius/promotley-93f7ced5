import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Flag {
  id: string;
  flag_key: string;
  description: string | null;
  enabled_globally: boolean;
  user_id: string | null;
}

const KNOWN_FLAGS = [
  { key: "video_upload", desc: "Ladda upp och spara videofiler" },
  { key: "video_ai_analysis", desc: "AI-analys av video (ämne, hashtags, sound)" },
  { key: "auto_publish_meta", desc: "Auto-publicering till Instagram/Facebook" },
  { key: "auto_publish_tiktok", desc: "Auto-publicering till TikTok" },
  { key: "tiktok_sound_library", desc: "Sound-bibliotek från TikTok" },
  { key: "sales_radar_web_search", desc: "Säljradar med webb-sökning" },
];

export default function AdminFeatureFlags() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feature_flags")
      .select("id, flag_key, description, enabled_globally, user_id")
      .is("user_id", null)
      .order("flag_key");
    setFlags((data as Flag[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const seedKnown = async () => {
    const existing = new Set(flags.map((f) => f.flag_key));
    const toInsert = KNOWN_FLAGS.filter((k) => !existing.has(k.key)).map((k) => ({
      flag_key: k.key,
      description: k.desc,
      enabled_globally: false,
      user_id: null,
    }));
    if (toInsert.length === 0) {
      toast({ title: "Alla kända flaggor finns redan" });
      return;
    }
    const { error } = await supabase.from("feature_flags").insert(toInsert);
    if (error) {
      toast({ title: "Kunde inte skapa", variant: "destructive" });
      return;
    }
    toast({ title: `${toInsert.length} flaggor skapade` });
    load();
  };

  const toggle = async (flag: Flag, value: boolean) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled_globally: value })
      .eq("id", flag.id);
    if (error) {
      toast({ title: "Kunde inte uppdatera", variant: "destructive" });
      return;
    }
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, enabled_globally: value } : f)));
  };

  const createCustom = async () => {
    if (!newKey.trim()) return;
    const { error } = await supabase.from("feature_flags").insert({
      flag_key: newKey.trim(),
      description: newDesc.trim() || null,
      enabled_globally: false,
      user_id: null,
    });
    if (error) {
      toast({ title: "Kunde inte skapa", variant: "destructive" });
      return;
    }
    setNewKey("");
    setNewDesc("");
    load();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Feature Flags</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Slå på/av "kommer snart"-funktioner globalt. Admins ser alltid funktioner i sandbox-läge.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
          <h2 className="text-sm font-semibold">Skapa flagga</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="flag_key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <Input className="md:col-span-2" placeholder="Beskrivning" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createCustom}>Skapa</Button>
            <Button size="sm" variant="outline" onClick={seedKnown}>Skapa kända flaggor</Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : flags.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Inga flaggor än. Klicka "Skapa kända flaggor".</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium text-foreground">{f.flag_key}</p>
                  {f.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  )}
                </div>
                <Switch checked={f.enabled_globally} onCheckedChange={(v) => toggle(f, v)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
