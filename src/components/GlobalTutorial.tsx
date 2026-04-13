import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAIProfile } from "@/hooks/useAIProfile";
import OnboardingTutorial from "@/components/OnboardingTutorial";

const DASHBOARD_ROUTES = ["/dashboard", "/analytics", "/ai", "/calendar", "/account"];

const GlobalTutorial = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useAIProfile();
  const [showTutorial, setShowTutorial] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  const isOnDashboardRoute = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));

  // Force a profile refetch whenever the user lands on a dashboard route — catches tutorial restarts
  useEffect(() => {
    if (user && isOnDashboardRoute) {
      refetch();
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (!dismissed && !profileLoading && profile && profile.tutorial_seen === false && user && isOnDashboardRoute) {
      setShowTutorial(true);
    }
  }, [dismissed, profileLoading, profile, user, isOnDashboardRoute]);

  const handleComplete = () => {
    setDismissed(true);
    setShowTutorial(false);
    refetch();
  };

  if (!showTutorial || !isOnDashboardRoute) return null;

  return (
    <AnimatePresence>
      {showTutorial && (
        <OnboardingTutorial onComplete={handleComplete} />
      )}
    </AnimatePresence>
  );
};

export default GlobalTutorial;
