import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon: Icon, iconColor = "bg-primary/10 text-primary", href, onClick, className, delay = 0 }, ref) => {
    const content = (
      <motion.div
        ref={ref}
        className={cn("feature-card group", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay * 0.1 }}
        whileHover={{ y: -4 }}
        onClick={onClick}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Öppna</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    );

    if (href) {
      return <Link to={href}>{content}</Link>;
    }

    return content;
  }
);
FeatureCard.displayName = "FeatureCard";

export { FeatureCard };
