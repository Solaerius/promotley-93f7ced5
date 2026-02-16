import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Settings, Users, Link as LinkIcon, Copy, Mail, Loader2, Shield, Crown, UserMinus, Save } from "lucide-react";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { motion } from "framer-motion";

const OrganizationContent = () => {
  const { 
    activeOrganization, 
    membership, 
    members, 
    invites,
    updateOrganization,
    createEmailInvite,
    removeMember,
  } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      setOrgName(activeOrganization.name);
      setInviteLinkEnabled(activeOrganization.invite_link_enabled);
    }
  }, [activeOrganization]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateOrganization({ name: orgName, invite_link_enabled: inviteLinkEnabled });
    setIsSaving(false);
  };

  const handleCopyInviteCode = () => {
    if (activeOrganization?.invite_code) {
      navigator.clipboard.writeText(activeOrganization.invite_code);
      toast.success("Inbjudningskod kopierad!");
    }
  };

  const handleCopyInviteLink = () => {
    if (activeOrganization?.invite_code) {
      const link = `${window.location.origin}/join/${activeOrganization.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Inbjudningslänk kopierad!");
    }
  };

  const handleSendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsSendingInvite(true);
    const success = await createEmailInvite(inviteEmail.trim());
    if (success) setInviteEmail("");
    setIsSendingInvite(false);
  };

  if (!activeOrganization || !membership) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isFounder = membership.role === "founder";
  const isAdmin = membership.role === "admin" || isFounder;

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="general">
        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-muted/50 p-1">
            <TabsTrigger value="general" className="flex items-center gap-2 rounded-full px-4">
              <Settings className="h-4 w-4" />
              Allmänt
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 rounded-full px-4">
              <Users className="h-4 w-4" />
              Medlemmar
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2 rounded-full px-4">
              <Mail className="h-4 w-4" />
              Inbjudningar
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Organisationsdetaljer</h3>
            <div className="flex items-start gap-6 bg-muted/30 rounded-2xl p-6">
              <ProfileImageUpload
                userId={activeOrganization.id}
                currentUrl={activeOrganization.logo_url}
                type="company_logo"
                onUploadComplete={(url) => updateOrganization({ logo_url: url })}
                size="lg"
              />
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Organisationsnamn</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)} 
                      className="bg-background border-border/50"
                    />
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={isSaving || orgName === activeOrganization.name}
                      size="icon"
                      variant="secondary"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Inbjudningsinställningar</h3>
            </div>
            
            <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inbjudningslänk aktiv</p>
                  <p className="text-sm text-muted-foreground">Tillåt nya medlemmar via länk</p>
                </div>
                <Switch
                  checked={inviteLinkEnabled}
                  onCheckedChange={(checked) => {
                    setInviteLinkEnabled(checked);
                    updateOrganization({ invite_link_enabled: checked });
                  }}
                />
              </div>
              
              {inviteLinkEnabled && (
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kod</p>
                      <p className="font-mono text-sm">{activeOrganization.invite_code}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyInviteCode}>
                      <Copy className="h-4 w-4 mr-1" />
                      Kopiera
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Länk</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {window.location.origin}/join/{activeOrganization.invite_code}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyInviteLink}>
                      <Copy className="h-4 w-4 mr-1" />
                      Kopiera
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-0">
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Medlemmar ({members.length})</h3>
            <div className="space-y-2">
              {members.map((member, index) => (
                <motion.div 
                  key={member.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.user_email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{member.user_email}</p>
                        {member.role === "founder" && (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border-0 text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Grundare
                          </Badge>
                        )}
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-xs border-0">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && member.role !== "founder" && member.user_id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort medlem?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMember(member.id)}>
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        </TabsContent>

        {/* Invites */}
        <TabsContent value="invites" className="space-y-6 mt-0">
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Bjud in via e-post</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="e-post@exempel.se"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-muted/30 border-0"
              />
              <Button onClick={handleSendEmailInvite} disabled={isSendingInvite || !inviteEmail.trim()}>
                {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Skicka
              </Button>
            </div>
          </motion.section>

          {invites.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">Väntande inbjudningar</h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <span className="text-sm">{invite.email}</span>
                    <Badge variant="outline" className="border-0 bg-warning/10 text-warning">Väntande</Badge>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationContent;
