import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useNotifications } from "@/hooks/useNotifications";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { AppSidebar } from "@/components/AppSidebar";
import CreditWarningBanner from "@/components/CreditWarningBanner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
  hideFooter?: boolean;
}

const DashboardLayout = ({ children, pageTitle, hideFooter }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const { needsOnboarding, loading: orgLoading } = useOrganization();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!orgLoading && needsOnboarding && !location.pathname.startsWith("/organization")) {
      navigate("/organization/onboarding");
    }
  }, [needsOnboarding, orgLoading, navigate, location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Content header */}
          <header className="sticky top-0 z-20 h-12 flex items-center justify-between gap-2 px-4 border-b border-border/40 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8" />
              {pageTitle && (
                <h1 className="text-sm font-medium text-foreground">{pageTitle}</h1>
              )}
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notiser</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Markera alla som lästa
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); clearAll(); }}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Rensa
                      </button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-[250px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">Inga notiser</div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                          if (!n.read) markAsRead(n.id);
                          if (n.action_url) {
                            const url = n.action_type ? `${n.action_url}?spotlight=${n.action_type}` : n.action_url;
                            navigate(url);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium text-xs">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: sv })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2 mt-1 shrink-0">
                            {!n.read && <div className="h-2 w-2 bg-primary rounded-full" />}
                            {n.action_url && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Email verification */}
          <EmailVerificationBanner />

          {/* Main content - no motion wrapper */}
          <main className="flex-1 p-4 md:p-6">
            <CreditWarningBanner />
            {children}
          </main>

          {/* Minimal footer */}
          {!hideFooter && (
            <footer className="py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/30">
              <p>
                © {new Date().getFullYear()} Promotely UF ·{" "}
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Integritetspolicy</Link>
                {" · "}
                <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Villkor</Link>
              </p>
            </footer>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
