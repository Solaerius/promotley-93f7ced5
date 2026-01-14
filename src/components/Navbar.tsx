import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav 
      id="site-header"
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl mt-2 mx-4 md:mx-6 lg:mx-12 rounded-2xl shadow-elegant border border-border/20 translate-y-[6px]"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--secondary) / 0.08) 50%, hsl(var(--accent) / 0.1) 100%)',
      }}
    >
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - White text for contrast on gradient background */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={logo} 
              alt="Promotley Logo" 
              className="h-8 w-8 md:h-9 md:w-9 transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-lg md:text-xl font-bold text-white dark:text-foreground transition-colors">
              Promotley
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a 
              href="#funktioner" 
              className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground transition-colors text-sm font-medium"
            >
              Funktioner
            </a>
            <a 
              href="#priser" 
              className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground transition-colors text-sm font-medium"
            >
              Priser
            </a>
            <a 
              href="#demo" 
              className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground transition-colors text-sm font-medium"
            >
              Demo
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <DarkModeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button variant="gradient" className="shadow-lg hover:shadow-xl transition-shadow">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground hover:bg-white/10 dark:hover:bg-foreground/10"
                  >
                    Logga in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="gradient"
                    className="transition-shadow duration-300 shadow-[0_6px_18px_rgba(238,89,61,0.35)] hover:shadow-[0_8px_24px_rgba(238,89,61,0.45)]"
                  >
                    Starta gratis
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-foreground/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-white/10 dark:border-border/30 mt-3 animate-fade-in-up">
            <div className="flex flex-col gap-2">
              <a 
                href="#funktioner" 
                className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funktioner
              </a>
              <a 
                href="#priser" 
                className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Priser
              </a>
              <a 
                href="#demo" 
                className="text-white/90 dark:text-foreground/90 hover:text-white dark:hover:text-foreground py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </a>
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10 dark:border-border/30 mt-2">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gradient" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white/90 dark:text-foreground/90 hover:bg-white/10 dark:hover:bg-foreground/10">
                        Logga in
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gradient" className="w-full">
                        Starta gratis
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
