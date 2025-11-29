import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      // Create new session
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("live_chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

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

    const { data, error } = await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "user",
      message: inputValue,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
      setSendError("Kunde inte skicka meddelande");
    } else {
      // Clear input after successful send
      setInputValue("");
      
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
                <p className="text-xs text-hero-muted/80">
                  Online • Svarar snabbt
                </p>
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

          {/* Content Area - Empty for users, just shows header */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="mb-4 p-4 rounded-full bg-muted/50">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Skicka din fråga</h3>
            <p className="text-sm text-muted-foreground">
              Vi svarar så snart vi kan
            </p>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                  placeholder="Skriv ditt meddelande..."
                  className="flex-1 bg-background"
                  disabled={isLoading}
                  aria-label="Skicka fråga"
                  aria-live="polite"
                  aria-describedby={sendError ? "send-error" : undefined}
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-primary hover:shadow-glow"
                  aria-label="Skicka meddelande"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {sendError && (
                <p id="send-error" className="text-xs text-destructive" role="alert">
                  {sendError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
