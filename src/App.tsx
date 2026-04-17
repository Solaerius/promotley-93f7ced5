import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireVerifiedEmail } from "@/components/RequireVerifiedEmail";
import { AdminRoute } from "@/components/AdminRoute";
import { PageTransition } from "@/components/PageTransition";
// Critical path — eager
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import GlobalTutorial from "./components/GlobalTutorial";
// Lazy-loaded pages
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const Calendar = lazy(() => import("./pages/Calendar"));
const PostsPage = lazy(() => import("./pages/PostsPage"));
const AIPage = lazy(() => import("./pages/AIPage"));
const AIChat = lazy(() => import("./pages/AIChat"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SwishCheckout = lazy(() => import("./pages/SwishCheckout"));
const CheckoutRedirect = lazy(() => import("./pages/CheckoutRedirect"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const Demo = lazy(() => import("./pages/Demo"));
const RedeemPromotion = lazy(() => import("./pages/RedeemPromotion"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
// AI tools
const CaptionGenerator = lazy(() => import("./pages/ai/CaptionGenerator"));
const HashtagSuggestions = lazy(() => import("./pages/ai/HashtagSuggestions"));
const ContentIdeas = lazy(() => import("./pages/ai/ContentIdeas"));
const WeeklyPlanner = lazy(() => import("./pages/ai/WeeklyPlanner"));
const CampaignStrategy = lazy(() => import("./pages/ai/CampaignStrategy"));
const UFTips = lazy(() => import("./pages/ai/UFTips"));
// Admin pages
const AdminChat = lazy(() => import("./pages/AdminChat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminNotificationSettings = lazy(() => import("./pages/AdminNotificationSettings"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement"));
const AdminBanManagement = lazy(() => import("./pages/AdminBanManagement"));
const AdminSwishOrders = lazy(() => import("./pages/AdminSwishOrders"));
const AdminStripeOrders = lazy(() => import("./pages/AdminStripeOrders"));
const AdminPromotions = lazy(() => import("./pages/AdminPromotions"));
const AdminEmailBroadcast = lazy(() => import("./pages/AdminEmailBroadcast"));
const AdminEmailAutomation = lazy(() => import("./pages/AdminEmailAutomation"));
const AdminFeatureFlags = lazy(() => import("./pages/AdminFeatureFlags"));
// Organization pages
const OrganizationOnboarding = lazy(() => import("./pages/OrganizationOnboarding"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const CreateOrganization = lazy(() => import("./pages/CreateOrganization"));
const JoinOrganization = lazy(() => import("./pages/JoinOrganization"));
// Settings pages
const Settings = lazy(() => import("./pages/Settings"));
const Tutorial = lazy(() => import("./pages/Tutorial"));

const DevAutoLogin = import.meta.env.DEV
  ? lazy(() => import("./pages/DevAutoLogin"))
  : null;

const queryClient = new QueryClient();

const PageLoader = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={PageLoader}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.key}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute>
                <VerifyEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireVerifiedEmail>
                <PageTransition><Dashboard /></PageTransition>
              </RequireVerifiedEmail>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PageTransition><AnalyticsPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <PageTransition><Calendar /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts"
            element={
              <RequireVerifiedEmail>
                <PageTransition><PostsPage /></PageTransition>
              </RequireVerifiedEmail>
            }
          />
          <Route
            path="/tutorial"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Tutorial />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <RequireVerifiedEmail>
                <PageTransition><AIPage /></PageTransition>
              </RequireVerifiedEmail>
            }
          />
          <Route
            path="/ai/chat"
            element={
              <RequireVerifiedEmail>
                <AIChat />
              </RequireVerifiedEmail>
            }
          />
          {/* AI Tool pages */}
          <Route path="/ai/caption" element={<RequireVerifiedEmail><CaptionGenerator /></RequireVerifiedEmail>} />
          <Route path="/ai/hashtags" element={<RequireVerifiedEmail><HashtagSuggestions /></RequireVerifiedEmail>} />
          <Route path="/ai/content-ideas" element={<RequireVerifiedEmail><ContentIdeas /></RequireVerifiedEmail>} />
          <Route path="/ai/weekly-plan" element={<RequireVerifiedEmail><WeeklyPlanner /></RequireVerifiedEmail>} />
          <Route path="/ai/campaign" element={<RequireVerifiedEmail><CampaignStrategy /></RequireVerifiedEmail>} />
          <Route path="/ai/uf-tips" element={<RequireVerifiedEmail><UFTips /></RequireVerifiedEmail>} />
          {/* Redirects for old routes */}
          <Route path="/ai-chat" element={<Navigate to="/ai" replace />} />
          <Route path="/ai-dashboard" element={<Navigate to="/ai" replace />} />
          <Route path="/account" element={<Navigate to="/settings?tab=profile" replace />} />
          {/* Settings pages */}
          <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
          <Route path="/settings/profile" element={<Navigate to="/settings?tab=profile" replace />} />
          <Route path="/settings/company" element={<Navigate to="/settings?tab=company" replace />} />
          <Route path="/settings/credits" element={<Navigate to="/settings?tab=credits" replace />} />
          <Route path="/settings/app" element={<Navigate to="/settings?tab=app" replace />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/chat"
            element={
              <AdminRoute>
                <AdminChat />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings/notifications"
            element={
              <AdminRoute>
                <AdminNotificationSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bans"
            element={
              <AdminRoute>
                <AdminBanManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/swish"
            element={
              <AdminRoute>
                <AdminSwishOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/stripe"
            element={
              <AdminRoute>
                <AdminStripeOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/promotions"
            element={
              <AdminRoute>
                <AdminPromotions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/email"
            element={
              <AdminRoute>
                <AdminEmailBroadcast />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/email-automation"
            element={
              <AdminRoute>
                <AdminEmailAutomation />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/feature-flags"
            element={
              <AdminRoute>
                <AdminFeatureFlags />
              </AdminRoute>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/promo/:code" element={<RedeemPromotion />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route
            path="/swish-checkout"
            element={<Navigate to="/pricing" replace />}
          />
          {/* Stripe Checkout routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/buy-credits" element={<Navigate to="/pricing" replace />} />
          {/* Keep for in-flight old sessions */}
          <Route path="/billing/success" element={<Navigate to="/checkout/success" replace />} />
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          {/* Organization routes */}
          <Route
            path="/organization/onboarding"
            element={
              <ProtectedRoute>
                <OrganizationOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/new"
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/settings"
            element={
              <ProtectedRoute>
                <OrganizationSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/join/:code" element={<JoinOrganization />} />
          {/* Dev auto-login route (only in development) */}
          {import.meta.env.DEV && DevAutoLogin && (
            <Route path="/dev/auto-login" element={<DevAutoLogin />} />
          )}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalTutorial />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
