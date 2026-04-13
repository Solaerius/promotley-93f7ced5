import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Settings, Users, Link as LinkIcon, Copy, Mail, Loader2, Shield, Crown, UserMinus, Save, Share2 } from "lucide-react";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";

const OrganizationContent = () => {
  const { t } = useTranslation();
  const { activeOrganization, membership, members, invites, updateOrganization, createEmailInvite, removeMember } = useOrganization();
  const { user } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members" | "invites">("general");

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
      toast.success(t('org.invite_copied'));
    }
  };

  const handleCopyInviteLink = () => {
    if (activeOrganization?.invite_code) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${activeOrganization.invite_code}`);
      toast.success(t('org.invite_link_copied'));
    }
  };

  const handleShareInviteLink = async () => {
    if (!activeOrganization?.invite_code) return;
    const link = `${window.location.origin}/join/${activeOrganization.invite_code}`;
    if (navigator.share) {
      try { await navigator.share({ title: t('org.join_heading', { name: activeOrganization.name }), url: link }); } catch {}
    } else {
      navigator.clipboard.writeText(link);
      toast.success(t('org.invite_link_copied'));
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isFounder = membership.role === "founder";
  const isAdmin = membership.role === "admin" || isFounder;

  const tabs = [
    { key: "general" as const, label: t('org.tab_general'), icon: Settings },
    { key: "members" as const, label: t('org.tab_members'), icon: Users },
    { key: "invites" as const, label: t('org.tab_invitations'), icon: Mail },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <section className="space-y-3">
            <h3 className="text-base font-medium text-foreground">{t('org.details_heading')}</h3>
            <div className="flex items-start gap-5 rounded-xl bg-card shadow-sm p-5">
              <ProfileImageUpload userId={activeOrganization.id} currentUrl={activeOrganization.logo_url} type="company_logo" onUploadComplete={(url) => updateOrganization({ logo_url: url })} size="lg" />
              <div className="flex-1 space-y-2">
                <Label className="text-sm">{t('org.org_name_label')}</Label>
                <div className="flex gap-2">
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-background border-border" />
                  <Button onClick={handleSaveSettings} disabled={isSaving || orgName === activeOrganization.name} size="icon" variant="secondary">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-medium text-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" /> {t('org.invite_settings')}
            </h3>
            <div className="rounded-xl bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('org.invite_link_active')}</p>
                  <p className="text-xs text-muted-foreground">{t('org.allow_new_members')}</p>
                </div>
                <Switch checked={inviteLinkEnabled} onCheckedChange={(checked) => { setInviteLinkEnabled(checked); updateOrganization({ invite_link_enabled: checked }); }} />
              </div>
              {inviteLinkEnabled && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('org.code_label')}</p>
                      <p className="font-mono text-sm">{activeOrganization.invite_code}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyInviteCode}><Copy className="h-4 w-4 mr-1" /> {t('org.copy')}</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('org.link')}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{window.location.origin}/join/{activeOrganization.invite_code}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleCopyInviteLink}><Copy className="h-4 w-4 mr-1" /> {t('org.copy')}</Button>
                      <Button variant="ghost" size="sm" onClick={handleShareInviteLink}><Share2 className="h-4 w-4 mr-1" /> {t('org.share')}</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Members */}
      {activeTab === "members" && (
        <section className="space-y-3">
          <h3 className="text-base font-medium text-foreground">{t('org.members_heading')} ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-foreground text-sm">{member.user_email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{member.user_email}</p>
                      {member.role === "founder" && <Badge variant="secondary" className="text-xs"><Crown className="h-3 w-3 mr-1" /> {t('org.role_founder')}</Badge>}
                      {member.role === "admin" && <Badge variant="secondary" className="text-xs"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>}
                    </div>
                  </div>
                </div>
                {isAdmin && member.role !== "founder" && member.user_id !== user?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"><UserMinus className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>{t('org.remove_member_confirm')}</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('org.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMember(member.id)}>{t('org.remove')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invites */}
      {activeTab === "invites" && (
        <div className="space-y-4">
          <section className="space-y-3">
            <h3 className="text-base font-medium text-foreground">{t('org.invite_by_email')}</h3>
            <div className="flex gap-2">
              <Input type="email" placeholder="e-post@exempel.se" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-background border-border" />
              <Button onClick={handleSendEmailInvite} disabled={isSendingInvite || !inviteEmail.trim()}>
                {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {t('org.send')}
              </Button>
            </div>
          </section>
          {invites.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-base font-medium text-foreground">{t('org.pending_invitations')}</h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-sm">
                    <span className="text-sm">{invite.email}</span>
                    <Badge variant="secondary" className="text-xs">{t('org.pending')}</Badge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationContent;
