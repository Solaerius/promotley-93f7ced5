import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  Sparkles,
  User,
  Bell,
  Settings,
  ArrowLeft,
  Move,
  Home,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavbarPosition } from "@/hooks/useNavbarPosition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Statistik", href: "/analytics", icon: BarChart3 },
  { name: "AI", href: "/ai", icon: Sparkles },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Konto", href: "/account", icon: User },
];

interface DashboardNavbarProps {
  showBackButton?: boolean;
  title?: string;
}

export function DashboardNavbar({ showBackButton, title }: DashboardNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeOrganization } = useOrganization();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { position, cyclePosition, getPositionLabel } = useNavbarPosition();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (data?.avatar_url) {
        setUserAvatarUrl(data.avatar_url);
      }
    };
    fetchUserAvatar();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    if (path === "/ai") {
      return location.pathname.startsWith("/ai");
    }
    if (path === "/account") {
      return location.pathname.startsWith("/account") || 
             location.pathname.startsWith("/settings") || 
             location.pathname.startsWith("/organization");
    }
    return location.pathname.startsWith(path);
  };

  const isVertical = position === 'left' || position === 'right';

  // Position classes
  const getNavbarPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'fixed top-0 left-0 right-0 z-50 mx-4 md:mx-6 lg:mx-12 mt-2';
      case 'bottom':
        return 'fixed bottom-0 left-0 right-0 z-50 mx-4 md:mx-6 lg:mx-12 mb-2 pb-safe';
      case 'left':
        return 'fixed left-0 top-1/2 -translate-y-1/2 z-50 ml-2';
      case 'right':
        return 'fixed right-0 top-1/2 -translate-y-1/2 z-50 mr-2';
    }
  };

  // Vertical (left/right) layout
  if (isVertical) {
    return (
      <nav className={getNavbarPositionClasses()}>
        <div 
          className="rounded-2xl border border-white/20 backdrop-blur-xl p-2"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--accent) / 0.95) 0%, hsl(var(--secondary) / 0.85) 50%, hsl(var(--primary) / 0.8) 100%)',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {/* Logo */}
            <Link to="/dashboard" className="p-2 mb-2">
              <img src={logo} alt="Promotley" className="w-7 h-7" />
            </Link>

            {/* Navigation tabs */}
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              
              return (
                <TooltipProvider key={tab.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={tab.href}
                        className={cn(
                          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
                          active 
                            ? "text-white bg-white/20" 
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeTabVertical"
                            className="absolute inset-0 rounded-xl bg-white/15 border border-white/20"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <Icon className="w-4 h-4 relative z-10" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                      <p>{tab.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}

            {/* Separator */}
            <div className="w-6 h-px bg-white/20 my-2" />

            {/* Position toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={cyclePosition}
                    className="w-9 h-9 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <Move className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                  <p>Flytta: {getPositionLabel(position)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DarkModeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10">
                  <Bell className="w-4 h-4" />
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
              <DropdownMenuContent side={position === 'left' ? 'right' : 'left'} className="w-72">
                <div className="px-3 py-2 border-b">
                  <h3 className="font-semibold text-sm">Notiser</h3>
                </div>
                <ScrollArea className="h-[250px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Inga notiser
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium text-xs">{notification.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full ml-2" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-white/10">
                  <Avatar className="w-7 h-7 border border-white/30">
                    <AvatarImage src={userAvatarUrl || undefined} />
                    <AvatarFallback className="bg-white/20 text-white text-xs">
                      {activeOrganization?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={position === 'left' ? 'right' : 'left'} className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer text-sm">
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Inställningar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer text-sm">
                    <Home className="mr-2 h-3.5 w-3.5" />
                    Till startsidan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive text-sm">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Logga ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    );
  }

  // Horizontal (top/bottom) layout
  return (
    <nav className={getNavbarPositionClasses()}>
      <div 
        className="rounded-2xl border border-white/20 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--accent) / 0.95) 0%, hsl(var(--secondary) / 0.85) 50%, hsl(var(--primary) / 0.8) 100%)',
        }}
      >
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Logo/Back button */}
            <div className="flex items-center gap-2">
              {showBackButton ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="rounded-xl text-white/90 hover:text-white hover:bg-white/10 w-8 h-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Link to="/dashboard" className="flex items-center gap-2 group">
                  <img src={logo} alt="Promotley" className="w-7 h-7" />
                  <span className="font-semibold text-sm text-white hidden sm:inline">Promotley</span>
                </Link>
              )}
              {title && (
                <h1 className="font-medium text-sm text-white">{title}</h1>
              )}
            </div>

            {/* Center - Navigation tabs (desktop) */}
            <div className="hidden md:flex items-center gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);
                
                return (
                  <Link
                    key={tab.name}
                    to={tab.href}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
                      active 
                        ? "text-white bg-white/20" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTabDesktop"
                        className="absolute inset-0 rounded-lg bg-white/15 border border-white/20"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="text-xs font-medium relative z-10">{tab.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-1">
              {/* Position toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={cyclePosition}
                      className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Flytta: {getPositionLabel(position)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DarkModeToggle />
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                    <Bell className="w-4 h-4" />
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
                  <div className="px-3 py-2 border-b">
                    <h3 className="font-semibold text-sm">Notiser</h3>
                  </div>
                  <ScrollArea className="h-[250px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Inga notiser
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex flex-col items-start p-3 cursor-pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <p className="font-medium text-xs">{notification.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{notification.message}</p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full ml-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10">
                    <Avatar className="w-7 h-7 border border-white/30">
                      <AvatarImage src={userAvatarUrl || undefined} />
                      <AvatarFallback className="bg-white/20 text-white text-xs">
                        {activeOrganization?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer text-sm">
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      Inställningar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer text-sm">
                      <Home className="mr-2 h-3.5 w-3.5" />
                      Till startsidan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive text-sm">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Logga ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile navigation tabs */}
          <div className="flex md:hidden items-center justify-around mt-2 pt-2 border-t border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors",
                    active 
                      ? "text-white" 
                      : "text-white/50 hover:text-white"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabMobile"
                      className="absolute inset-0 rounded-lg bg-white/15"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", active && "text-white")} />
                  <span className={cn("relative z-10 text-[9px]", active && "font-medium")}>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
