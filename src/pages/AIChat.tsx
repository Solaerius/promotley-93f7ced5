import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  Paperclip,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistant } from "@/hooks/useAIAssistant";

interface Message {
  id: string;
  sender: "user" | "ai";
  message: string;
  timestamp: Date;
}

const AIChat = () => {
  const { toast } = useToast();
  const { messages, loading, sendMessage, generatePlan, analyzeStats } = useAIAssistant();
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    { icon: BarChart3, text: "Analysera min statistik", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, text: "Skapa marknadsföringsplan", color: "from-purple-500 to-pink-500" },
    { icon: FileText, text: "Skriv caption", color: "from-orange-500 to-red-500" },
    { icon: TrendingUp, text: "Skapa 30-dagars strategi", color: "from-green-500 to-emerald-500" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputMessage.trim();
    if (!messageText || loading) return;

    try {
      await sendMessage(messageText);
      setInputMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickCommand = async (command: string) => {
    if (loading) return;
    
    switch (command) {
      case "Analysera min statistik":
        await analyzeStats();
        break;
      case "Skapa marknadsföringsplan":
        await generatePlan();
        break;
      default:
        setInputMessage(command);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">AI-Assistent</h1>
          <p className="text-muted-foreground">
            Chatta med Promotleys AI för personliga råd och insikter
          </p>
        </div>

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
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Meddelanden med inbyggd scrollbar */}
            <div
              className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent"
              ref={scrollRef}
            >
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                        className={`rounded-2xl p-4 shadow-soft ${
                          msg.role === "user"
                            ? "bg-gradient-primary text-white ml-auto"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-2 ${msg.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                          {formatTime(new Date(msg.timestamp))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] lg:max-w-[60%]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">Promotley AI</span>
                      </div>
                      <div className="rounded-2xl p-4 bg-muted">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast({ title: "Filuppladdning", description: "Kommer snart!" })}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Skriv ditt meddelande..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  variant="gradient"
                  size="icon"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI kan göra misstag. Kontrollera viktig information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIChat;
