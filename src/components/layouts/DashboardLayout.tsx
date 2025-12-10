import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { TopNav } from "@/components/TopNav";
import { BottomTabBar } from "@/components/BottomTabBar";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
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

const DashboardLayout = ({ children, showBackButton, pageTitle }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const { needsOnboarding, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to onboarding if no organization
  useEffect(() => {
    if (!orgLoading && needsOnboarding && !location.pathname.startsWith('/organization')) {
      navigate('/organization/onboarding');
    }
  }, [needsOnboarding, orgLoading, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Top Navigation */}
      <TopNav 
        showBackButton={showBackButton}
        title={pageTitle}
      />

      {/* Main content with page transition animation */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          className="flex-1 p-4 pb-24 md:p-6 md:pb-28 lg:p-8 lg:pb-28"
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Bottom Tab Bar - Always visible */}
      <BottomTabBar />
    </div>
  );
};

export default DashboardLayout;
