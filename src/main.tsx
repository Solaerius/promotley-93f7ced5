import './lib/i18n';
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { NavbarPositionProvider } from "./hooks/useNavbarPosition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NavbarPositionProvider>
        <App />
      </NavbarPositionProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
