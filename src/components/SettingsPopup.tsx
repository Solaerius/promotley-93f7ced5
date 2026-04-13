import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Building2, CreditCard, Settings, Home, ExternalLink, Users } from "lucide-react";

interface SettingsPopupProps {
  children: React.ReactNode;
}

export function SettingsPopup({ children }: SettingsPopupProps) {
  const { t } = useTranslation();

  const items = [
    { icon: User, label: t('settings.profile'), href: '/settings/profile' },
    { icon: Building2, label: t('settings.company_information'), href: '/settings/company' },
    { icon: Users, label: t('settings.organisation'), href: '/organization/settings' },
    { icon: CreditCard, label: t('settings.credits_billing'), href: '/settings/credits' },
    { icon: Settings, label: t('settings.app'), href: '/settings/app' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <nav className="flex flex-col gap-0.5">
          {items.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 rounded-md hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
          <div className="my-1 border-t border-border" />
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 rounded-md hover:bg-muted hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            {t('nav.to_home')}
            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/50" />
          </Link>
        </nav>
      </PopoverContent>
    </Popover>
  );
}
