import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Settings, Users, Link as LinkIcon, Copy, Mail, Loader2, 
  Shield, ShieldCheck, Trash2, UserMinus, Crown, AlertTriangle,
  Check, X
} from "lucide-react";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";

export default function OrganizationSettings() {
  const { 
    activeOrganization, 
    membership, 
    members, 
    invites,
    updateOrganization,
    createEmailInvite,
    updateMemberPermissions,
    updateMemberRole,
    removeMember,
    refreshMembers,
    refreshInvites,
    hasPermission
  } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [showGiveAllVdWarning, setShowGiveAllVdWarning] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      setOrgName(activeOrganization.name);
      setInviteLinkEnabled(activeOrganization.invite_link_enabled);
    }
  }, [activeOrganization]);

  useEffect(() => {
    // Redirect if not admin/founder
    if (membership && membership.role === "member" && !membership.permissions.can_edit_settings) {
      navigate("/dashboard");
    }
  }, [membership, navigate]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateOrganization({
      name: orgName,
      invite_link_enabled: inviteLinkEnabled
    });
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
    if (success) {
      setInviteEmail("");
    }
    setIsSendingInvite(false);
  };

  const handleTogglePermission = async (
    memberId: string, 
    currentPermissions: any, 
    permission: string
  ) => {
    const newPermissions = {
      ...currentPermissions,
      [permission]: !currentPermissions[permission]
    };
    await updateMemberPermissions(memberId, newPermissions);
  };

  const handleGiveAllVdStatus = async () => {
    const nonFounderMembers = members.filter(m => m.role !== "founder");
    for (const member of nonFounderMembers) {
      await updateMemberRole(member.id, "admin");
    }
    setShowGiveAllVdWarning(false);
    toast.success("Alla medlemmar har nu VD-status");
  };

  if (!activeOrganization || !membership) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isFounder = membership.role === "founder";
  const isAdmin = membership.role === "admin" || isFounder;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organisationsinställningar</h1>
          <p className="text-muted-foreground">
            Hantera {activeOrganization.name}
          </p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Allmänt
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Medlemmar ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Inbjudningar
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organisationsdetaljer</CardTitle>
                <CardDescription>
                  Grundläggande information om din organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <ProfileImageUpload
                    userId={activeOrganization.id}
                    currentUrl={activeOrganization.logo_url}
                    type="company_logo"
                    onUploadComplete={(url) => updateOrganization({ logo_url: url })}
                    size="lg"
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="orgName">Organisationsnamn</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Mitt företag"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving || orgName === activeOrganization.name}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Spara ändringar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Inbjudningsinställningar
                </CardTitle>
                <CardDescription>
                  Hantera hur nya medlemmar kan gå med
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inbjudningslänk aktiv</p>
                    <p className="text-sm text-muted-foreground">
                      Tillåt nya medlemmar att gå med via länk eller kod
                    </p>
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
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Inbjudningskod</p>
                        <p className="text-lg font-mono">{activeOrganization.invite_code}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyInviteCode}>
                        <Copy className="h-4 w-4 mr-1" />
                        Kopiera
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Inbjudningslänk</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {window.location.origin}/join/{activeOrganization.invite_code}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                        <Copy className="h-4 w-4 mr-1" />
                        Kopiera
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {isFounder && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Grundaråtgärder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog open={showGiveAllVdWarning} onOpenChange={setShowGiveAllVdWarning}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Ge alla VD-status
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Varning
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta ger ALLA medlemmar full administratörsåtkomst. De kommer kunna:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Ändra organisationens inställningar</li>
                            <li>Bjuda in och ta bort andra medlemmar</li>
                            <li>Ändra andras behörigheter</li>
                          </ul>
                          <p className="mt-2 font-medium">Är du säker?</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGiveAllVdStatus}>
                          Ja, ge alla VD-status
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Medlemmar ({members.length})</CardTitle>
                <CardDescription>
                  Hantera medlemmar och deras behörigheter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.user_email?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user_email}</p>
                          {member.role === "founder" && (
                            <Badge variant="default" className="bg-yellow-500">
                              <Crown className="h-3 w-3 mr-1" />
                              Grundare
                            </Badge>
                          )}
                          {member.role === "admin" && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Gick med {new Date(member.joined_at).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                    </div>

                    {isAdmin && member.role !== "founder" && member.user_id !== user?.id && (
                      <div className="flex items-center gap-2">
                        {isFounder && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMemberRole(
                              member.id, 
                              member.role === "admin" ? "member" : "admin"
                            )}
                          >
                            {member.role === "admin" ? "Ta bort admin" : "Gör till admin"}
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort medlem?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort {member.user_email} från organisationen?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeMember(member.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}

                {/* Permissions section for non-admin members */}
                {members.filter(m => m.role === "member").length > 0 && isAdmin && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Medlemsbehörigheter</h4>
                    {members.filter(m => m.role === "member").map((member) => (
                      <div key={member.id} className="p-4 border rounded-lg mb-3">
                        <p className="font-medium mb-3">{member.user_email}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "can_edit_settings", label: "Ändra inställningar" },
                            { key: "can_use_ai", label: "Använda AI" },
                            { key: "can_manage_calendar", label: "Hantera kalender" },
                            { key: "can_manage_members", label: "Hantera medlemmar" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm">{label}</span>
                              <Switch
                                checked={member.permissions[key as keyof typeof member.permissions]}
                                onCheckedChange={() => handleTogglePermission(
                                  member.id,
                                  member.permissions,
                                  key
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skicka e-postinbjudan</CardTitle>
                <CardDescription>
                  Bjud in specifika personer via e-post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="namn@exempel.se"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleSendEmailInvite} disabled={isSendingInvite || !inviteEmail.trim()}>
                    {isSendingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-1" />
                    )}
                    Skicka
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Väntande inbjudningar ({invites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Inga väntande inbjudningar
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invite.email || "Inbjudningskod"}</p>
                          <p className="text-sm text-muted-foreground">
                            Kod: {invite.invite_code} • Upphör {new Date(invite.expires_at).toLocaleDateString("sv-SE")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(invite.invite_code);
                            toast.success("Kod kopierad!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
