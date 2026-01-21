import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sparkles,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Paperclip,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAIProfile } from "@/hooks/useAIProfile";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarketingPlanCard from "@/components/MarketingPlanCard";
import CreditsDisplay from "@/components/CreditsDisplay";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender: "user" | "ai";
  message: string;
  timestamp: Date;
  plan?: any;
}

const AIChat = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { messages, loading, sendMessage, analyzeStats, implementPlan } = useAIAssistant();
  const { credits } = useUserCredits();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const hasInsufficientCredits = credits && credits.credits_left <= 0;
  
  // Check if AI profile has enough fields filled (minimum 3 of 4 key fields)
  const filledFields = aiProfile ? [
    aiProfile.branch,
    aiProfile.malgrupp,
    aiProfile.produkt_beskrivning,
    aiProfile.malsattning
  ].filter(Boolean).length : 0;
  
  const isAIProfileComplete = filledFields >= 3;
  const isAIBlocked = !isAIProfileComplete && !aiProfileLoading;

  const quickCommands = [
    { icon: BarChart3, text: "Analysera min statistik", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, text: "Skapa marknadsföringsplan", color: "from-purple-500 to-pink-500" },
    { icon: FileText, text: "Skriv caption", color: "from-orange-500 to-red-500" },
    { icon: TrendingUp, text: "Skapa 30-dagars strategi", color: "from-green-500 to-emerald-500" },
  ];

  // No longer needed - removed "Skapar plan..." banner

  // Check if user is near bottom of scroll area
  const checkIfNearBottom = () => {
    const element = scrollRef.current;
    if (!element) return false;
    
    const threshold = 80;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return scrollBottom < threshold;
  };

  // Handle scroll events to update near-bottom state
  const handleScroll = () => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && messages.length > 0);
  };

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll only when user is near bottom
  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isNearBottom]);

  // Extract plan from messages (look for plan data in metadata)
  const getLatestPlan = () => {
    // Find the most recent message with a plan
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as any;
      if (msg.plan) {
        return { plan: msg.plan, requestId: msg.requestId || `plan-${msg.id}` };
      }
    }
    return null;
  };

  const handleSendMessage = async (text?: string, meta?: any) => {
    const messageText = text || inputMessage.trim();
    if (!messageText || loading) return;
    
    if (hasInsufficientCredits) {
      toast({
        title: "Otillräckliga krediter",
        description: "Du har slut på krediter. Uppgradera din plan för att fortsätta använda AI-chatten.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage(messageText, meta);
      setInputMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error?.message?.includes('INSUFFICIENT_CREDITS')) {
        toast({
          title: "Otillräckliga krediter",
          description: "Du har inte tillräckligt med krediter för denna förfrågan.",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickCommand = async (command: string) => {
    if (loading) return;
    
    if (hasInsufficientCredits) {
      toast({
        title: "Otillräckliga krediter",
        description: "Du har slut på krediter. Uppgradera din plan för att fortsätta.",
        variant: "destructive",
      });
      return;
    }
    
    switch (command) {
      case "Analysera min statistik":
        // Send as visible message
        await handleSendMessage("Analysera min statistik och ge mig insikter om mina sociala medier-konton.");
        break;
      case "Skapa marknadsföringsplan":
        // Send as visible message with metadata for the AI to understand the intent
        const planMessage = "Skapa en marknadsföringsplan för kommande 4 veckor som maximerar räckvidd och engagemang. Utgå från min kalender och företagsprofil.";
        await handleSendMessage(planMessage, {
          action: 'create_marketing_plan',
          timeframe: { preset: 'next_4_weeks' },
          targets: ['reach', 'engagement'],
          requestId: crypto.randomUUID()
        });
        break;
      case "Skriv caption":
        setInputMessage("Skriv en engagerande caption för mitt nästa inlägg om ");
        break;
      case "Skapa 30-dagars strategi":
        await handleSendMessage("Skapa en 30-dagars strategi för att öka min synlighet på sociala medier. Inkludera konkreta aktiviteter och mål.");
        break;
      default:
        setInputMessage(command);
    }
  };

  const handleImplementPlan = async (plan: any, requestId: string) => {
    // Show confirmation dialog
    setPendingPlan({ plan, requestId });
    setShowConfirmDialog(true);
  };

  const confirmImplementPlan = async () => {
    if (!pendingPlan) return;
    
    setShowConfirmDialog(false);
    try {
      await implementPlan(pendingPlan.plan, pendingPlan.requestId);
      toast({
        title: "Plan implementerad",
        description: `${pendingPlan.plan.posts?.length || 0} inlägg har lagts till i din kalender.`,
      });
    } catch (error) {
      console.error('Error implementing plan:', error);
      toast({
        title: "Fel",
        description: "Kunde inte implementera planen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setPendingPlan(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const latestPlanData = getLatestPlan();

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] min-h-[680px] md:min-h-[780px] flex flex-col animate-fade-in max-w-screen-xl mx-auto">
        {/* Header with Credits integrated */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI-Assistent</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chatta med Promotleys AI för personliga råd
            </p>
          </div>
          <CreditsDisplay variant="compact" />
        </div>

        {/* AI Profile Required Warning */}
        {isAIBlocked && (
          <Alert variant="destructive" className="mb-6 border-2 border-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">AI-profil krävs</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Du måste fylla i minst 3 av följande fält i din AI-profil: bransch, målgrupp, produktbeskrivning och målsättning.
                AI:n behöver denna information för att ge relevanta rekommendationer.
              </p>
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Gå till Inställningar och fyll i AI-profil
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Commands */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {quickCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-start hover:shadow-soft transition-all duration-300 group"
                onClick={() => handleQuickCommand(cmd.text)}
                disabled={loading || isAIBlocked}
                aria-label={cmd.text}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cmd.color} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-left">{cmd.text}</span>
              </Button>
            );
          })}
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden relative rounded-2xl shadow-elegant">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages with proper scroll handling */}
            <div 
              className="flex-1 overflow-y-auto p-4 md:p-6"
              ref={scrollRef}
              onScroll={handleScroll}
              style={{ 
                scrollBehavior: 'auto',
                overflowY: 'scroll',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="space-y-6">
              {messages.map((msg: any, index: number) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`max-w-[80%] lg:max-w-[60%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">Promotley AI</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl p-4 shadow-soft transition-all duration-300 ${
                          msg.role === "user"
                            ? "bg-gradient-primary text-white ml-auto hover:shadow-glow"
                            : "bg-muted text-foreground hover:shadow-elegant"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        ) : (
                          <MarkdownRenderer content={msg.message} />
                        )}
                        <p className={`text-xs mt-2 ${msg.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                          {formatTime(new Date(msg.timestamp))}
                        </p>
                      </div>
                      
                      {/* Render MarketingPlanCard if message contains a plan */}
                      {msg.plan && (
                        <div className="mt-4">
                          <MarketingPlanCard 
                            plan={msg.plan} 
                            onImplement={handleImplementPlan}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator with enhanced animation */}
                {loading && (
                  <div className="flex justify-start animate-fade-in-scale">
                    <div className="max-w-[80%] lg:max-w-[60%]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center animate-pulse">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Promotley AI tänker...</span>
                      </div>
                      <div className="rounded-2xl p-4 bg-muted/80 backdrop-blur-sm shadow-soft">
                        <div className="flex gap-1.5 items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-24 right-8 bg-gradient-primary text-white px-4 py-2 rounded-full shadow-elegant hover:shadow-glow transition-all duration-300 flex items-center gap-2 z-10 animate-in fade-in slide-in-from-bottom-4"
              >
                <span className="text-sm font-medium">Nya meddelanden</span>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                  />
                </svg>
              </button>
            )}

            {/* Insufficient Credits Alert */}
            {hasInsufficientCredits && (
              <div className="border-t border-border p-3 md:p-4">
                <Alert variant="destructive" className="mb-0">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Du har slut på krediter för denna månad.</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/pricing')}
                      className="ml-4"
                    >
                      Uppgradera
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Input Area - Seamless */}
            <div className="border-t border-border/50 p-3 md:p-4 bg-background/50 backdrop-blur-sm">
              <div className="flex gap-2 items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toast({ title: "Filuppladdning", description: "Kommer snart!" })}
                  disabled={hasInsufficientCredits || isAIBlocked}
                  aria-label="Bifoga fil"
                  className="shrink-0 h-9 w-9"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Textarea
                  placeholder={isAIBlocked ? "Fyll i AI-profil först..." : hasInsufficientCredits ? "Inga krediter kvar..." : "Skriv ditt meddelande..."}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !hasInsufficientCredits && !isAIBlocked) {
                      e.preventDefault();
                      handleSendMessage();
                      // Reset height after sending
                      e.currentTarget.style.height = 'auto';
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[150px] resize-none py-2 bg-muted/50 border-0 focus-visible:ring-1"
                  disabled={hasInsufficientCredits || loading || isAIBlocked}
                  aria-label="Meddelande"
                  rows={1}
                />
                <Button
                  variant="gradient"
                  size="icon"
                  onClick={() => {
                    handleSendMessage();
                    // Reset textarea height
                    const textarea = document.querySelector('textarea');
                    if (textarea) textarea.style.height = 'auto';
                  }}
                  disabled={!inputMessage.trim() || loading || hasInsufficientCredits || isAIBlocked}
                  aria-label="Skicka meddelande"
                  className="shrink-0 h-9 w-9"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isAIBlocked
                  ? "Fyll i din AI-profil i Inställningar för att börja chatta"
                  : hasInsufficientCredits 
                  ? "Uppgradera din plan för att fortsätta chatta med AI"
                  : "AI kan göra misstag. Kontrollera viktig information."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for Plan Implementation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Implementera marknadsföringsplan?</DialogTitle>
            <DialogDescription>
              {pendingPlan && (
                <>
                  Vill du lägga in {pendingPlan.plan.posts?.length || 0} inlägg i din kalender mellan{' '}
                  {pendingPlan.plan.timeframe?.start} och {pendingPlan.plan.timeframe?.end}?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Avbryt
            </Button>
            <Button variant="gradient" onClick={confirmImplementPlan}>
              Implementera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AIChat;
