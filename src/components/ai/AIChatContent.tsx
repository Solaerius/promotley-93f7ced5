import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { useConversations } from "@/hooks/useConversations";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { IncompleteProfileModal } from "@/components/IncompleteProfileModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MarketingPlanCard from "@/components/MarketingPlanCard";
import CreditsDisplay from "@/components/CreditsDisplay";
import ChatSidebar from "@/components/ai/ChatSidebar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEvent } from "@/lib/trackEvent";
import { type ModelTier } from "@/lib/modelTiers";
import ModelTierSelector from "@/components/ai/ModelTierSelector";

interface AIChatContentProps {
  prefillMessage?: string | null;
  onPrefillConsumed?: () => void;
}

const AIChatContent = ({ prefillMessage, onPrefillConsumed }: AIChatContentProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loading: convsLoading,
    createConversation,
    deleteConversation,
    fetchConversations,
  } = useConversations();

  const { messages, loading, sendMessage, implementPlan } = useAIAssistant(activeConversationId);
  const { credits } = useUserCredits();
  const { isProfileComplete, missingFields, showModal, setShowModal, requireComplete, loading: profileLoading } = useProfileCompleteness();
  const [inputMessage, setInputMessage] = useState("");
  const [modelTier, setModelTier] = useState<ModelTier>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Handle prefill message from AI tools
  useEffect(() => {
    if (prefillMessage && activeConversationId && !loading) {
      setInputMessage(prefillMessage);
      onPrefillConsumed?.();
    }
  }, [prefillMessage, activeConversationId, loading]);

  const hasInsufficientCredits = credits && credits.credits_left <= 0;

  const isAIBlocked = !isProfileComplete && !profileLoading;

  const quickCommands = [
    { icon: BarChart3, text: "Analysera min statistik", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, text: "Skapa marknadsföringsplan", color: "from-purple-500 to-pink-500" },
    { icon: FileText, text: "Skriv caption", color: "from-orange-500 to-red-500" },
    { icon: TrendingUp, text: "Skapa 30-dagars strategi", color: "from-green-500 to-emerald-500" },
  ];

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
    setShowScrollButton(!nearBottom && messages.length > 0);
  }, [checkIfNearBottom, messages.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, isNearBottom]);

  const ensureConversation = async (): Promise<string | null> => {
    if (activeConversationId) return activeConversationId;
    const id = await createConversation();
    return id;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || hasInsufficientCredits || isSending) return;
    if (!requireComplete()) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSending(true);

    try {
      const convId = await ensureConversation();
      if (!convId) return;
      await sendMessage(messageToSend, { model_tier: modelTier });
      // Refresh conversations to update title/order
      fetchConversations();
    } finally {
      setIsSending(false);
    }

    requestAnimationFrame(() => scrollToBottom());
  };

  const handleQuickCommand = async (command: string) => {
    if (loading || hasInsufficientCredits || isSending) return;
    if (!requireComplete()) return;

    setIsSending(true);
    try {
      const convId = await ensureConversation();
      if (!convId) return;
      await sendMessage(command, { model_tier: modelTier });
      fetchConversations();
    } finally {
      setIsSending(false);
    }

    requestAnimationFrame(() => scrollToBottom());
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

  const handleNewChat = async () => {
    await createConversation();
    trackEvent("chat_new_thread");
    if (isMobile) setShowMobileSidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (isMobile) setShowMobileSidebar(false);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[400px]">
      {/* Sidebar - desktop always visible, mobile toggle */}
      {!isMobile && (
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={deleteConversation}
          loading={convsLoading}
        />
      )}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl"
            >
              <ChatSidebar
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={handleSelectConversation}
                onNew={handleNewChat}
                onDelete={deleteConversation}
                loading={convsLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile sidebar toggle */}
        {isMobile && (
          <div className="flex items-center gap-2 px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="text-white/60 hover:text-white text-xs gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Historik
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="text-white/60 hover:text-white text-xs gap-1.5 ml-auto"
            >
              + Ny chatt
            </Button>
          </div>
        )}

        {/* Warnings */}
        <AnimatePresence>
          {isAIBlocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10 mx-2 cursor-pointer" onClick={() => setShowModal(true)}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Fyll i all obligatorisk företagsinformation för att använda AI-funktioner. <span className="underline font-medium">Klicka här</span>
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
              <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10 mx-2">
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

        {/* Quick Commands - Show only when no messages and no active conversation */}
        <AnimatePresence>
          {messages.length === 0 && !isAIBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 px-2"
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

        {/* Chat Messages */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto px-2 md:px-4 py-4 space-y-4 scroll-smooth"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: msg.isOptimistic ? 0 : 0.05,
                  }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    } ${msg.isOptimistic ? "opacity-80" : ""}`}
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
                      {msg.isOptimistic && " • Skickar..."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
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
                      <motion.span className="w-2 h-2 bg-primary/60 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.span className="w-2 h-2 bg-primary/60 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                      <motion.span className="w-2 h-2 bg-primary/60 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
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
                <Button size="sm" variant="secondary" className="shadow-lg rounded-full px-4" onClick={scrollToBottom}>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Nya meddelanden
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <motion.div className="mt-4 relative px-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <ModelTierSelector value={modelTier} onChange={setModelTier} compact={isMobile} />
            <div className="shrink-0">
              <CreditsDisplay variant="compact" />
            </div>
          </div>
          <div className="flex gap-2 items-end liquid-glass-light rounded-2xl p-2 border border-white/20">
            <Textarea
              ref={textareaRef}
              placeholder={isAIBlocked ? "Fyll i AI-profil först..." : "Skriv ett meddelande..."}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 150) + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={loading || isAIBlocked || hasInsufficientCredits}
              rows={1}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none min-h-[40px] max-h-[150px] overflow-y-auto py-2"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading || isAIBlocked || hasInsufficientCredits || isSending}
                size="icon"
                className="rounded-xl h-10 w-10 shrink-0"
              >
                {loading || isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <IncompleteProfileModal
        open={showModal}
        onOpenChange={setShowModal}
        missingFields={missingFields}
      />
    </div>
  );
};

export default AIChatContent;
