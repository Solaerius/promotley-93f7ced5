import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  sender_id: string | null;
  read: boolean;
  created_at: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [autoReplyHasBeenSent, setAutoReplyHasBeenSent] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  
  // New refs for robust realtime
  const gotRealtimeEventRef = useRef(false);
  const sanityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noEventWarningRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTickCountRef = useRef(0);

  // Draggable and resizable state - smaller initial size
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 474 }); // bottom-6 right-6
  const [size, setSize] = useState({ width: 340, height: 450 }); // Smaller initial size
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 280;
  const MAX_WIDTH = 600;
  const MIN_HEIGHT = 350;
  const MAX_HEIGHT = window.innerHeight - 100;

  // Load or create session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("live_chat_session_id");
    const autoReplySent = localStorage.getItem("live_chat_auto_reply_sent");
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setAutoReplyHasBeenSent(autoReplySent === "true");
      checkSessionStatus(savedSessionId);
    } else {
      // Create new session
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("live_chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Check if session is closed
  const checkSessionStatus = async (sessId: string) => {
    const { data } = await supabase
      .from("live_chat_sessions")
      .select("status")
      .eq("session_id", sessId)
      .maybeSingle();
    
    if (data?.status === "closed") {
      setIsChatClosed(true);
    }
  };

  // Polling fallback - runs every 3-5 seconds
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    
    console.log("🔄 Starting polling fallback (every 4s)");
    setConnectionStatus('disconnected');
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId) return;
      
      pollingTickCountRef.current++;
      console.log(`📊 Polling tick #${pollingTickCountRef.current}`);
      
      try {
        const { data, error } = await supabase
          .from("live_chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .gt("created_at", lastMessageTimestampRef.current || new Date(0).toISOString())
          .order("created_at", { ascending: true });
        
        if (error) {
          console.error("❌ Polling error:", error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ Polling: Found ${data.length} new message(s)`, data);
          setMessages((prev) => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.filter(m => !existingIds.has(m.id) && !m.id.startsWith('temp-'));
            if (newMessages.length > 0) {
              return [...prev.filter(m => !m.id.startsWith('temp-')), ...newMessages];
            }
            return prev;
          });
          lastMessageTimestampRef.current = data[data.length - 1].created_at;
        } else {
          console.log("📊 Polling: No new messages");
        }
        
        // Also check for session closure
        const { data: sessionData } = await supabase
          .from("live_chat_sessions")
          .select("status")
          .eq("session_id", sessionId)
          .maybeSingle();
        
        if (sessionData?.status === "closed") {
          setIsChatClosed(true);
        }
      } catch (err) {
        console.error("❌ Polling exception:", err);
      }
    }, 4000); // 4 second interval
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("⏹️ Stopping polling");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Force reload messages (sanity check)
  const forceReloadMessages = async () => {
    if (!sessionId) return;
    
    console.log("🔄 Force reloading messages (sanity check)");
    const { data } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .gt("created_at", lastMessageTimestampRef.current || new Date(0).toISOString())
      .order("created_at", { ascending: true });
    
    if (data && data.length > 0) {
      console.log(`✅ Sanity check: Found ${data.length} new message(s)`);
      setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id));
        const fresh = data.filter(m => !existingIds.has(m.id));
        return [...prev.filter(m => !m.id.startsWith('temp-')), ...fresh];
      });
      lastMessageTimestampRef.current = data[data.length - 1].created_at;
    }
  };

  // Load messages when session is ready
  useEffect(() => {
    if (!sessionId) return;

    // Reset refs for new session
    gotRealtimeEventRef.current = false;
    pollingTickCountRef.current = 0;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMessages(data || []);
        if (data && data.length > 0) {
          lastMessageTimestampRef.current = data[data.length - 1].created_at;
        }
      }
      
      // CRITICAL: Start polling immediately as fallback
      startPolling();
      
      // Sanity timer: force reload after 10s if no realtime events
      sanityTimerRef.current = setTimeout(() => {
        if (!gotRealtimeEventRef.current) {
          console.log("⚠️ No realtime events after 10s, force reloading");
          forceReloadMessages();
        }
      }, 10000);
      
      // Warning timer: log if no events after 30s despite SUBSCRIBED
      noEventWarningRef.current = setTimeout(() => {
        if (!gotRealtimeEventRef.current) {
          console.warn("⚠️ WARNING: 30 seconds without any Realtime events!");
          console.warn("Check that:");
          console.warn("1. Table 'live_chat_messages' is in publication supabase_realtime");
          console.warn("2. RLS SELECT policy allows this client to see the rows");
          console.warn("3. Network is not blocking WebSocket connections");
        }
      }, 30000);
    };

    loadMessages();

    // Subscribe to realtime updates
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupRealtimeSubscription = () => {
      console.log("📡 Setting up Realtime subscription for session:", sessionId);
      
      const channel = supabase
        .channel(`live_chat_${sessionId}_${Date.now()}`) // Unique channel name
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "live_chat_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            console.log("✅ Realtime INSERT event received!", payload.new);
            
            // Mark that we received a realtime event
            gotRealtimeEventRef.current = true;
            
            // Stop polling since realtime is working
            stopPolling();
            setConnectionStatus('connected');
            
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              // Check for duplicates and remove temp messages
              const filtered = prev.filter(m => 
                m.id !== newMessage.id && !m.id.startsWith('temp-')
              );
              return [...filtered, newMessage];
            });
            lastMessageTimestampRef.current = newMessage.created_at;
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "live_chat_sessions",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload: any) => {
            console.log("✅ Realtime session UPDATE event received!", payload.new);
            gotRealtimeEventRef.current = true;
            stopPolling();
            setConnectionStatus('connected');
            
            if (payload.new?.status === "closed") {
              setIsChatClosed(true);
            }
          }
        )
        .subscribe((status, err) => {
          console.log("📡 Realtime subscription status:", status, err ? `Error: ${err}` : '');
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connecting'); // Stay connecting until we get an actual event
            console.log("✅ Subscribed to Realtime, waiting for first event...");
            // Note: We do NOT stop polling here - wait for actual event
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn("⚠️ Realtime channel error/timeout, ensuring polling is active");
            setConnectionStatus('disconnected');
            startPolling();
            
            // Retry connection
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 Retrying realtime connection (${retryCount}/${maxRetries})`);
              setTimeout(() => {
                supabase.removeChannel(channel);
                setupRealtimeSubscription();
              }, 2000 * retryCount);
            }
          } else if (status === 'CLOSED') {
            console.log("📡 Realtime channel closed");
            setConnectionStatus('disconnected');
            startPolling();
          }
        });
      
      return channel;
    };

    const channel = setupRealtimeSubscription();

    return () => {
      console.log("🧹 Cleaning up: Unsubscribing and stopping polling");
      stopPolling();
      supabase.removeChannel(channel);
      
      if (sanityTimerRef.current) {
        clearTimeout(sanityTimerRef.current);
        sanityTimerRef.current = null;
      }
      if (noEventWarningRef.current) {
        clearTimeout(noEventWarningRef.current);
        noEventWarningRef.current = null;
      }
    };
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendAutoReply = async () => {
    if (!sessionId || autoReplyHasBeenSent) return;

    setTimeout(async () => {
      await supabase.from("live_chat_messages").insert({
        session_id: sessionId,
        sender_type: "admin",
        message: "Tack för ditt meddelande! Vi kan vara upptagna just nu, så svarstiden kan variera beroende på hur många som chattar. Vi återkommer så snart vi kan!",
      });

      setAutoReplyHasBeenSent(true);
      localStorage.setItem("live_chat_auto_reply_sent", "true");
    }, 2000);
  };

  const handleStartNewChat = () => {
    // Clear old session data
    localStorage.removeItem("live_chat_session_id");
    localStorage.removeItem("live_chat_auto_reply_sent");
    
    // Create new session
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("live_chat_session_id", newSessionId);
    
    // Reset state - setSessionId will trigger loadMessages via useEffect
    setMessages([]);
    setAutoReplyHasBeenSent(false);
    setIsChatClosed(false);
    setInputValue("");
    setSessionId(newSessionId);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    } else if (isResizing && chatRef.current) {
      const rect = chatRef.current.getBoundingClientRect();
      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - rect.left));
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, e.clientY - rect.top));
      }
      if (resizeDirection.includes('w')) {
        const deltaX = e.clientX - rect.left;
        newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, size.width - deltaX));
        newX = position.x + (size.width - newWidth);
      }
      if (resizeDirection.includes('n')) {
        const deltaY = e.clientY - rect.top;
        newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, size.height - deltaY));
        newY = position.y + (size.height - newHeight);
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position, size]);

  const startResize = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId) return;

    setIsLoading(true);
    setSendError(null);

    // Optimistic UI: Add message immediately with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      session_id: sessionId,
      message: inputValue,
      sender_type: "user",
      created_at: new Date().toISOString(),
      read: false,
      sender_id: null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageText = inputValue;
    setInputValue(""); // Clear input immediately for better UX

    const { data, error } = await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "user",
      message: messageText,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
      setSendError("Kunde inte skicka meddelande");
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setInputValue(messageText); // Restore input
    } else {
      console.log("✅ Message sent successfully", data);
      
      // Replace optimistic message with real one
      setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
      lastMessageTimestampRef.current = data.created_at;
      
      // Send auto-reply if this is the first message
      if (messages.length === 0) {
        sendAutoReply();
      }
      
      // Send notification to admin (silent)
      try {
        await supabase.functions.invoke("send-chat-notification", {
          body: {
            message: data.message,
            sessionId: data.session_id,
            timestamp: data.created_at,
          },
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    }

    setIsLoading(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  // Connection status indicator component
  const ConnectionIndicator = () => {
    if (connectionStatus === 'connected') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-500">
          <Wifi className="w-3 h-3" />
          <span>Live</span>
        </div>
      );
    } else if (connectionStatus === 'connecting') {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-500">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Ansluter...</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <WifiOff className="w-3 h-3" />
          <span>Uppdaterar var 4s</span>
        </div>
      );
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="Öppna chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className={`fixed z-50 bg-background/95 backdrop-blur-xl rounded-2xl shadow-elegant border border-border/50 flex flex-col overflow-hidden ${
            isClosing 
              ? "animate-out slide-out-to-bottom-4 fade-out duration-200" 
              : "animate-in slide-in-from-bottom-4 fade-in duration-300"
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            cursor: isDragging ? 'move' : 'default',
          }}
        >
          {/* Resize handles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 pointer-events-auto cursor-n-resize" onMouseDown={startResize('n')} />
            <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-auto cursor-s-resize" onMouseDown={startResize('s')} />
            <div className="absolute top-0 bottom-0 left-0 w-1 pointer-events-auto cursor-w-resize" onMouseDown={startResize('w')} />
            <div className="absolute top-0 bottom-0 right-0 w-1 pointer-events-auto cursor-e-resize" onMouseDown={startResize('e')} />
            <div className="absolute top-0 left-0 w-3 h-3 pointer-events-auto cursor-nw-resize" onMouseDown={startResize('nw')} />
            <div className="absolute top-0 right-0 w-3 h-3 pointer-events-auto cursor-ne-resize" onMouseDown={startResize('ne')} />
            <div className="absolute bottom-0 left-0 w-3 h-3 pointer-events-auto cursor-sw-resize" onMouseDown={startResize('sw')} />
            <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-auto cursor-se-resize" onMouseDown={startResize('se')} />
          </div>

          {/* Header - draggable */}
          <div 
            className="chat-header bg-gradient-to-r from-primary to-secondary text-primary-foreground p-4 flex items-center justify-between cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hero-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Promotely Support</h3>
                <ConnectionIndicator />
              </div>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-hero-foreground/20 rounded-full p-2 transition-colors"
              aria-label="Stäng chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {isChatClosed ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                  <X className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chatten avslutades av support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Du kan starta en ny chatt om du har fler frågor
                </p>
                <Button
                  onClick={handleStartNewChat}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Starta ny chatt
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hej! 👋</h3>
                <p className="text-sm text-muted-foreground">
                  Skriv ett meddelande så återkommer vi så snart vi kan!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                        msg.sender_type === "user"
                          ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/80 text-foreground rounded-bl-sm"
                      } ${msg.id.startsWith('temp-') ? 'opacity-70' : ''}`}
                    >
                      <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.sender_type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {msg.id.startsWith('temp-') ? 'Skickar...' : new Date(msg.created_at).toLocaleTimeString("sv-SE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          {!isChatClosed && (
            <div className="p-4 border-t border-border/50">
              {sendError && (
                <p className="text-xs text-destructive mb-2" role="alert" aria-live="polite">
                  {sendError}
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
