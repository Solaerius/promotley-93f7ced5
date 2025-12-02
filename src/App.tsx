import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireVerifiedEmail } from "@/components/RequireVerifiedEmail";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import AIChat from "./pages/AIChat";
import AIDashboard from "./pages/AIDashboard";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import BuyCredits from "./pages/BuyCredits";
import BillingSuccess from "./pages/BillingSuccess";
import AdminChat from "./pages/AdminChat";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNotificationSettings from "./pages/AdminNotificationSettings";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminBanManagement from "./pages/AdminBanManagement";
import OrganizationOnboarding from "./pages/OrganizationOnboarding";
import OrganizationSettings from "./pages/OrganizationSettings";
import CreateOrganization from "./pages/CreateOrganization";
import JoinOrganization from "./pages/JoinOrganization";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
                  <Dashboard />
                </RequireVerifiedEmail>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-chat" 
              element={
                <RequireVerifiedEmail>
                  <AIChat />
                </RequireVerifiedEmail>
              } 
            />
            <Route 
              path="/ai-dashboard" 
              element={
                <RequireVerifiedEmail>
                  <AIDashboard />
                </RequireVerifiedEmail>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
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
            <Route path="/pricing" element={<Pricing />} />
            <Route 
              path="/checkout" 
              element={
                <RequireVerifiedEmail>
                  <Checkout />
                </RequireVerifiedEmail>
              } 
            />
            <Route 
              path="/buy-credits" 
              element={
                <RequireVerifiedEmail>
                  <BuyCredits />
                </RequireVerifiedEmail>
              } 
            />
            <Route 
              path="/billing/success" 
              element={
                <ProtectedRoute>
                  <BillingSuccess />
                </ProtectedRoute>
              } 
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
