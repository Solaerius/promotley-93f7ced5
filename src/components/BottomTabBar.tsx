import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  MessageSquare,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Statistik", href: "/analytics", icon: BarChart3 },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "AI-Chat", href: "/ai-chat", icon: MessageSquare },
  { name: "Inställningar", href: "/settings", icon: Settings },
];

export function BottomTabBar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="tab-bar lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        
        return (
          <Link
            key={tab.name}
            to={tab.href}
            className={cn("tab-bar-item relative", active && "active")}
          >
            {active && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-primary/10"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className={cn("w-5 h-5 relative z-10", active ? "text-primary" : "text-muted-foreground")} />
            <span className="relative z-10">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
