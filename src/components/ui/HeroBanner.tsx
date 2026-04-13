import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, Calendar, ArrowRight } from "lucide-react";
import { Button } from "./button";
import { Link } from "react-router-dom";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  href?: string;
}

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  quickActions?: QuickAction[];
  showCalendarIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const HeroBanner = React.forwardRef<HTMLDivElement, HeroBannerProps>(
  ({ title, subtitle, quickActions, showCalendarIcon = true, className, children }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("hero-banner", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 dark:bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-black/3 dark:bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold dashboard-heading-dark mb-2">{title}</h2>
              {subtitle && (
                <p className="dashboard-subheading-dark text-sm md:text-base">{subtitle}</p>
              )}
            </div>
            {showCalendarIcon && (
              <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-foreground/70 dark:text-white" />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {quickActions && quickActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium dashboard-subheading-dark mb-3">Dagens fokus</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const content = (
                    <motion.div
                      key={action.href ? undefined : index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer transition-colors group"
                      whileHover={{ x: 4 }}
                      onClick={action.onClick}
                    >
                      <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-foreground/70 dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate dashboard-heading-dark">{action.title}</p>
                        {action.subtitle && (
                          <p className="text-xs dashboard-subheading-dark">{action.subtitle}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-foreground/60 dark:text-white" />
                    </motion.div>
                  );
                  return action.href ? <Link key={index} to={action.href}>{content}</Link> : <React.Fragment key={index}>{content}</React.Fragment>;
                })}
              </div>
            </div>
          )}

          {/* Custom children */}
          {children}
        </div>
      </motion.div>
    );
  }
);
HeroBanner.displayName = "HeroBanner";

export { HeroBanner };
