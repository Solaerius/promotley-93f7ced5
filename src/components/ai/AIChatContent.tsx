import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAIProfile } from "@/hooks/useAIProfile";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarketingPlanCard from "@/components/MarketingPlanCard";
import CreditsDisplay from "@/components/CreditsDisplay";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Extended message type for UI
interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
  isOptimistic?: boolean;
  plan?: any;
}

const AIChatContent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { messages, loading, sendMessage, implementPlan } = useAIAssistant();
  const { credits } = useUserCredits();
  const { profile: aiProfile, loading: aiProfileLoading } = useAIProfile();
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<DisplayMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  
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
    { icon: BarChart3, text: "Analysera min statistik", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, text: "Skapa marknadsföringsplan", color: "from-purple-500 to-pink-500" },
    { icon: FileText, text: "Skriv caption", color: "from-orange-500 to-red-500" },
    { icon: TrendingUp, text: "Skapa 30-dagars strategi", color: "from-green-500 to-emerald-500" },
  ];

  // Combine real messages with optimistic ones
  const allMessages = [...messages, ...optimisticMessages.filter(om => 
    !messages.some(m => m.message === om.message && m.role === om.role)
  )];

  const checkIfNearBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return false;
    const threshold = 80;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return scrollBottom < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && allMessages.length > 0);
  }, [checkIfNearBottom, allMessages.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [allMessages, isNearBottom]);

  // Clear optimistic messages when real messages update
  useEffect(() => {
    if (!loading && optimisticMessages.length > 0) {
      setOptimisticMessages([]);
    }
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || isAIBlocked || hasInsufficientCredits || isSending) return;
    
    const messageToSend = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    
    // Immediately add optimistic message
    const optimisticMsg: DisplayMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      message: messageToSend,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    
    // Scroll to bottom immediately
    requestAnimationFrame(() => scrollToBottom());
    
    try {
      await sendMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickCommand = async (command: string) => {
    if (loading || isAIBlocked || hasInsufficientCredits || isSending) return;
    
    setIsSending(true);
    
    // Add optimistic message
    const optimisticMsg: DisplayMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      message: command,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    requestAnimationFrame(() => scrollToBottom());
    
    try {
      await sendMessage(command);
    } finally {
      setIsSending(false);
    }
  };

  const handleImplementPlan = async (plan: any, requestId: string): Promise<void> => {
    await implementPlan(plan, requestId);
    toast({
      title: "Plan implementerad",
      description: "Inläggen har lagts till i din kalender",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Warnings - Minimal style */}
      <AnimatePresence>
        {isAIBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fyll i minst 3 fält i din AI-profil under Konto för att använda AI-chatten.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {hasInsufficientCredits && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Du har slut på krediter</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                  Fyll på
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Commands - Show only when no messages */}
      <AnimatePresence>
        {allMessages.length === 0 && !isAIBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 dashboard-heading-dark">Hur kan jag hjälpa dig?</h2>
              <p className="dashboard-subheading-dark">Välj ett snabbkommando eller skriv ditt eget meddelande</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {quickCommands.map((cmd, index) => (
                <motion.div
                  key={cmd.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className="h-auto py-3 px-3 w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                    onClick={() => handleQuickCommand(cmd.text)}
                    disabled={loading || hasInsufficientCredits || isSending}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <cmd.icon className="w-4 h-4 text-white/80" />
                    </div>
                    <span className="text-xs text-left text-white/80">{cmd.text}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages - Full width, no box */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-2 md:px-4 py-4 space-y-4 scroll-smooth"
        >
          <AnimatePresence mode="popLayout">
            {allMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: 'isOptimistic' in msg && msg.isOptimistic ? 0 : 0.05
                }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  } ${'isOptimistic' in msg && msg.isOptimistic ? "opacity-80" : ""}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownRenderer content={msg.message} />
                      {msg.plan && (
                        <div className="mt-4">
                          <MarketingPlanCard plan={msg.plan} onImplement={handleImplementPlan} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  )}
                  <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    {'isOptimistic' in msg && msg.isOptimistic && " • Skickar..."}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator - Typing animation */}
          <AnimatePresence>
            {loading && !isSending && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <motion.span 
                      className="w-2 h-2 bg-primary/60 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span 
                      className="w-2 h-2 bg-primary/60 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.span 
                      className="w-2 h-2 bg-primary/60 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2"
            >
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg rounded-full px-4"
                onClick={scrollToBottom}
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                Nya meddelanden
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input - Modern floating style */}
      <motion.div 
        className="mt-4 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-2 items-center liquid-glass-light rounded-2xl p-2 border border-white/20">
          <Input
            placeholder={isAIBlocked ? "Fyll i AI-profil först..." : "Skriv ett meddelande..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isAIBlocked || hasInsufficientCredits}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading || isAIBlocked || hasInsufficientCredits || isSending}
              size="icon"
              className="rounded-xl h-10 w-10 shrink-0"
            >
              {loading || isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
        
        {/* Credits Display - Subtle */}
        <div className="absolute -top-8 right-0">
          <CreditsDisplay variant="compact" />
        </div>
      </motion.div>
    </div>
  );
};

export default AIChatContent;
