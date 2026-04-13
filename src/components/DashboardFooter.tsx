import { Link } from "react-router-dom";

export function DashboardFooter() {
  return (
    <footer className="py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/30">
      <p>
        © {new Date().getFullYear()} Promotley UF ·{" "}
        <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
          Integritetspolicy
        </Link>
        {" · "}
        <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
          Villkor
        </Link>
      </p>
    </footer>
  );
}
