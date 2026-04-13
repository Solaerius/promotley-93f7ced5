import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.success(t("org_settings.code_copied"));
    }
  };

  const handleCopyInviteLink = () => {
    if (activeOrganization?.invite_code) {
      const link = `${window.location.origin}/join/${activeOrganization.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success(t("org_settings.link_copied"));
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
    toast.success(t("org_settings.all_vd_done"));
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
          <h1 className="text-3xl font-bold">{t("org_settings.title")}</h1>
          <p className="text-muted-foreground">
            {t("org_settings.subtitle", { name: activeOrganization.name })}
          </p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("org_settings.tab_general")}
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("org_settings.tab_members")} ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("org_settings.tab_invites")}
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("org_settings.details_title")}</CardTitle>
                <CardDescription>
                  {t("org_settings.details_desc")}
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
                    <Label htmlFor="orgName">{t("org_settings.org_name_label")}</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={t("org_settings.org_name_placeholder")}
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
                  {isSaving ? t("org_settings.saving") : t("org_settings.save_changes")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  {t("org_settings.invite_settings_title")}
                </CardTitle>
                <CardDescription>
                  {t("org_settings.invite_settings_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("org_settings.invite_link_active")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("org_settings.invite_link_desc")}
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
                        <p className="text-sm font-medium">{t("org_settings.invite_code_label")}</p>
                        <p className="text-lg font-mono">{activeOrganization.invite_code}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyInviteCode}>
                        <Copy className="h-4 w-4 mr-1" />
                        {t("org_settings.copy")}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t("org_settings.invite_link_label")}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {window.location.origin}/join/{activeOrganization.invite_code}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                        <Copy className="h-4 w-4 mr-1" />
                        {t("org_settings.copy")}
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
                    {t("org_settings.founder_actions_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog open={showGiveAllVdWarning} onOpenChange={setShowGiveAllVdWarning}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {t("org_settings.give_all_vd")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          {t("org_settings.warning")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("org_settings.vd_warning_desc")}
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>{t("org_settings.vd_warning_1")}</li>
                            <li>{t("org_settings.vd_warning_2")}</li>
                            <li>{t("org_settings.vd_warning_3")}</li>
                          </ul>
                          <p className="mt-2 font-medium">{t("org_settings.vd_warning_confirm")}</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("org_settings.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGiveAllVdStatus}>
                          {t("org_settings.confirm_vd")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t("org_settings.members_title")} ({members.length})</CardTitle>
                <CardDescription>
                  {t("org_settings.members_desc")}
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
                        <AvatarImage src={member.user_avatar || undefined} />
                        <AvatarFallback>
                          {member.user_email?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user_email || t("org_settings.unknown_user")}</p>
                          {member.role === "founder" && (
                            <Badge variant="default" className="bg-yellow-500">
                              <Crown className="h-3 w-3 mr-1" />
                              {t("org_settings.founder_badge")}
                            </Badge>
                          )}
                          {member.role === "admin" && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              {t("org_settings.admin_badge")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("org_settings.joined")} {new Date(member.joined_at).toLocaleDateString("sv-SE")}
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
                            {member.role === "admin" ? t("org_settings.remove_admin") : t("org_settings.make_admin")}
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
                              <AlertDialogTitle>{t("org_settings.remove_member_title")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("org_settings.remove_member_desc", { email: member.user_email })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("org_settings.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMember(member.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                {t("org_settings.remove")}
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
                    <h4 className="font-medium mb-4">{t("org_settings.permissions_heading")}</h4>
                    {members.filter(m => m.role === "member").map((member) => (
                      <div key={member.id} className="p-4 border rounded-lg mb-3">
                        <p className="font-medium mb-3">{member.user_email}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "can_edit_settings", label: t("org_settings.perm_edit_settings") },
                            { key: "can_use_ai", label: t("org_settings.perm_use_ai") },
                            { key: "can_manage_calendar", label: t("org_settings.perm_manage_calendar") },
                            { key: "can_manage_members", label: t("org_settings.perm_manage_members") },
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
                <CardTitle>{t("org_settings.send_invite_title")}</CardTitle>
                <CardDescription>
                  {t("org_settings.send_invite_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("org_settings.invite_placeholder")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleSendEmailInvite} disabled={isSendingInvite || !inviteEmail.trim()}>
                    {isSendingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-1" />
                    )}
                    {isSendingInvite ? t("org_settings.sending") : t("org_settings.send")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("org_settings.pending_invites_title")} ({invites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t("org_settings.no_pending_invites")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invite.email || t("org_settings.invite_code_label2")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("org_settings.invite_code_label2")}: {invite.invite_code} • {t("org_settings.expires")} {new Date(invite.expires_at).toLocaleDateString("sv-SE")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(invite.invite_code);
                            toast.success(t("org_settings.invite_code_copied"));
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
