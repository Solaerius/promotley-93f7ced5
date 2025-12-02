import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: "user" | "admin";
  created_at: string;
  read: boolean;
}

interface ChatSession {
  session_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: string;
}

const AdminChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load all chat sessions
  useEffect(() => {
    loadSessions();

    // Subscribe to new messages
    const channel = supabase
      .channel("admin_chat_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
        },
        () => {
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showClosed]);

  // Load messages for selected session
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);

      // Subscribe to new messages in this session
      const channel = supabase
        .channel(`session:${selectedSession}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "live_chat_messages",
            filter: `session_id=eq.${selectedSession}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => [...prev, newMessage]);
            
            // Mark as read
            if (newMessage.sender_type === "user") {
              markAsRead(newMessage.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("live_chat_messages")
      .select("session_id, message, created_at, read, sender_type")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading sessions:", error);
      return;
    }

    // Get session statuses
    const { data: sessionsData } = await supabase
      .from("live_chat_sessions")
      .select("session_id, status");

    const sessionStatusMap = new Map<string, string>();
    sessionsData?.forEach((s) => {
      sessionStatusMap.set(s.session_id, s.status);
    });

    // Group by session_id
    const sessionMap = new Map<string, ChatSession>();
    
    data?.forEach((msg) => {
      if (!sessionMap.has(msg.session_id)) {
        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          last_message: msg.message,
          last_message_time: msg.created_at,
          unread_count: 0,
          status: sessionStatusMap.get(msg.session_id) || "active",
        });
      }
      
      // Count unread user messages
      if (msg.sender_type === "user" && !msg.read) {
        const session = sessionMap.get(msg.session_id)!;
        session.unread_count++;
      }
    });

    const allSessions = Array.from(sessionMap.values());
    const filteredSessions = showClosed 
      ? allSessions 
      : allSessions.filter(s => s.status === "active");
    
    setSessions(filteredSessions);
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else if (data) {
      setMessages(data as ChatMessage[]);
      
      // Mark all user messages as read
      const unreadIds = data
        .filter((m) => m.sender_type === "user" && !m.read)
        .map((m) => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from("live_chat_messages")
          .update({ read: true })
          .in("id", unreadIds);
      }
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("live_chat_messages")
      .update({ read: true })
      .eq("id", messageId);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedSession) return;

    setIsLoading(true);

    const { error } = await supabase.from("live_chat_messages").insert({
      session_id: selectedSession,
      sender_type: "admin",
      message: inputValue,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelande",
        variant: "destructive",
      });
    } else {
      setInputValue("");
    }

    setIsLoading(false);
  };

  const handleCloseChat = async () => {
    if (!selectedSession || !user) return;

    setIsLoading(true);

    // Check if session exists
    const { data: existingSession } = await supabase
      .from("live_chat_sessions")
      .select("id")
      .eq("session_id", selectedSession)
      .maybeSingle();

    if (existingSession) {
      // Update existing session
      const { error } = await supabase
        .from("live_chat_sessions")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        })
        .eq("session_id", selectedSession);

      if (error) {
        console.error("Error closing chat:", error);
        toast({
          title: "Fel",
          description: "Kunde inte avsluta chatten",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Chatt avslutad",
          description: "Chatten har markerats som avslutad",
        });
        setSelectedSession(null);
        loadSessions();
      }
    } else {
      // Create new session record and close it
      const { error } = await supabase
        .from("live_chat_sessions")
        .insert({
          session_id: selectedSession,
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        });

      if (error) {
        console.error("Error creating closed session:", error);
        toast({
          title: "Fel",
          description: "Kunde inte avsluta chatten",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Chatt avslutad",
          description: "Chatten har markerats som avslutad",
        });
        setSelectedSession(null);
        loadSessions();
      }
    }

    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex gap-4 p-6">
        {/* Sessions List */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b space-y-3">
            <h2 className="text-xl font-bold">Live Chattar</h2>
            <p className="text-sm text-muted-foreground">
              {sessions.length} {showClosed ? "sessioner" : "aktiva sessioner"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowClosed(!showClosed);
                loadSessions();
              }}
              className="w-full"
            >
              {showClosed ? "Visa endast aktiva" : "Visa alla chattar"}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => setSelectedSession(session.session_id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedSession === session.session_id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                      Chatt {session.session_id.slice(0, 8)}
                    </span>
                    {session.status === "closed" && (
                      <span className="ml-auto bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        Avslutad
                      </span>
                    )}
                    {session.unread_count > 0 && session.status === "active" && (
                      <span className="ml-auto bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-bold">
                        {session.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-80 truncate">
                    {session.last_message}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(session.last_message_time).toLocaleString("sv-SE")}
                  </p>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Inga chattar än
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              <div className="p-4 border-b bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Session {selectedSession.slice(0, 8)}
                    </h3>
                    <p className="text-xs opacity-80">
                      {messages.length} meddelanden
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseChat}
                    disabled={isLoading || sessions.find(s => s.session_id === selectedSession)?.status === "closed"}
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Avsluta chatt
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === "admin"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          message.sender_type === "admin"
                            ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_type === "admin"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString(
                            "sv-SE",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isLoading && handleSend()
                    }
                    placeholder="Skriv ditt svar..."
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Välj en session för att börja chatta</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminChat;
