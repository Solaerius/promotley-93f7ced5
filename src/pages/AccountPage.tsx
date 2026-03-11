import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Building2, Palette, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Import content components
import AccountContent from "@/components/account/AccountContent";
import OrganizationContent from "@/components/account/OrganizationContent";
import AppSettingsContent from "@/components/account/AppSettingsContent";

const sections = [
  { id: "konto", label: "Konto", icon: User },
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "app", label: "Kopplingar & Tema", icon: Palette },
];

const AccountPage = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(() => {
    return searchParams.get("tab") || "konto";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && sections.some(s => s.id === tab)) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  const renderContent = () => {
    switch (activeSection) {
      case "konto":
        return <AccountContent />;
      case "organisation":
        return <OrganizationContent />;
      case "app":
        return <AppSettingsContent />;
      default:
        return <AccountContent />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-1">Konto & Inställningar</h1>
        <p className="text-sm text-muted-foreground mb-6">Hantera ditt konto, organisation och kopplingar</p>

        {/* Mobile: dropdown selector */}
        {isMobile ? (
          <div className="mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card shadow-sm text-sm font-medium text-foreground"
            >
              <div className="flex items-center gap-2">
                <currentSection.icon className="w-4 h-4 text-muted-foreground" />
                {currentSection.label}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", mobileMenuOpen && "rotate-180")} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-1 rounded-xl bg-card shadow-md overflow-hidden">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                        activeSection === section.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-4">{renderContent()}</div>
          </div>
        ) : (
          /* Desktop: sidebar + content */
          <div className="flex gap-6">
            {/* Sidebar nav */}
            <nav className="w-48 shrink-0 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AccountPage;
