import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Gift, Users } from "lucide-react";

type UserPlan = "starter" | "growth" | "pro";

interface User {
  id: string;
  email: string;
  plan: UserPlan;
  credits_left: number;
  max_credits: number;
  renewal_date: string;
  sponsored_until: string | null;
  created_at: string;
}

const PLAN_NAMES: Record<UserPlan, string> = {
  starter: "Starter (29 kr)",
  growth: "Growth (49 kr)",
  pro: "Pro (99 kr)"
};

const PLAN_CREDITS: Record<UserPlan, number> = {
  starter: 50,
  growth: 100,
  pro: 300
};

export default function AdminUserManagement() {
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Cast the data to User[] since we know the plan types are correct
      setUsers((data || []) as unknown as User[]);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Kunde inte ladda användare");
    } finally {
      setLoading(false);
    }
  };

  const sponsorUser = async (userId: string, plan: UserPlan, months: number) => {
    try {
      setUpdating(userId);
      
      const sponsoredUntil = new Date();
      sponsoredUntil.setMonth(sponsoredUntil.getMonth() + months);
      
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const maxCredits = PLAN_CREDITS[plan];

      const { error } = await supabase
        .from("users")
        .update({
          plan,
          sponsored_until: sponsoredUntil.toISOString(),
          renewal_date: renewalDate.toISOString(),
          max_credits: maxCredits,
          credits_left: maxCredits,
          credits_used: 0
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Användaren har fått ${PLAN_NAMES[plan]} i ${months} månad(er)`);
      loadUsers();
    } catch (error) {
      console.error("Error sponsoring user:", error);
      toast.error("Kunde inte sponsra användare");
    } finally {
      setUpdating(null);
    }
  };

  const removeSponsor = async (userId: string) => {
    try {
      setUpdating(userId);
      
      const { error } = await supabase
        .from("users")
        .update({
          plan: "starter",
          sponsored_until: null,
          max_credits: 50,
          credits_left: 1
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Sponsring borttagen");
      loadUsers();
    } catch (error) {
      console.error("Error removing sponsor:", error);
      toast.error("Kunde inte ta bort sponsring");
    } finally {
      setUpdating(null);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Användarhantering</h1>
          <p className="text-muted-foreground">Ge användare gratis tillgång till paket</p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{user.email}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{PLAN_NAMES[user.plan] || user.plan}</Badge>
                    {user.sponsored_until && new Date(user.sponsored_until) > new Date() && (
                      <Badge variant="default" className="bg-accent">
                        <Gift className="h-3 w-3 mr-1" />
                        Sponsrad till {new Date(user.sponsored_until).toLocaleDateString("sv-SE")}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{user.credits_left} / {user.max_credits} krediter</p>
                  <p className="text-xs">Medlem sedan {new Date(user.created_at).toLocaleDateString("sv-SE")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Select
                  disabled={updating === user.id}
                  onValueChange={(value) => {
                    const [plan, months] = value.split("-");
                    sponsorUser(user.id, plan as UserPlan, parseInt(months));
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ge paket..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter-1">Starter - 1 mån</SelectItem>
                    <SelectItem value="starter-3">Starter - 3 mån</SelectItem>
                    <SelectItem value="growth-1">Growth - 1 mån</SelectItem>
                    <SelectItem value="growth-3">Growth - 3 mån</SelectItem>
                    <SelectItem value="pro-1">Pro - 1 mån</SelectItem>
                    <SelectItem value="pro-3">Pro - 3 mån</SelectItem>
                  </SelectContent>
                </Select>

                {user.sponsored_until && new Date(user.sponsored_until) > new Date() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSponsor(user.id)}
                    disabled={updating === user.id}
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ta bort sponsring"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
