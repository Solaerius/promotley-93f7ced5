import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavbarPosition } from "@/hooks/useNavbarPosition";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { DashboardFooter } from "@/components/DashboardFooter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
  hideFooter?: boolean;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeIn" as const,
    },
  },
};

const DashboardLayout = ({ children, showBackButton, pageTitle, hideFooter }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const { needsOnboarding, loading: orgLoading } = useOrganization();
  const { position } = useNavbarPosition();
  const navigate = useNavigate();
  const location = useLocation();

  const isTopNav = position === 'top';

  // Redirect to onboarding if no organization
  useEffect(() => {
    if (!orgLoading && needsOnboarding && !location.pathname.startsWith('/organization')) {
      navigate('/organization/onboarding');
    }
  }, [needsOnboarding, orgLoading, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient Background - Light mode: clean white / Dark mode: darker slate */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Animated blur orbs for liquid glass effect - more subtle */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(9 70% 45% / 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            top: '10%',
            right: '-10%',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(331 50% 35% / 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
            bottom: '10%',
            left: '-10%',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(344 40% 25% / 0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '50%',
            left: '30%',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Email Verification Banner */}
      <div className="relative z-10">
        <EmailVerificationBanner />
      </div>

      {/* Dashboard Navbar */}
      <DashboardNavbar 
        showBackButton={showBackButton}
        title={pageTitle}
      />

      {/* Main content with page transition animation */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          className={cn(
            "flex-1 relative z-10 p-4 md:p-6 lg:p-8",
            isTopNav ? "pt-28 md:pt-32 pb-8" : "pt-8 pb-48 md:pb-40"
          )}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      {!hideFooter && (
        <div className="relative z-10">
          <DashboardFooter />
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
