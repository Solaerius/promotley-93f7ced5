import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Vänta tills auth är klar
      if (loading) {
        console.log('AdminRoute: Auth loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('AdminRoute: No user found');
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      console.log('AdminRoute: Checking admin status for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      console.log('AdminRoute: Query result:', { data, error });
      
      setIsAdmin(!!data && !error);
      setChecking(false);
    };

    checkAdminStatus();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
