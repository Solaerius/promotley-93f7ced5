import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src={logo} alt="Promotley Logo" className="w-10 h-10" />
            <span>Promotley</span>
          </Link>

          {/* Navigation */}
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

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Logga in</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient">Kom igång</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
