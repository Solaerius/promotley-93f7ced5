import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Ban, ArrowLeft, Shield, Mail, User, Trash2 } from "lucide-react";

interface BannedUser {
  id: string;
  email: string;
  user_id: string | null;
  ip_address: string | null;
  reason: string;
  banned_by: string;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

export default function AdminBanManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banning, setBanning] = useState(false);
  
  // Ban form state
  const [banEmail, setBanEmail] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banPermanent, setBanPermanent] = useState(true);

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("banned_users")
        .select("*")
        .order("banned_at", { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error("Error loading banned users:", error);
      toast.error("Kunde inte ladda bannade användare");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banEmail.trim() || !banReason.trim()) {
      toast.error("Ange e-post och anledning");
      return;
    }

    setBanning(true);
    try {
      // Check if user exists
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", banEmail.trim().toLowerCase())
        .maybeSingle();

      const { error } = await supabase
        .from("banned_users")
        .insert({
          email: banEmail.trim().toLowerCase(),
          user_id: userData?.id || null,
          reason: banReason.trim(),
          banned_by: user?.id,
          is_permanent: banPermanent,
          expires_at: banPermanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      toast.success(`${banEmail} har bannlysts`);
      setBanDialogOpen(false);
      setBanEmail("");
      setBanReason("");
      loadBannedUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Kunde inte bannlysa användaren");
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`${email} har avbannlysts`);
      loadBannedUsers();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Kunde inte avbannlysa användaren");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/admin')}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka till admin
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bannlysning</h1>
            <p className="text-muted-foreground">Hantera bannlysta användare</p>
          </div>
        </div>

        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              Bannlys användare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bannlys användare</DialogTitle>
              <DialogDescription>
                Ange e-postadressen till användaren du vill bannlysa. De kommer inte kunna logga in eller skapa nya konton.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-postadress</label>
                <Input
                  type="email"
                  placeholder="exempel@email.se"
                  value={banEmail}
                  onChange={(e) => setBanEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Anledning</label>
                <Textarea
                  placeholder="Beskriv varför användaren bannlyses..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="permanent"
                  checked={banPermanent}
                  onChange={(e) => setBanPermanent(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="permanent" className="text-sm">
                  Permanent bannlysning (annars 30 dagar)
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleBanUser}
                disabled={banning || !banEmail.trim() || !banReason.trim()}
              >
                {banning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                Bannlys
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {bannedUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Inga bannlysta användare</p>
            <p className="text-muted-foreground text-sm">
              Använd knappen ovan för att bannlysa användare som bryter mot reglerna
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bannedUsers.map((banned) => (
            <Card key={banned.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {banned.email}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {banned.is_permanent ? (
                        <Badge variant="destructive">Permanent</Badge>
                      ) : (
                        <Badge variant="secondary">
                          Upphör: {new Date(banned.expires_at!).toLocaleDateString("sv-SE")}
                        </Badge>
                      )}
                      {banned.user_id && (
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Konto finns
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Bannlyst {new Date(banned.banned_at).toLocaleDateString("sv-SE")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Anledning:</p>
                    <p className="text-sm text-muted-foreground">{banned.reason}</p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Avbannlys
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Avbannlys användare?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill avbannlysa {banned.email}? De kommer kunna logga in igen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleUnban(banned.id, banned.email)}>
                          Avbannlys
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
