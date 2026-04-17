import { Link, useLocation, useNavigate } from "react-router-dom";
import { SettingsPopup } from "@/components/SettingsPopup";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from "next-themes";
import {
  Home,
  TrendingUp,
  CalendarDays,
  Wand2,
  Settings,
  Settings2,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  BookOpen,
  ListChecks,
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


export function AppSidebar() {
  const { t } = useTranslation();

  const navItems = [
    { title: t('nav.home'),          href: "/dashboard",        icon: Home },
    { title: t('nav.analytics'),     href: "/analytics",        icon: TrendingUp },
    { title: t('nav.tools'),         href: "/ai",               icon: Wand2 },
    { title: t('nav.chat'),          href: "/ai/chat",          icon: MessageSquare },
    { title: t('nav.calendar'),      href: "/calendar",         icon: CalendarDays },
    { title: t('nav.posts', 'Inlägg'), href: "/posts",          icon: ListChecks },
    { title: t('nav.guide'),         href: "/tutorial",         icon: BookOpen },
    { title: t('nav.settings_page'), href: "/settings",         icon: Settings2 },
  ];
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeOrganization } = useOrganization();
  const { credits } = useUserCredits();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
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
    return location.pathname.startsWith(path);
  };

  const creditPct = credits?.max_credits ? (credits.credits_left / credits.max_credits) * 100 : 0;
  const creditColor = creditPct > 50 ? "bg-green-500" : creditPct > 20 ? "bg-yellow-500" : "bg-destructive";
  const displayName = activeOrganization?.name || user?.email?.split("@")[0] || t('common.user_fallback');

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/90 backdrop-blur-md">
      <SidebarHeader className="p-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Promotley" className="w-7 h-7 shrink-0 object-contain" />
          {!collapsed && <span className="font-bold text-xs text-foreground tracking-widest uppercase">PROMOTELY</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex flex-col justify-center">
        <SidebarGroup className="my-auto">
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
                        "group relative transition-all duration-150 rounded-none px-3 overflow-hidden",
                        active
                          ? "border-l-2 border-primary text-primary font-semibold pl-[calc(0.75rem-2px)]"
                          : "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/40 pl-[calc(0.75rem-2px)]"
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                        <span>{item.title}</span>
                        {/* Hover underline animation */}
                        {!active && (
                          <motion.span
                            className="absolute bottom-0 left-0 h-[2px] w-full bg-primary/60 origin-left"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
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
                  tooltip={!mounted || theme === "light" ? t('common.dark_mode') : t('common.light_mode')}
                  className="transition-colors rounded-none px-3"
                >
                  {!mounted || theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{!mounted || theme === "light" ? t('common.dark_mode') : t('common.light_mode')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/30">
        {/* Credit bar */}
        {!collapsed && credits && (
          <Link to="/settings/credits" className="block cursor-pointer hover:opacity-80 transition-opacity rounded-md -mx-1 px-1 py-0.5" title="Credits & billing">
            <div className="px-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{t('dashboard.credits')}</span>
                <span className="text-[10px] font-semibold text-foreground">{credits.credits_left} {t('common.credits_left')}</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", creditColor)}
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>
          </Link>
        )}

        {/* Language switcher */}
        {!collapsed && (
          <div className="px-1 pb-2">
            <LanguageSwitcher />
          </div>
        )}

        {/* Profile with quick buttons */}
        <div className="flex items-center gap-2">
          <Link to="/settings/profile" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity rounded-lg p-1 -m-1 flex-1 min-w-0" title="Profile settings">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={userAvatarUrl || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SettingsPopup>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </SettingsPopup>
                </TooltipTrigger>
                <TooltipContent side="top">{t('common.settings')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('common.logout')}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
