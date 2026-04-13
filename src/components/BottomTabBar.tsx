import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Wand2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs = [
    { name: t('common.home'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('nav.analytics'), href: "/analytics", icon: BarChart3 },
    { name: "AI", href: "/ai", icon: Wand2 },
    { name: t('nav.account'), href: "/account", icon: User },
  ];
  
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    if (path === "/ai") {
      return location.pathname.startsWith("/ai");
    }
    if (path === "/account") {
      return location.pathname.startsWith("/account") || 
             location.pathname.startsWith("/settings") || 
             location.pathname.startsWith("/organization");
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
