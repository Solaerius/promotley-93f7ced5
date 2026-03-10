import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, companyName?: string, inviteCode?: string, emailPrefs?: { newsletter: boolean; offers: boolean }, promoCode?: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let hasHandledRedirect = false;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Auth state change detected
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Only handle OAuth sign-in redirect (for Google login, etc.)
        // Don't redirect for regular signups - those are handled by Auth.tsx
        if (event === 'SIGNED_IN' && session && window.location.pathname === '/auth' && !hasHandledRedirect) {
          // Check if this is an OAuth login (not email/password signup)
          const isOAuth = session.user?.app_metadata?.provider !== 'email';
          
          if (isOAuth) {
            hasHandledRedirect = true;
            // OAuth users - check if email is verified
            if (session.user?.email_confirmed_at) {
              navigate("/dashboard");
            } else {
              navigate("/verify-email");
            }
          }
          // For email/password signups, Auth.tsx handles the redirect
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        toast({
          title: "E-post ej verifierad",
          description: "Kontrollera din inkorg för att verifiera din e-post.",
        });
        navigate("/verify-email");
        return { error: null };
      }
      
      toast({
        title: "Inloggning lyckades!",
        description: "Du omdirigeras till dashboard...",
      });
      navigate("/dashboard");
    }

    return { error };
  };

  const signUp = async (email: string, password: string, companyName?: string, inviteCode?: string, emailPrefs?: { newsletter: boolean; offers: boolean }, promoCode?: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          company_name: companyName,
          invite_code: inviteCode || undefined,
          promo_code: promoCode || undefined,
        }
      }
    });

    if (!error && data.user) {
      // Update user profile with company name and email prefs (with retry)
      const updateWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          const updateData: Record<string, any> = {};
          if (companyName) updateData.company_name = companyName;
          if (emailPrefs) {
            updateData.email_newsletter = emailPrefs.newsletter;
            updateData.email_offers = emailPrefs.offers;
          }
          if (Object.keys(updateData).length === 0) return;
          
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', data.user!.id);
          if (!updateError) return;
          if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
      };
      updateWithRetry();

      // Check if email confirmation is required
      const needsVerification = !data.user.email_confirmed_at;
      
      if (needsVerification) {
        toast({
          title: "Konto skapat!",
          description: "Kontrollera din e-post för att verifiera ditt konto.",
        });
      } else {
        toast({
          title: "Konto skapat!",
          description: "Du kan nu logga in.",
        });
      }

      return { error: null, needsVerification };
    }

    return { error, needsVerification: false };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast({
      title: "Utloggad",
      description: "Du har loggats ut framgångsrikt.",
    });
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
