import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  variant?: "default" | "dark" | "frosted" | "hero";
  hover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, variant = "default", hover = true, ...props }, ref) => {
    const variants = {
      default: "glass-card",
      dark: "glass-card-dark",
      frosted: "frosted-glass rounded-2xl border border-border/50",
      hero: "hero-banner",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          variants[variant],
          hover && "transition-all duration-300 hover:shadow-elegant",
          className
        )}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
