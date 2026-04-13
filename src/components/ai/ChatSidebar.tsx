import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { AIConversation } from "@/hooks/useConversations";

interface ChatSidebarProps {
  conversations: AIConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
}: ChatSidebarProps) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 gap-2 border-r border-border dark:border-white/10 w-12 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNew}
          className="w-8 h-8 text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col border-r border-border dark:border-white/10 shrink-0 w-60"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border dark:border-white/10">
        <span className="text-xs font-semibold text-foreground/70 dark:text-white/70 uppercase tracking-wider">Historik</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNew}
            className="w-7 h-7 text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="px-3 py-4 text-xs text-muted-foreground dark:text-white/40 text-center">Laddar...</div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground dark:text-white/40 text-center">
              {t('common.no_conversations')}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  layout
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors group",
                      activeId === conv.id
                        ? "bg-black/10 dark:bg-white/15 text-foreground dark:text-white"
                        : "text-foreground/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground/80 dark:hover:text-white/80"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 text-muted-foreground dark:text-white/40 hover:text-destructive hover:bg-transparent shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default ChatSidebar;
