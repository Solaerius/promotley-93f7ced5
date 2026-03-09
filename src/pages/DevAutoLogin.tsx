import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL || "";
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || "";

const DevAutoLogin = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Förbereder testinloggning...");

  useEffect(() => {
    const hostname = window.location.hostname;
    const isAllowed =
      hostname === "localhost" ||
      hostname.includes("lovable.app") ||
      hostname.includes("lovableproject.com");

    if (!isAllowed) {
      navigate("/", { replace: true });
      return;
    }

    if (!DEV_EMAIL || !DEV_PASSWORD) {
      setStatus("Saknar VITE_DEV_EMAIL / VITE_DEV_PASSWORD i .env");
      return;
    }

    const autoLogin = async () => {
      try {
        // First, ensure the test account exists via edge function
        setStatus("Skapar testkonto...");
        const { error: setupError } = await supabase.functions.invoke("dev-setup", {
          body: { email: DEV_EMAIL, password: DEV_PASSWORD },
        });

        if (setupError) {
          console.warn("Dev setup warning:", setupError);
          // Continue anyway — account might already exist
        }

        // Sign in
        setStatus("Loggar in...");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        });

        if (signInError) {
          setStatus(`Inloggningsfel: ${signInError.message}`);
          console.error("Dev auto-login failed:", signInError);
          return;
        }

        setStatus("Inloggad! Omdirigerar...");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Dev auto-login error:", err);
        setStatus("Oväntat fel vid auto-login");
      }
    };

    autoLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium">
          DEV ONLY — Auto Login
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default DevAutoLogin;
