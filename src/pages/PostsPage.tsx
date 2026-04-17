import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoonBadge } from "@/components/ComingSoonBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  description: string | null;
  date: string;
  platform: string;
  event_type: string;
}

const PLATFORMS = ["instagram", "tiktok", "facebook", "linkedin", "annat"];

export default function PostsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [editing, setEditing] = useState<Post | null>(null);
  const [improving, setImproving] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    let q = supabase
      .from("calendar_posts")
      .select("id, title, description, date, platform, event_type")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);
    if (filterPlatform !== "all") q = q.eq("platform", filterPlatform);
    const { data } = await q;
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id, filterPlatform]);

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("calendar_posts")
      .update({
        title: editing.title,
        description: editing.description,
        date: editing.date,
        platform: editing.platform,
      })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Kunde inte spara", variant: "destructive" });
      return;
    }
    toast({ title: "Sparat" });
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!editing) return;
    const { error } = await supabase.from("calendar_posts").delete().eq("id", editing.id);
    if (error) {
      toast({ title: "Kunde inte radera", variant: "destructive" });
      return;
    }
    toast({ title: "Inlägg raderat" });
    setEditing(null);
    load();
  };

  const handleImprove = async () => {
    if (!editing) return;
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-suggestion", {
        body: {
          idea: editing.title,
          platform: editing.platform,
          existing_caption: editing.description,
          model_tier: "standard",
        },
      });
      if (error) throw error;
      if (data?.suggestion?.caption) {
        setEditing({ ...editing, description: data.suggestion.caption });
        toast({ title: "Förbättrad med AI" });
      }
    } catch {
      toast({ title: "AI kunde inte förbättra", variant: "destructive" });
    } finally {
      setImproving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("posts.title", "Hantera inlägg")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("posts.subtitle", "Redigera planerade inlägg och förbättra dem med AI.")}
            </p>
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla plattformar</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("posts.empty", "Du har inga planerade inlägg än. Skapa via kalendern.")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => setEditing(p)}
                className="w-full text-left rounded-xl border border-border bg-card hover:bg-accent/40 transition p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {p.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate text-foreground">{p.title}</p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {p.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("posts.edit_title", "Redigera inlägg")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Titel</label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Innehåll</label>
                <Textarea
                  rows={6}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Datum</label>
                  <Input
                    type="date"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Plattform</label>
                  <Select
                    value={editing.platform}
                    onValueChange={(v) => setEditing({ ...editing, platform: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleImprove} disabled={improving}>
                {improving ? "Förbättrar…" : "Förbättra med AI"}
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border text-xs text-muted-foreground">
                Publicera nu <ComingSoonBadge />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                Radera
              </Button>
              <Button size="sm" onClick={handleSave}>Spara</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
