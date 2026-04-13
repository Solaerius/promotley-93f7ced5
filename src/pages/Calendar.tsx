import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Wand2, Trash2, Edit, Loader2, AlertCircle,
  PenLine, Store, CalendarDays, Flag, LayoutGrid,
  ChevronLeft, ChevronRight, Instagram, Facebook, Music2, CalendarCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useCalendar } from "@/hooks/useCalendar";
import { useAIProfile } from "@/hooks/useAIProfile";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import CalendarSkeleton from "@/components/CalendarSkeleton";
import CalendarErrorState from "@/components/CalendarErrorState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type EventType = "inlagg" | "uf_marknad" | "event" | "deadline" | "ovrigt";
type SocialPlatform = "instagram" | "tiktok" | "facebook" | "";

// eventTypeLabels is now built inside the component using t()

const eventTypeColors: Record<EventType, { bg: string; text: string; border: string; dot: string }> = {
  inlagg:    { bg: "bg-pink-500/15",   text: "text-pink-400",   border: "border-pink-500/30",   dot: "bg-pink-500"   },
  uf_marknad:{ bg: "bg-emerald-500/15",text: "text-emerald-400",border: "border-emerald-500/30",dot: "bg-emerald-500"},
  event:     { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", dot: "bg-violet-500" },
  deadline:  { bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30",  dot: "bg-amber-500"  },
  ovrigt:    { bg: "bg-zinc-500/15",   text: "text-zinc-400",   border: "border-zinc-500/30",   dot: "bg-zinc-500"   },
};

const eventTypeIcons: Record<EventType, React.ComponentType<{ className?: string }>> = {
  inlagg:     PenLine,
  uf_marknad: Store,
  event:      CalendarDays,
  deadline:   Flag,
  ovrigt:     LayoutGrid,
};

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  tiktok:    Music2,
  facebook:  Facebook,
};

// monthNames and weekDays are now built inside the component using t()

type FormData = {
  date: string;
  event_type: EventType;
  title: string;
  description: string;
  platform: SocialPlatform;
};

const defaultForm: FormData = { date: "", event_type: "inlagg", title: "", description: "", platform: "" };

const Calendar = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { posts, loading, error, createPost, updatePost, deletePost, fetchPosts, fetchContext } = useCalendar();

  const eventTypeLabels: Record<EventType, string> = useMemo(() => ({
    inlagg:     t('calendar.type_post'),
    uf_marknad: t('calendar.type_market'),
    event:      t('calendar.type_event'),
    deadline:   t('calendar.type_deadline'),
    ovrigt:     t('calendar.type_other'),
  }), [t]);

  const monthNames: string[] = t('calendar.months', { returnObjects: true }) as string[];
  const weekDays: string[]   = t('calendar.weekdays', { returnObjects: true }) as string[];
  const { profile: aiProfile } = useAIProfile();
  const { createConversation } = useConversations();

  const aiProfileFields = [aiProfile?.branch, aiProfile?.malgrupp, aiProfile?.produkt_beskrivning, aiProfile?.malsattning];
  const isAIProfileComplete = aiProfileFields.filter(f => f && String(f).trim() !== "").length >= 3;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const calendarKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const goToPrevMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  const goToNextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  const goToToday = () => {
    const now = new Date();
    setDirection(currentDate > now ? -1 : 1);
    setCurrentDate(now);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const mondayStart = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < mondayStart; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    return days;
  };

  const handleSavePost = async () => {
    if (!formData.date || !formData.event_type || !formData.title) {
      toast({ title: t('calendar.toast_required'), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, {
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          platform: formData.platform || null,
          date: formData.date,
        });
      } else {
        await createPost({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          platform: formData.platform || null,
          date: formData.date,
        });
      }
      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData(defaultForm);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setFormData({
      date: post.date,
      event_type: (post.event_type as EventType) || "inlagg",
      title: post.title,
      description: post.description || "",
      platform: (post.platform as SocialPlatform) || "",
    });
    setIsDialogOpen(true);
  };

  const handleGenerateContentPlan = async () => {
    if (isGeneratingPlan) return;
    setIsGeneratingPlan(true);
    setGenerationProgress(10);
    try {
      const convId = await createConversation("Marknadsföringsplan");
      if (!convId) throw new Error("Kunde inte skapa konversation"); // internal error — not user-facing
      const progressInterval = setInterval(() => setGenerationProgress(prev => Math.min(prev + 8, 85)), 800);
      const planMessage = "Skapa en marknadsföringsplan för kommande 4 veckor. Svara ENBART med en plan i JSON-format."; // AI prompt — stays Swedish
      await supabase.from('ai_chat_messages').insert({ conversation_id: convId, role: 'user', message: planMessage });
      const contextData = await fetchContext();
      const { data: result, error: invokeError } = await supabase.functions.invoke('ai-assistant/chat', {
        method: 'POST',
        body: {
          message: planMessage,
          history: [],
          calendarContextDigest: contextData?.digest || [],
          meta: { action: 'create_marketing_plan', timeframe: { preset: 'next_4_weeks' }, targets: ['reach', 'engagement'], requestId: crypto.randomUUID() },
          conversationId: convId
        }
      });
      if (invokeError) throw invokeError;
      await supabase.from('ai_chat_messages').insert({ conversation_id: convId, role: 'assistant', message: result.response, plan: result.plan || null });
      clearInterval(progressInterval);
      setGenerationProgress(100);
      toast({ title: t('calendar.toast_plan_created'), description: t('calendar.toast_plan_created_desc') });
    } catch (err: any) {
      toast({
        title: t('calendar.toast_error'),
        description: err?.message?.includes('NO_ACTIVE_PLAN') ? t('calendar.toast_no_plan') : t('calendar.toast_plan_failed'),
        variant: "destructive"
      });
    } finally {
      setTimeout(() => { setIsGeneratingPlan(false); setGenerationProgress(0); }, 1500);
    }
  };

  const getPostsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => p.date === dateStr);
  };

  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const upcomingPosts = posts
    .filter(p => new Date(p.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  if (loading) return <DashboardLayout><CalendarSkeleton /></DashboardLayout>;
  if (error) return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('calendar.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('calendar.error_subtitle')}</p>
        </div>
        <CalendarErrorState error={error} onRetry={fetchPosts} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-5 max-w-5xl mx-auto"
      >
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ background: "var(--gradient-text)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              {t('calendar.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('calendar.subtitle')}</p>
          </div>

          <div className="flex flex-col gap-2 items-start lg:items-end">
            {!isAIProfileComplete && (
              <Alert variant="default" className="border-warning/50 bg-warning/5 py-2 px-3">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                <AlertDescription className="text-warning text-xs">
                  {t('calendar.ai_profile_required').split(t('calendar.ai_profile_link'))[0]}
                  <Link to="/account" className="underline font-medium">{t('calendar.ai_profile_link')}</Link>
                  {t('calendar.ai_profile_required').split(t('calendar.ai_profile_link'))[1]}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateContentPlan}
                disabled={!isAIProfileComplete || isGeneratingPlan}
                size="sm"
                className="gap-1.5"
                style={{ background: "var(--gradient-primary)" }}
              >
                {isGeneratingPlan
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Wand2 className="w-3.5 h-3.5" />}
                {isGeneratingPlan ? t('calendar.generating') : t('calendar.generate_plan')}
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingPost(null); setFormData(defaultForm); } }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border/60"
                    onClick={() => { setEditingPost(null); setFormData(defaultForm); }}
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('calendar.add_event')}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                      {editingPost ? t('calendar.edit_event') : t('calendar.new_event')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.date_label')}</Label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.type_label')}</Label>
                        <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v as EventType })}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(eventTypeLabels).map(([k, l]) => (
                              <SelectItem key={k} value={k}>
                                <span className="flex items-center gap-2">
                                  {(() => { const Icon = eventTypeIcons[k as EventType]; return <Icon className="w-3.5 h-3.5" />; })()}
                                  {l}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.title_label')}</Label>
                      <Input
                        placeholder={t('calendar.title_placeholder')}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.desc_label')}</Label>
                      <Textarea
                        placeholder={t('calendar.desc_placeholder')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="text-sm resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('calendar.channel_label')} <span className="normal-case text-muted-foreground/60">{t('calendar.channel_optional')}</span>
                      </Label>
                      <Select value={formData.platform || "__none__"} onValueChange={(v) => setFormData({ ...formData, platform: v === "__none__" ? "" : v as SocialPlatform })}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={t('calendar.no_channel')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('calendar.no_channel')}</SelectItem>
                          <SelectItem value="instagram">
                            <span className="flex items-center gap-2"><Instagram className="w-3.5 h-3.5" /> Instagram</span>
                          </SelectItem>
                          <SelectItem value="tiktok">
                            <span className="flex items-center gap-2"><Music2 className="w-3.5 h-3.5" /> TikTok</span>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <span className="flex items-center gap-2"><Facebook className="w-3.5 h-3.5" /> Facebook</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSavePost} className="w-full" disabled={isSaving} style={{ background: "var(--gradient-primary)" }}>
                      {isSaving
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{editingPost ? t('calendar.updating') : t('calendar.creating')}</>
                        : (editingPost ? t('calendar.update_event') : t('calendar.create_event'))
                      }
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* ── AI generation progress ── */}
        <AnimatePresence>
          {isGeneratingPlan && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                    {t('calendar.generating_plan')}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="h-1.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Calendar panel ── */}
        <div data-tour="calendar-view" className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">
                {monthNames[currentDate.getMonth()]}{" "}
                <span className="text-muted-foreground font-normal">{currentDate.getFullYear()}</span>
              </h2>
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="h-7 text-xs gap-0 px-2"
                >
                  <CalendarCheck className="w-4 h-4 mr-1.5" />{t('calendar.go_to_today')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={goToPrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-1.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={calendarKey}
                custom={direction}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid grid-cols-7 gap-1"
              >
                {getDaysInMonth().map((day, index) => {
                  const dayPosts = day ? getPostsForDate(day) : [];
                  const isToday = day !== null && isCurrentMonth && day === today.getDate();
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.008, 0.18), duration: 0.2 }}
                      className={cn(
                        "min-h-[88px] p-1.5 rounded-xl border transition-colors",
                        day
                          ? isToday
                            ? "bg-primary/8 border-primary/30"
                            : "bg-transparent border-border/20 hover:border-border/40 hover:bg-muted/10"
                          : "border-transparent"
                      )}
                    >
                      {day && (
                        <>
                          <div className="mb-1.5 flex justify-center">
                            {isToday ? (
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
                                {day}
                              </span>
                            ) : (
                              <span className="w-6 h-6 flex items-center justify-center text-xs text-muted-foreground">
                                {day}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {dayPosts.map((post) => {
                              const et = ((post as any).event_type as EventType) || "inlagg";
                              const colors = eventTypeColors[et];
                              const Icon = eventTypeIcons[et];
                              const PlatformIcon = post.platform ? platformIcons[post.platform] : null;
                              return (
                                <motion.div
                                  key={post.id}
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ duration: 0.15 }}
                                  className={cn(
                                    "group relative flex items-center gap-1 rounded-md px-1.5 py-0.5 border cursor-pointer",
                                    colors.bg, colors.border
                                  )}
                                  onClick={() => handleEditPost(post)}
                                >
                                  <Icon className={cn("w-2.5 h-2.5 shrink-0", colors.text)} />
                                  <span className={cn("truncate text-[10px] font-medium flex-1", colors.text)}>
                                    {post.title}
                                  </span>
                                  {PlatformIcon && (
                                    <PlatformIcon className={cn("w-2.5 h-2.5 shrink-0 opacity-60", colors.text)} />
                                  )}
                                  <button
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex shadow-sm"
                                    onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                                  >
                                    <span className="text-[9px] leading-none">×</span>
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Upcoming posts timeline ── */}
        <div className="rounded-2xl bg-card border border-border/40 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {t('calendar.upcoming_events')}
          </h3>

          {upcomingPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">{t('calendar.no_events')}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{t('calendar.add_first_event')}</p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {upcomingPosts.map((post, i) => {
                const et = ((post as any).event_type as EventType) || "inlagg";
                const colors = eventTypeColors[et];
                const Icon = eventTypeIcons[et];
                const PlatformIcon = post.platform ? platformIcons[post.platform] : null;
                const postDate = new Date(post.date);
                const isThisWeek = (postDate.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease: "easeOut" }}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20 hover:bg-muted/20 hover:border-border/40 transition-all"
                  >
                    {/* Color strip */}
                    <div className={cn("w-1 self-stretch rounded-full shrink-0", colors.dot)} />

                    {/* Icon */}
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                      <Icon className={cn("w-4 h-4", colors.text)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        {PlatformIcon && (
                          <PlatformIcon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {postDate.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {isThisWeek && (
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0 rounded-full">
                            {t('calendar.soon')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleEditPost(post)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => deletePost(post.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Calendar;
