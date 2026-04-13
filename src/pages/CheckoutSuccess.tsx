import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CheckoutSuccess = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/auth");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {!loading && (
          user ? (
            <>
              <h1 className="text-2xl font-bold text-white">Tack för ditt köp!</h1>
              <p className="text-white/70">Din plan aktiveras inom kort. Du omdirigeras till dashboarden...</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">Betalning mottagen!</h1>
              <p className="text-white/70">Logga in för att se din plan. Du omdirigeras till inloggningen...</p>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
