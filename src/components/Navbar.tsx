import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[750ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] backdrop-blur-xl shadow-lg ${
        isScrolled 
          ? 'mt-3 mx-4 md:mx-6 lg:mx-12 rounded-[18px] md:rounded-[22px] lg:rounded-[24px] shadow-xl' 
          : 'mt-2 mx-3 md:mx-4 lg:mx-8 rounded-[14px] md:rounded-[16px] lg:rounded-[18px]'
      }`}
      style={{
        transitionProperty: 'margin, border-radius, box-shadow, transform',
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--secondary) / 0.12) 50%, hsl(var(--accent) / 0.15) 100%)',
        boxShadow: isScrolled 
          ? '0 8px 32px -8px hsl(var(--primary) / 0.25), 0 4px 16px -4px hsl(var(--foreground) / 0.1)' 
          : '0 4px 20px -6px hsl(var(--primary) / 0.2), 0 2px 8px -2px hsl(var(--foreground) / 0.08)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg md:text-xl">
            <img src={logo} alt="Promotley Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <span>Promotley</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Funktioner
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Priser
            </a>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
          </div>

          {/* Desktop Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <DarkModeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button variant="gradient">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Logga in</Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="gradient"
                    className="shadow-[0_6px_18px_rgba(238,89,61,0.35)] hover:shadow-[0_8px_24px_rgba(238,89,61,0.45)] transition-shadow duration-300"
                  >
                    Starta gratis
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <DarkModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <a 
                href="#how-it-works" 
                className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funktioner
              </a>
              <a 
                href="#pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Priser
              </a>
              <Link 
                to="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gradient" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Logga in</Button>
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
