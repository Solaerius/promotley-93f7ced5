import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  invite_code: string;
  invite_link_enabled: boolean;
  credits_pool: number;
  max_credits: number;
  plan: string;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "founder" | "admin" | "member";
  permissions: {
    can_edit_settings: boolean;
    can_use_ai: boolean;
    can_manage_calendar: boolean;
    can_manage_members: boolean;
  };
  credit_limit: number | null;
  credits_used: number;
  joined_at: string;
  user_email?: string;
  user_avatar?: string;
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string | null;
  invite_code: string;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  created_at: string;
}

export const useOrganization = () => {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Load user's organizations
  const loadOrganizations = useCallback(async () => {
    if (!user?.id || !session) {
      setLoading(false);
      return;
    }

    try {
      // Get all memberships for this user
      const { data: memberships, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      // Get organization details
      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      if (orgError) throw orgError;

      setOrganizations(orgs || []);
      setNeedsOnboarding(false);

      // Get user's active organization
      const { data: userData } = await supabase
        .from("users")
        .select("active_organization_id")
        .eq("id", user.id)
        .single();

      const activeOrgId = userData?.active_organization_id;
      
      if (activeOrgId && orgs?.find(o => o.id === activeOrgId)) {
        const active = orgs.find(o => o.id === activeOrgId);
        setActiveOrganization(active || null);
      } else if (orgs && orgs.length > 0) {
        // Set first org as active
        setActiveOrganization(orgs[0]);
        await supabase
          .from("users")
          .update({ active_organization_id: orgs[0].id })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session]);

  // Load current membership details
  const loadMembership = useCallback(async () => {
    if (!user?.id || !activeOrganization?.id || !session) return;

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", activeOrganization.id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setMembership(data as OrganizationMember);
    } catch (error) {
      console.error("Error loading membership:", error);
    }
  }, [user?.id, activeOrganization?.id, session]);

  // Load all members of active organization with user info via single join query
  const loadMembers = useCallback(async () => {
    if (!activeOrganization?.id || !session) return;

    try {
      // Fetch members and profiles separately to avoid exposing all user columns
      const [membersResult, profilesResult] = await Promise.all([
        supabase
          .from("organization_members")
          .select("id, organization_id, user_id, role, permissions, credit_limit, credits_used, joined_at")
          .eq("organization_id", activeOrganization.id)
          .order("joined_at", { ascending: true }),
        supabase.rpc("get_org_member_profiles", { _org_id: activeOrganization.id })
      ]);

      if (membersResult.error) throw membersResult.error;

      // Build a lookup map from profiles
      const profileMap = new Map<string, { email: string; avatar_url: string | null }>();
      (profilesResult.data || []).forEach((p: any) => {
        profileMap.set(p.id, { email: p.email, avatar_url: p.avatar_url });
      });

      // Map joined data to our interface
      const membersWithEmail = (membersResult.data || []).map((m: any) => ({
        id: m.id,
        organization_id: m.organization_id,
        user_id: m.user_id,
        role: m.role,
        permissions: m.permissions,
        credit_limit: m.credit_limit,
        credits_used: m.credits_used,
        joined_at: m.joined_at,
        user_email: profileMap.get(m.user_id)?.email ?? t("org_settings.unknown_user"),
        user_avatar: profileMap.get(m.user_id)?.avatar_url ?? null
      }));

      setMembers(membersWithEmail as OrganizationMember[]);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  }, [activeOrganization?.id, session]);

  // Load invites
  const loadInvites = useCallback(async () => {
    if (!activeOrganization?.id || !session) return;

    try {
      const { data, error } = await supabase
        .from("organization_invites")
        .select("*")
        .eq("organization_id", activeOrganization.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data as OrganizationInvite[]);
    } catch (error) {
      console.error("Error loading invites:", error);
    }
  }, [activeOrganization?.id, session]);

  // Switch active organization
  const switchOrganization = async (orgId: string) => {
    if (!user?.id || !session) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ active_organization_id: orgId })
        .eq("id", user.id);

      if (error) throw error;

      const newActive = organizations.find(o => o.id === orgId);
      setActiveOrganization(newActive || null);
      toast.success(t("org.switch_success", { name: newActive?.name }));
    } catch (error) {
      console.error("Error switching organization:", error);
      toast.error(t("org.switch_error"));
    }
  };

  // Create new organization
  const createOrganization = async (name: string, logoUrl?: string): Promise<string | null> => {
    if (!user?.id || !session) {
      toast.error(t("org.must_be_logged_in_create"));
      return null;
    }

    try {
      // Use the database function that handles everything atomically
      const { data: orgId, error } = await supabase
        .rpc('create_organization_with_founder', {
          _name: name,
          _logo_url: logoUrl || null,
          _user_id: user.id
        });

      if (error) throw error;

      toast.success(t("org.created"));
      await loadOrganizations();
      return orgId;
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(t("org.create_error"));
      return null;
    }
  };

  // Join organization by invite code
  const joinByCode = async (code: string): Promise<boolean> => {
    if (!user?.id || !session) {
      toast.error(t("org.must_be_logged_in_join"));
      return false;
    }

    try {
      // First check organization invite code via secure RPC
      const { data: orgResults } = await supabase
        .rpc("lookup_org_by_invite_code", { _invite_code: code.toUpperCase() });

      const org = orgResults && orgResults.length > 0 ? orgResults[0] : null;

      if (org) {
        // Join directly via org invite code
        const { error } = await supabase
          .from("organization_members")
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "member",
            permissions: {
              can_edit_settings: false,
              can_use_ai: true,
              can_manage_calendar: true,
              can_manage_members: true
            }
          });

        if (error) {
          if (error.message.includes("duplicate")) {
            toast.error(t("org.already_member"));
            return false;
          }
          throw error;
        }

        await supabase
          .from("users")
          .update({ active_organization_id: org.id })
          .eq("id", user.id);

        toast.success(t("org.welcome", { name: org.name }));
        await loadOrganizations();
        return true;
      }

      // Check individual invite code
      const { data: invite } = await supabase
        .from("organization_invites")
        .select("*, organizations(*)")
        .eq("invite_code", code.toUpperCase())
        .eq("status", "pending")
        .single();

      if (!invite) {
        toast.error(t("org.invalid_code"));
        return false;
      }

      // Join via individual invite
      const { error: joinError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: invite.organization_id,
          user_id: user.id,
          role: "member",
          permissions: {
            can_edit_settings: false,
            can_use_ai: true,
            can_manage_calendar: true,
            can_manage_members: true
          }
        });

      if (joinError) throw joinError;

      // Mark invite as accepted
      await supabase
        .from("organization_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      await supabase
        .from("users")
        .update({ active_organization_id: invite.organization_id })
        .eq("id", user.id);

      toast.success(t("org.joined"));
      await loadOrganizations();
      return true;
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error(t("org.join_error"));
      return false;
    }
  };

  // Create email invite
  const createEmailInvite = async (email: string): Promise<boolean> => {
    if (!activeOrganization?.id || !user?.id || !session) {
      toast.error(t("org_settings.must_be_logged_in_invite"));
      return false;
    }

    try {
      // Create invite record in database
      const { data: invite, error } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: activeOrganization.id,
          email: email.toLowerCase(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send email via edge function
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        throw new Error("No valid session for sending email");
      }

      const { error: emailError } = await supabase.functions.invoke('send-org-invite', {
        body: {
          email: email.toLowerCase(),
          inviteCode: invite.invite_code,
        }
      });

      if (emailError) {
        console.error("Error sending invite email:", emailError);
        // Don't fail the whole operation - invite is created, just email failed
        toast.success(t("org_settings.invite_created", { email }));
      } else {
        toast.success(t("org_settings.invite_sent", { email }));
      }

      await loadInvites();
      return true;
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error(t("org_settings.invite_error"));
      return false;
    }
  };

  // Update member permissions
  const updateMemberPermissions = async (
    memberId: string,
    permissions: OrganizationMember["permissions"]
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ permissions })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(t("org_settings.permissions_updated"));
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error(t("org_settings.permissions_error"));
      return false;
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: "admin" | "member"): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(role === "admin" ? t("org_settings.role_upgraded") : t("org_settings.role_downgraded"));
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(t("org_settings.role_error"));
      return false;
    }
  };

  // Remove member
  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success(t("org.member_removed"));
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(t("org.remove_member_error"));
      return false;
    }
  };

  // Update organization settings
  const updateOrganization = async (updates: Partial<Organization>): Promise<boolean> => {
    if (!activeOrganization?.id || !session) return false;

    try {
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", activeOrganization.id);

      if (error) throw error;

      setActiveOrganization(prev => prev ? { ...prev, ...updates } : null);
      toast.success(t("toasts.saved"));
      return true;
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(t("toasts.error"));
      return false;
    }
  };

  // Check if user has permission
  const hasPermission = (permission: keyof OrganizationMember["permissions"]): boolean => {
    if (!membership) return false;
    if (membership.role === "founder" || membership.role === "admin") return true;
    return membership.permissions[permission] === true;
  };

  // Initial load
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Load membership when active org changes
  useEffect(() => {
    loadMembership();
    loadMembers();
    loadInvites();
  }, [loadMembership, loadMembers, loadInvites]);

  return {
    organizations,
    activeOrganization,
    membership,
    members,
    invites,
    loading,
    needsOnboarding,
    switchOrganization,
    createOrganization,
    joinByCode,
    createEmailInvite,
    updateMemberPermissions,
    updateMemberRole,
    removeMember,
    updateOrganization,
    hasPermission,
    refresh: loadOrganizations,
    refreshMembers: loadMembers,
    refreshInvites: loadInvites,
  };
};
