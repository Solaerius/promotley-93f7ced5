import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, ChevronDown, Plus, Check, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const OrganizationSelector = () => {
  const { t } = useTranslation();
  const { organizations, activeOrganization, membership, switchOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({});

  // Fetch proper logo URLs from storage
  useEffect(() => {
    const fetchLogos = async () => {
      const urls: Record<string, string> = {};
      for (const org of organizations) {
        if (org.logo_url) {
          if (org.logo_url.startsWith('http')) {
            urls[org.id] = org.logo_url;
          } else {
            const { data } = supabase.storage
              .from('profile-images')
              .getPublicUrl(org.logo_url);
            if (data?.publicUrl) {
              urls[org.id] = data.publicUrl;
            }
          }
        }
      }
      setLogoUrls(urls);
    };
    
    if (organizations.length > 0) {
      fetchLogos();
    }
  }, [organizations]);

  if (!activeOrganization) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "founder":
        return <Badge variant="default" className="text-xs">Grundare</Badge>;
      case "admin":
        return <Badge variant="secondary" className="text-xs">Admin</Badge>;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 h-auto py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={logoUrls[activeOrganization.id] || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {activeOrganization.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left max-w-[120px]">
            <span className="text-sm font-medium truncate w-full">
              {activeOrganization.name}
            </span>
            {membership && (
              <span className="text-xs text-muted-foreground capitalize">
                {membership.role === "founder" ? "Grundare" : membership.role === "admin" ? "Admin" : "Medlem"}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Dina organisationer
        </DropdownMenuLabel>
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              if (org.id !== activeOrganization.id) {
                switchOrganization(org.id);
              }
              setOpen(false);
            }}
            className="flex items-center gap-3 py-2 cursor-pointer"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={logoUrls[org.id] || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {org.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{org.name}</p>
            </div>
            {org.id === activeOrganization.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/organization/onboarding" className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>{t('common.create_new_org')}</span>
          </Link>
        </DropdownMenuItem>

        {membership && (membership.role === "founder" || membership.role === "admin") && (
          <DropdownMenuItem asChild>
            <Link to="/organization/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Organisationsinställningar</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};