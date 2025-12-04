import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { TopNav } from "@/components/TopNav";
import { BottomTabBar } from "@/components/BottomTabBar";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  Shield,
  Bell,
  Building2,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
}

const DashboardLayout = ({ children, showBackButton, pageTitle }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const { activeOrganization, needsOnboarding, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to onboarding if no organization
  useEffect(() => {
    if (!orgLoading && needsOnboarding && !location.pathname.startsWith('/organization')) {
      navigate('/organization/onboarding');
    }
  }, [needsOnboarding, orgLoading, navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Statistik", href: "/analytics", icon: BarChart3 },
    { name: "Kalender", href: "/calendar", icon: Calendar },
    { name: "AI-Chat", href: "/ai-chat", icon: MessageSquare },
    { name: "AI-Analys", href: "/ai-dashboard", icon: BarChart3 },
    { name: "Inställningar", href: "/settings", icon: Settings },
    { name: "Organisation", href: "/organization/settings", icon: Building2 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-6 py-5 border-b border-border hover:bg-muted/50 transition-colors">
            <img src={logo} alt="Promotley" className="w-10 h-10" />
            <span className="font-bold text-xl text-foreground">Promotley</span>
          </Link>

          {/* Organization Selector */}
          <div className="px-4 py-3 border-b border-border">
            <OrganizationSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
                </div>
                <Link
                  to="/admin"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive("/admin")
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Översikt</span>
                </Link>
                <Link
                  to="/admin/chat"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive("/admin/chat")
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Chatt</span>
                </Link>
                <Link
                  to="/admin/users"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive("/admin/users")
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Användare</span>
                </Link>
                <Link
                  to="/admin/settings/notifications"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive("/admin/settings/notifications")
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifikationer</span>
                </Link>
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              Logga ut
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                  <img src={logo} alt="Promotley" className="w-10 h-10" />
                  <span className="font-bold text-xl text-foreground">Promotley</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Organization Selector */}
              <div className="px-4 py-3 border-b border-border">
                <OrganizationSelector />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive(item.href)
                            ? "bg-gradient-primary text-white shadow-soft"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* User section */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                  Logga ut
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 pb-20 lg:pb-0">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Top Navigation */}
        <TopNav 
          showBackButton={showBackButton}
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* Page content with animation */}
        <motion.main 
          className="p-4 lg:p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};

export default DashboardLayout;
