import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Wand2,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Paperclip,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useConversations } from "@/hooks/useConversations";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAIProfile } from "@/hooks/useAIProfile";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarketingPlanCard from "@/components/MarketingPlanCard";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender: "user" | "ai";
  message: string;
  timestamp: Date;
  plan?: any;
}

const AIChat = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    loading: convsLoading,
  } = useConversations();
  const { messages, loading, sendMessage, implementPlan } = useAIAssistant(activeConversationId);
  const { credits } = useUserCredits();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Auto-create or select a conversation on mount
  useEffect(() => {
    if (convsLoading) return;
    if (!activeConversationId && conversations.length === 0) {
      createConversation();
    } else if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [convsLoading, conversations, activeConversationId, createConversation, setActiveConversationId]);

  const hasInsufficientCredits = credits && credits.credits_left <= 0;

  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;

  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const quickCommands = [
    { icon: BarChart3, text: t('chat.quick_analyze'), key: 'analyze' },
    { icon: Calendar, text: t('chat.quick_plan'), key: 'plan' },
    { icon: FileText, text: t('chat.quick_caption'), key: 'caption' },
    { icon: TrendingUp, text: t('chat.quick_strategy'), key: 'strategy' },
  ];

  const checkIfNearBottom = () => {
    const element = scrollRef.current;
    if (!element) return false;
    const threshold = 80;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return scrollBottom < threshold;
  };

  const handleScroll = () => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isNearBottom]);

  const getLatestPlan = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as any;
      if (msg.plan) return { plan: msg.plan, requestId: msg.requestId || `plan-${msg.id}` };
    }
    return null;
  };

  const handleSendMessage = async (text?: string, meta?: any) => {
    const messageText = text || inputMessage.trim();
    if (!messageText || loading) return;

    if (hasInsufficientCredits) {
      toast({ title: t('chat.insufficient_credits_title'), description: t('chat.insufficient_credits_desc'), variant: "destructive" });
      return;
    }

    try {
      await sendMessage(messageText, meta);
      setInputMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error?.message?.includes('INSUFFICIENT_CREDITS')) {
        toast({ title: t('chat.insufficient_credits_title'), description: t('chat.insufficient_credits_desc'), variant: "destructive" });
      }
    }
  };

  const handleQuickCommand = async (command: string, key?: string) => {
    if (loading) return;
    if (hasInsufficientCredits) {
      toast({ title: t('chat.insufficient_credits_title'), description: t('chat.insufficient_credits_desc'), variant: "destructive" });
      return;
    }

    switch (key) {
      case 'analyze':
        await handleSendMessage("Analysera min statistik och ge mig insikter om mina sociala medier-konton.");
        break;
      case 'plan':
        await handleSendMessage(
          "Skapa en marknadsföringsplan för kommande 4 veckor som maximerar räckvidd och engagemang. Utgå från min kalender och företagsprofil.",
          { action: 'create_marketing_plan', timeframe: { preset: 'next_4_weeks' }, targets: ['reach', 'engagement'], requestId: crypto.randomUUID() }
        );
        break;
      case 'caption':
        setInputMessage("Skriv en engagerande caption för mitt nästa inlägg om ");
        break;
      case 'strategy':
        await handleSendMessage("Skapa en 30-dagars strategi för att öka min synlighet på sociala medier. Inkludera konkreta aktiviteter och mål.");
        break;
      default:
        setInputMessage(command);
    }
  };

  const handleImplementPlan = async (plan: any, requestId: string) => {
    setPendingPlan({ plan, requestId });
    setShowConfirmDialog(true);
  };

  const confirmImplementPlan = async () => {
    if (!pendingPlan) return;
    setShowConfirmDialog(false);
    try {
      await implementPlan(pendingPlan.plan, pendingPlan.requestId);
      toast({ title: t('chat.plan_implemented_title'), description: t('chat.plan_implemented_desc', { count: pendingPlan.plan.posts?.length || 0 }) });
    } catch (error) {
      console.error('Error implementing plan:', error);
      toast({ title: t('chat.implement_error_title'), description: t('chat.implement_error_desc'), variant: "destructive" });
    } finally {
      setPendingPlan(null);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] min-h-[680px] md:min-h-[780px] flex flex-col max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('chat.title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('chat.subtitle')}</p>
          </div>
        </div>

        {/* AI Profile Warning */}
        {isAIBlocked && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-medium">{t('chat.profile_required_title')}</AlertTitle>
            <AlertDescription className="mt-1">
              <p className="text-sm mb-2">{t('chat.profile_required_desc')}</p>
              <Button onClick={() => navigate('/account')} variant="outline" size="sm">
                {t('chat.go_to_settings')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Commands */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {quickCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <button
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all whitespace-nowrap text-xs font-medium text-muted-foreground disabled:opacity-40 shrink-0"
                onClick={() => handleQuickCommand(cmd.text, cmd.key)}
                disabled={loading || isAIBlocked}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {cmd.text}
              </button>
            );
          })}
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-card border border-border/40">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 md:p-6"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className="space-y-4">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] lg:max-w-[65%]`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                          <Wand2 className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Promotley AI</span>
                      </div>
                    )}
                    <div className={`rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "border border-border/60 bg-card rounded-bl-sm text-foreground"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      ) : (
                        <MarkdownRenderer content={msg.message} />
                      )}
                      <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatTime(new Date(msg.timestamp))}
                      </p>
                    </div>

                    {msg.plan && (
                      <div className="mt-3">
                        <MarketingPlanCard plan={msg.plan} onImplement={handleImplementPlan} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] lg:max-w-[65%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                        <Wand2 className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{t('chat.thinking')}</span>
                    </div>
                    <div className="rounded-xl px-4 py-3 border border-border/60 bg-card rounded-bl-sm">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scroll to bottom */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-8 bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow flex items-center gap-1.5 z-10 text-sm"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {t('chat.new_messages')}
            </button>
          )}

          {/* Insufficient Credits */}
          {hasInsufficientCredits && (
            <div className="border-t border-border/40 p-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">{t('chat.no_credits')}</span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')} className="ml-4">{t('chat.upgrade')}</Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border/40 p-3 md:p-4">
            <div className="flex gap-2 items-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast({ title: t('chat.file_upload_title'), description: t('chat.file_upload_desc') })}
                disabled={hasInsufficientCredits || isAIBlocked}
                className="shrink-0 h-9 w-9"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Textarea
                placeholder={isAIBlocked ? t('chat.placeholder_blocked') : hasInsufficientCredits ? t('chat.placeholder_no_credits') : t('chat.placeholder')}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !hasInsufficientCredits && !isAIBlocked) {
                    e.preventDefault();
                    handleSendMessage();
                    e.currentTarget.style.height = 'auto';
                  }
                }}
                className="flex-1 min-h-[40px] max-h-[150px] resize-none py-2 bg-muted border-0 focus-visible:ring-1"
                disabled={hasInsufficientCredits || loading || isAIBlocked}
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => {
                  handleSendMessage();
                  const textarea = document.querySelector('textarea');
                  if (textarea) textarea.style.height = 'auto';
                }}
                disabled={!inputMessage.trim() || loading || hasInsufficientCredits || isAIBlocked}
                className="shrink-0 h-9 w-9"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              {isAIBlocked
                ? t('chat.footer_blocked')
                : hasInsufficientCredits
                ? t('chat.footer_no_credits')
                : t('chat.footer_normal')}
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('chat.implement_dialog_title')}</DialogTitle>
            <DialogDescription>
              {pendingPlan && (
                <>{t('chat.implement_dialog_desc', { count: pendingPlan.plan.posts?.length || 0, start: pendingPlan.plan.timeframe?.start, end: pendingPlan.plan.timeframe?.end })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>{t('chat.cancel')}</Button>
            <Button onClick={confirmImplementPlan}>{t('chat.implement')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AIChat;
