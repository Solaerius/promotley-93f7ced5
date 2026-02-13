import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AnalyticsPage from "./pages/AnalyticsPage";
import Calendar from "./pages/Calendar";
import AIPage from "./pages/AIPage";
import AccountPage from "./pages/AccountPage";
import Pricing from "./pages/Pricing";
import SwishCheckout from "./pages/SwishCheckout";
import AdminChat from "./pages/AdminChat";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNotificationSettings from "./pages/AdminNotificationSettings";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminBanManagement from "./pages/AdminBanManagement";
import AdminSwishOrders from "./pages/AdminSwishOrders";
import OrganizationOnboarding from "./pages/OrganizationOnboarding";
import OrganizationSettings from "./pages/OrganizationSettings";
import CreateOrganization from "./pages/CreateOrganization";
import JoinOrganization from "./pages/JoinOrganization";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import Demo from "./pages/Demo";

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
                  <AnalyticsPage />
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
              path="/ai" 
              element={
                <RequireVerifiedEmail>
                  <AIPage />
                </RequireVerifiedEmail>
              } 
            />
            {/* Redirects for old routes */}
            <Route path="/ai-chat" element={<Navigate to="/ai" replace />} />
            <Route path="/ai-dashboard" element={<Navigate to="/ai" replace />} />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              } 
            />
            {/* Redirect old settings route */}
            <Route path="/settings" element={<Navigate to="/account" replace />} />
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
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/demo" element={<Demo />} />
            <Route 
              path="/swish-checkout" 
              element={
                <ProtectedRoute>
                  <SwishCheckout />
                </ProtectedRoute>
              } 
            />
            {/* Redirect old checkout routes to Swish */}
            <Route path="/checkout" element={<Navigate to="/pricing" replace />} />
            <Route path="/buy-credits" element={<Navigate to="/pricing" replace />} />
            <Route path="/billing/success" element={<Navigate to="/dashboard" replace />} />
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
