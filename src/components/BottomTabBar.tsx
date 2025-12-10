import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Settings,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Hem", href: "/dashboard", icon: LayoutDashboard },
  { name: "Statistik", href: "/analytics", icon: BarChart3 },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "AI", href: "/ai-chat", icon: MessageSquare },
  { name: "Org", href: "/organization/settings", icon: Building2 },
  { name: "Konto", href: "/settings", icon: Settings },
];

export function BottomTabBar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    if (path === "/ai-chat") {
      return location.pathname.startsWith("/ai-chat") || location.pathname.startsWith("/ai-dashboard");
    }
    if (path === "/organization/settings") {
      return location.pathname.startsWith("/organization");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="tab-bar">
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
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
            </motion.div>
            <span className={cn("relative z-10 text-[10px] sm:text-xs", active && "font-semibold")}>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
