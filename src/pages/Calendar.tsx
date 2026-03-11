import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarIcon, Plus, Sparkles, Trash2, Edit, Loader2, AlertCircle } from "lucide-react";
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

interface CalendarPost {
  id: string;
  date: string;
  platform: string;
  title: string;
  description: string;
  event_type?: string;
}

type EventType = "inlagg" | "uf_marknad" | "event" | "deadline" | "ovrigt";

const eventTypeLabels: Record<EventType, string> = {
  inlagg: "Inlägg",
  uf_marknad: "UF-marknad",
  event: "Event/aktivitet",
  deadline: "Deadline",
  ovrigt: "Övrigt",
};

const eventTypeColors: Record<EventType, string> = {
  inlagg: "bg-pink-500",
  uf_marknad: "bg-green-500",
  event: "bg-blue-500",
  deadline: "bg-orange-500",
  ovrigt: "bg-gray-500",
};

const Calendar = () => {
  const { toast } = useToast();
  const { posts, loading, error, hasPosts, createPost, updatePost, deletePost, fetchPosts } = useCalendar();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const { createConversation } = useConversations();

  // Check if AI profile is complete (at least 3 of 4 key fields)
  const aiProfileFields = [
    aiProfile?.branch,
    aiProfile?.malgrupp,
    aiProfile?.produkt_beskrivning,
    aiProfile?.malsattning,
  ];
  const filledAIFields = aiProfileFields.filter(f => f && String(f).trim() !== "").length;
  const isAIProfileComplete = filledAIFields >= 3;
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [formData, setFormData] = useState({
    date: "",
    platform: "inlagg",
    title: "",
    description: "",
  });

  // Generera kalenderdagar
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    // Convert Sunday=0 to Monday-start: Mon=0, Tue=1, ..., Sun=6
    const mondayStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    // Lägg till tomma platser för dagar före månadens start
    for (let i = 0; i < mondayStart; i++) {
      days.push(null);
    }
    // Lägg till alla dagar i månaden
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleSavePost = async () => {
    if (!formData.date || !formData.platform || !formData.title) {
      toast({
        title: "Felaktiga uppgifter",
        description: "Fyll i alla obligatoriska fält",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, formData);
      } else {
        await createPost(formData);
      }
      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({ date: "", platform: "inlagg", title: "", description: "" });
    } catch (err: any) {
      console.error('Error saving post:', err);
      // Toast already shown by hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setFormData(post);
    setIsDialogOpen(true);
  };

  const handleGenerateContentPlan = async () => {
    if (isGeneratingPlan) return;
    setIsGeneratingPlan(true);
    setGenerationProgress(10);
    
    try {
      const convId = await createConversation("Marknadsföringsplan");
      if (!convId) throw new Error("Kunde inte skapa konversation");

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 8, 85));
      }, 800);

      const planMessage = "Skapa en marknadsföringsplan för kommande 4 veckor som maximerar räckvidd och engagemang. Utgå från min kalender och företagsprofil. Svara ENBART med en plan i JSON-format.";

      await supabase.from('ai_chat_messages').insert({
        conversation_id: convId, role: 'user', message: planMessage,
      });

      const { data: contextData } = await supabase.functions.invoke('calendar/context');
      const { data: result, error: invokeError } = await supabase.functions.invoke('ai-assistant/chat', {
        method: 'POST',
        body: {
          message: planMessage, history: [],
          calendarContextDigest: contextData?.digest || [],
          meta: { action: 'create_marketing_plan', timeframe: { preset: 'next_4_weeks' }, targets: ['reach', 'engagement'], requestId: crypto.randomUUID() },
          conversationId: convId,
        }
      });
      if (invokeError) throw invokeError;

      await supabase.from('ai_chat_messages').insert({
        conversation_id: convId, role: 'assistant', message: result.response, plan: result.plan || null,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      toast({
        title: "Plan skapad!",
        description: "Din AI-marknadsföringsplan har genererats. Kolla AI-chatten för detaljer.",
      });
    } catch (err: any) {
      console.error("AI plan generation failed:", err);
      toast({
        title: "Fel",
        description: err?.message?.includes('NO_ACTIVE_PLAN')
          ? "Du behöver ett aktivt paket för att använda AI."
          : "Kunde inte generera plan. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGeneratingPlan(false);
        setGenerationProgress(0);
      }, 1500);
    }
  };

  const getPostsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => p.date === dateStr);
  };

  const monthNames = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December"
  ];

  const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  if (loading) {
    return (
      <DashboardLayout>
        <CalendarSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Innehållskalender</h1>
            <p className="text-muted-foreground">
              Planera dina inlägg och håll koll på din content-strategi
            </p>
          </div>
          <CalendarErrorState error={error} onRetry={fetchPosts} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-tour="calendar-view" className="space-y-4 animate-fade-in">
        {/* Header - Force dark mode colors */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground mb-0.5">Innehållskalender</h1>
            <p className="text-sm text-muted-foreground">
              Planera dina inlägg och håll koll på din content-strategi
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {!isAIProfileComplete && (
              <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                  Fyll i din{" "}
                  <Link to="/account" className="underline font-medium">
                    AI-profil
                  </Link>{" "}
                  för att använda AI.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button 
                variant="gradient" 
                onClick={handleGenerateContentPlan}
                disabled={!isAIProfileComplete || isGeneratingPlan}
              >
                {isGeneratingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGeneratingPlan ? "Genererar..." : isAIProfileComplete ? "Skapa plan med AI" : "Fyll i AI-profil"}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => { setEditingPost(null); setFormData({ date: "", platform: "inlagg", title: "", description: "" }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till händelse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPost ? "Redigera händelse" : "Ny händelse"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Typ</Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj typ" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      placeholder="Inläggstitel"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivning</Label>
                    <Textarea
                      id="description"
                      placeholder="Beskriv innehållet"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSavePost} className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingPost ? "Uppdaterar..." : "Skapar..."}
                      </>
                    ) : (
                      editingPost ? "Uppdatera" : "Skapa"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* AI Generation Progress */}
        {isGeneratingPlan && (
          <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Skapar din marknadsföringsplan...</span>
              <span className="text-muted-foreground">{Math.round(generationProgress)}%</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Du kan fortsätta kolla runt i Promotely medan vi skapar din personliga plan.
            </p>
          </div>
        )}

        {/* Calendar Controls - Glass card */}
        <div className="rounded-xl bg-card shadow-sm p-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  Föregående
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Idag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  Nästa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold text-xs text-muted-foreground p-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const dayPosts = day ? getPostsForDate(day) : [];
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-[76px] p-1.5 rounded-lg border transition-colors ${
                      day
                        ? isToday
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-muted border-border"
                        : "bg-transparent border-transparent"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-sm font-semibold mb-2">{day}</div>
                        <div className="space-y-1">
                          {dayPosts.map((post) => {
                            const eventType = (post as any).event_type as EventType || 'inlagg';
                            const colorClass = eventTypeColors[eventType] || 'bg-gray-500';
                            return (
                              <div
                                key={post.id}
                                className={`${colorClass} text-white text-xs p-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity group relative`}
                                onClick={() => handleEditPost(post)}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="truncate flex-1">{post.title}</span>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-white hover:text-red-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePost(post.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </div>

        {/* Upcoming posts - Glass card */}
        <div className="rounded-xl bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Kommande inlägg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {posts
                .filter(p => new Date(p.date) >= new Date(new Date().toDateString()))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((post) => {
                  const eventType = (post as any).event_type as EventType || 'inlagg';
                  const colorClass = eventTypeColors[eventType] || 'bg-gray-500';
                  return (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditPost(post)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {posts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Inga planerade inlägg ännu. Lägg till ditt första!
                </p>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
