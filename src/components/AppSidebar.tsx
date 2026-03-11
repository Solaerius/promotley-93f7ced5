import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Sparkles,
  User,
  Settings,
  Home,
  LogOut,
  MessageSquare,
  Coins,
  Moon,
  Sun,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Hem", href: "/dashboard", icon: LayoutDashboard },
  { title: "Statistik", href: "/analytics", icon: BarChart3 },
  { title: "AI", href: "/ai", icon: Sparkles },
  { title: "AI-Chat", href: "/ai/chat", icon: MessageSquare },
  { title: "Kalender", href: "/calendar", icon: Calendar },
  { title: "Konto", href: "/account", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeOrganization } = useOrganization();
  const { credits } = useUserCredits();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setUserAvatarUrl(data.avatar_url);
      });
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    if (path === "/ai") return location.pathname === "/ai";
    if (path === "/ai/chat") return location.pathname === "/ai/chat";
    if (path === "/account") return location.pathname.startsWith("/account") || location.pathname.startsWith("/settings") || location.pathname.startsWith("/organization");
    return location.pathname.startsWith(path);
  };

  const creditPct = credits?.max_credits ? (credits.credits_left / credits.max_credits) * 100 : 0;
  const creditColor = creditPct > 50 ? "bg-green-500" : creditPct > 20 ? "bg-yellow-500" : "bg-destructive";
  const displayName = activeOrganization?.name || user?.email?.split("@")[0] || "Användare";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-background">
      <SidebarHeader className="p-3">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          {/* SVG logo instead of image to prevent flicker */}
          <div className="w-7 h-7 shrink-0 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">P</span>
          </div>
          {!collapsed && <span className="font-semibold text-sm text-foreground tracking-tight">Promotely</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-150",
                        active && "bg-primary/10 text-primary font-medium shadow-sm"
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dark mode toggle - always visible */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  tooltip={theme === "light" ? "Mörkt läge" : "Ljust läge"}
                  className="transition-colors"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{theme === "light" ? "Mörkt läge" : "Ljust läge"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/30">
        {/* Profile with quick buttons */}
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={userAvatarUrl || undefined} />
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/account")}>
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Inställningar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut}>
                      <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Logga ut</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
