import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || isAIBlocked || hasInsufficientCredits) return;
    const messageToSend = inputMessage;
    setInputMessage("");
    await sendMessage(messageToSend);
  };

  const handleQuickCommand = async (command: string) => {
    if (loading || isAIBlocked || hasInsufficientCredits) return;
    await sendMessage(command);
  };

  const handleImplementPlan = async (plan: any, requestId: string): Promise<void> => {
    await implementPlan(plan, requestId);
    toast({
      title: "Plan implementerad",
      description: "Inläggen har lagts till i din kalender",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Credits Display */}
      <div className="mb-4">
        <CreditsDisplay variant="compact" />
      </div>

      {/* Warnings */}
      {isAIBlocked && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fyll i minst 3 fält i din AI-profil under Konto för att använda AI-chatten.
          </AlertDescription>
        </Alert>
      )}

      {hasInsufficientCredits && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Du har slut på krediter</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
              Fyll på
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Commands */}
      {messages.length === 0 && !isAIBlocked && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.text}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform"
              onClick={() => handleQuickCommand(cmd.text)}
              disabled={loading || hasInsufficientCredits}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${cmd.color} flex items-center justify-center`}>
                <cmd.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-center">{cmd.text}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-hidden relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
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
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  )}
                  <p className="text-[10px] opacity-60 mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">AI tänker...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
            onClick={scrollToBottom}
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Nya meddelanden
          </Button>
        )}
      </Card>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Input
          placeholder={isAIBlocked ? "Fyll i AI-profil först..." : "Skriv ett meddelande..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={loading || isAIBlocked || hasInsufficientCredits}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || loading || isAIBlocked || hasInsufficientCredits}
          size="icon"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

    </div>
  );
};

export default AIChatContent;
