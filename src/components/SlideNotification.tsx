import { useState, useEffect } from "react";
import { X, MessageCircle, Bell, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlideNotificationData {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "chat";
  persistent?: boolean;
  timestamp?: Date;
}

interface SlideNotificationProps {
  notification: SlideNotificationData;
  onDismiss: (id: string) => void;
  onSave?: (notification: SlideNotificationData) => void;
}

export const SlideNotification = ({ notification, onDismiss, onSave }: SlideNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.persistent]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onSave) {
        onSave(notification);
      }
      onDismiss(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case "chat":
        return <MessageCircle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case "chat":
        return "bg-primary text-primary-foreground";
      case "success":
        return "bg-green-500 text-white";
      case "warning":
        return "bg-orange-500 text-white";
      default:
        return "bg-card text-card-foreground border border-border";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4 rounded-lg shadow-lg transition-all duration-300 ease-out",
        getBgColor(),
        isVisible && !isExiting ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-sm opacity-90 mt-0.5 line-clamp-2">{notification.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Notification manager hook
export const useSlideNotifications = () => {
  const [notifications, setNotifications] = useState<SlideNotificationData[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<SlideNotificationData[]>(() => {
    const saved = localStorage.getItem("promotely_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("promotely_notifications", JSON.stringify(savedNotifications));
  }, [savedNotifications]);

  const showNotification = (data: Omit<SlideNotificationData, "id" | "timestamp">) => {
    const notification: SlideNotificationData = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setNotifications(prev => [...prev, notification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const saveNotification = (notification: SlideNotificationData) => {
    setSavedNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  };

  const clearSavedNotifications = () => {
    setSavedNotifications([]);
  };

  const markAsRead = (id: string) => {
    setSavedNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    savedNotifications,
    showNotification,
    dismissNotification,
    saveNotification,
    clearSavedNotifications,
    markAsRead,
  };
};
