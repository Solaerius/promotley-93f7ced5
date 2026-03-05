import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Wifi, WifiOff, RefreshCw, Bot, User } from "lucide-react";
import { useNavbarPosition } from "@/hooks/useNavbarPosition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { filterMessage } from "@/lib/contentFilter";

interface Message {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  sender_id: string | null;
  read: boolean;
  created_at: string;
  is_automated?: boolean;
}

const ChatWidget = () => {
  const { position: navbarPosition } = useNavbarPosition();
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
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  
  // New refs for robust realtime
  const gotRealtimeEventRef = useRef(false);
  const sanityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noEventWarningRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTickCountRef = useRef(0);

  // Draggable and resizable state - smaller initial size
  const [position, setPosition] = useState({ x: window.innerWidth - 340 - 24, y: window.innerHeight - 474 });
  const [size, setSize] = useState({ width: 340, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 280;
  const MAX_WIDTH = 600;
  const MIN_HEIGHT = 350;
  const MAX_HEIGHT = window.innerHeight - 100;

  // Load or create session on mount (no DB calls needed - uses localStorage)
  useEffect(() => {
    const savedSessionId = localStorage.getItem("live_chat_session_id");
    const autoReplySent = localStorage.getItem("live_chat_auto_reply_sent");
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setAutoReplyHasBeenSent(autoReplySent === "true");
      // Only check session status if chat is open to avoid unnecessary DB calls
    } else {
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

  // Polling fallback - only works for admin users due to RLS
  // Non-admin users rely on optimistic UI + realtime
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    
    console.log("🔄 Starting polling fallback (every 4s) - may be restricted by RLS");
    setConnectionStatus('disconnected');
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId) return;
      
      pollingTickCountRef.current++;
      
      try {
        const { data, error } = await supabase
          .from("live_chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .gt("created_at", lastMessageTimestampRef.current || new Date(0).toISOString())
          .order("created_at", { ascending: true });
        
        if (error) {
          // RLS restriction - expected for non-admin users
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ Polling: Found ${data.length} new message(s)`);
          setMessages((prev) => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.filter(m => !existingIds.has(m.id) && !m.id.startsWith('temp-'));
            if (newMessages.length > 0) {
              return [...prev.filter(m => !m.id.startsWith('temp-')), ...newMessages];
            }
            return prev;
          });
          lastMessageTimestampRef.current = data[data.length - 1].created_at;
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
        // Expected for non-admin users due to RLS
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("⏹️ Stopping polling");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Force reload messages (sanity check) - only works for admin users
  const forceReloadMessages = async () => {
    if (!sessionId) return;
    
    const { data } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .gt("created_at", lastMessageTimestampRef.current || new Date(0).toISOString())
      .order("created_at", { ascending: true });
    
    if (data && data.length > 0) {
      console.log(`✅ Force reload: Found ${data.length} new message(s)`);
      setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id));
        const fresh = data.filter(m => !existingIds.has(m.id));
        return [...prev.filter(m => !m.id.startsWith('temp-')), ...fresh];
      });
      lastMessageTimestampRef.current = data[data.length - 1].created_at;
    }
  };

  // Load messages only when chat is opened and session is ready
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    // Reset refs for new session
    gotRealtimeEventRef.current = false;
    pollingTickCountRef.current = 0;

    // Check session status
    checkSessionStatus(sessionId);

    const loadMessages = async () => {
      // Note: Non-admin users cannot read messages from DB due to RLS
      // This is expected - chat uses optimistic UI for user messages
      // and realtime for admin responses
      const { data, error } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        // RLS restriction is expected for non-admin users - not an error
        console.log("Chat messages not accessible (RLS restricted to admins) - using local state");
      } else if (data && data.length > 0) {
        // Admin users will see messages
        setMessages(data);
        lastMessageTimestampRef.current = data[data.length - 1].created_at;
      }
      // For non-admin users, messages list stays empty - they rely on optimistic UI
      
      // Don't start polling for non-admin users since they can't read from DB anyway
      // Realtime will still work for receiving admin messages
    };

    loadMessages();

    // Subscribe to broadcast channel (bypasses RLS)
    console.log("📡 Setting up Broadcast listener for session:", sessionId);
    
    const channel = supabase
      .channel(`live_chat_${sessionId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log("Broadcast: new_message received!", payload.payload);
        const newMessage = payload.payload as Message;
        if (newMessage.sender_type === 'admin' && !isOpen) {
          setHasUnread(true);
        }
        setMessages((prev) => {
          const filtered = prev.filter(m => 
            m.id !== newMessage.id && !m.id.startsWith('temp-')
          );
          return [...filtered, newMessage];
        });
        lastMessageTimestampRef.current = newMessage.created_at;
      })
      .on('broadcast', { event: 'chat_closed' }, () => {
        console.log("✅ Broadcast: chat_closed received!");
        setIsChatClosed(true);
      })
      .subscribe((status) => {
        console.log("📡 Broadcast subscription status:", status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

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
  }, [sessionId, isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendAutoReply = async () => {
    if (!sessionId || autoReplyHasBeenSent) return;

    const autoMessage: Message = {
      id: `auto-${Date.now()}`,
      session_id: sessionId,
      message: "Tack för ditt meddelande! Vi kan vara upptagna just nu, så svarstiden kan variera beroende på hur många som chattar. Vi återkommer så snart vi kan!",
      sender_type: "admin",
      created_at: new Date().toISOString(),
      read: false,
      sender_id: null,
    };

    setMessages((prev) => [...prev, autoMessage]);
    setAutoReplyHasBeenSent(true);
    localStorage.setItem("live_chat_auto_reply_sent", "true");

    // Also insert to DB so admin can see it
    await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "admin",
      message: autoMessage.message,
    });
  };

  const handleStartNewChat = () => {
    // Clear old session data
    localStorage.removeItem("live_chat_session_id");
    localStorage.removeItem("live_chat_auto_reply_sent");
    
    // Create new session
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("live_chat_session_id", newSessionId);
    
    // Reset state
    setMessages([]);
    setAutoReplyHasBeenSent(false);
    setIsChatClosed(false);
    setInputValue("");
    setSessionId(newSessionId);
  };

  const handleCloseAndReset = () => {
    // Clear session data
    localStorage.removeItem("live_chat_session_id");
    localStorage.removeItem("live_chat_auto_reply_sent");
    
    // Reset state and close widget
    setMessages([]);
    setAutoReplyHasBeenSent(false);
    setIsChatClosed(false);
    setInputValue("");
    setSessionId(null);
    handleClose();
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

    // Filter message for inappropriate content
    const { filtered, wasCensored } = filterMessage(inputValue);
    
    if (wasCensored) {
      setSendError("Meddelandet innehöll olämpligt innehåll som har filtrerats.");
    }

    setIsLoading(true);
    setSendError(null);

    // Optimistic UI: Add message immediately with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      session_id: sessionId,
      message: filtered,
      sender_type: "user",
      created_at: new Date().toISOString(),
      read: false,
      sender_id: null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageText = filtered;
    setInputValue("");

    // Ensure session exists in live_chat_sessions table first
    const { error: sessionError } = await supabase.from("live_chat_sessions").upsert({
      session_id: sessionId,
      status: 'open',
    }, { onConflict: 'session_id' });

    if (sessionError) {
      console.error("Error creating session:", sessionError);
    }

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
      setInputValue(messageText);
    } else {
      console.log("✅ Message sent successfully", data);
      
      // Replace optimistic message with real one
      setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
      lastMessageTimestampRef.current = data.created_at;
      
      // (auto-reply now sent on chat open, not here)
      
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
    setHasUnread(false);
    
    // Create session if needed
    if (!sessionId) {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("live_chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    
    // Send auto-reply welcome message when chat opens
    if (!autoReplyHasBeenSent && !isChatClosed) {
      setTimeout(() => sendAutoReply(), 500);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  // Check if message is automated (first admin message after user's first message)
  const isAutomatedMessage = (msg: Message, index: number) => {
    if (msg.sender_type !== 'admin') return false;
    
    // Find if this is the first admin message
    const adminMessages = messages.filter(m => m.sender_type === 'admin');
    const isFirstAdmin = adminMessages.length > 0 && adminMessages[0].id === msg.id;
    
    // Check if it's the standard auto-reply
    const isAutoReplyContent = msg.message.includes("Tack för ditt meddelande! Vi kan vara upptagna");
    
    return isFirstAdmin && isAutoReplyContent;
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
          className={`fixed z-[60] w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center group ${
            navbarPosition === 'bottom' ? 'bottom-20 right-6' :
            navbarPosition === 'right' ? 'bottom-6 right-20' :
            'bottom-6 right-6'
          }`}
          aria-label="Öppna chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-secondary animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className={`fixed z-[60] bg-background/95 backdrop-blur-xl rounded-2xl shadow-elegant border border-border/50 flex flex-col overflow-hidden ${
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
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                  <X className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chatten har avslutats</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Support har avslutat denna chatt. Du kan starta en ny chatt om du har fler frågor.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseAndReset}
                  >
                    Stäng chatt
                  </Button>
                  <Button
                    onClick={handleStartNewChat}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Starta ny chatt
                  </Button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hej!</h3>
                <p className="text-sm text-muted-foreground">
                  Skriv ett meddelande så återkommer vi så snart vi kan!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isAutomated = isAutomatedMessage(msg, index);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[85%]">
                        {/* Sender label for admin messages */}
                        {msg.sender_type === "admin" && (
                          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                            {isAutomated ? (
                              <>
                                <Bot className="w-3 h-3" />
                                <span>Automatiserat meddelande</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3" />
                                <span>Från support</span>
                              </>
                            )}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm ${
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
                    </div>
                  );
                })}
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
