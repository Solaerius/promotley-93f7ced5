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
      {/* Gradient Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, hsl(344 55% 12%) 0%, hsl(331 65% 28%) 40%, hsl(9 85% 48%) 100%)',
        }}
      />
      
      {/* Animated blur orbs for liquid glass effect */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(9 90% 55% / 0.4) 0%, transparent 70%)',
            filter: 'blur(80px)',
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
          className="absolute w-[500px] h-[500px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(331 70% 45% / 0.4) 0%, transparent 70%)',
            filter: 'blur(80px)',
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
          className="absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(344 60% 35% / 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '50%',
            left: '30%',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
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
