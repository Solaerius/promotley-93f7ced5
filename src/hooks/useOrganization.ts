import { useState, useEffect, useCallback } from "react";
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
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Load user's organizations
  const loadOrganizations = useCallback(async () => {
    if (!user?.id) {
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
  }, [user?.id]);

  // Load current membership details
  const loadMembership = useCallback(async () => {
    if (!user?.id || !activeOrganization?.id) return;

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
  }, [user?.id, activeOrganization?.id]);

  // Load all members of active organization
  const loadMembers = useCallback(async () => {
    if (!activeOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", activeOrganization.id)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      // Get user emails
      const memberIds = data?.map(m => m.user_id) || [];
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", memberIds);

      const membersWithEmail = data?.map(m => ({
        ...m,
        user_email: users?.find(u => u.id === m.user_id)?.email
      })) || [];

      setMembers(membersWithEmail as OrganizationMember[]);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  }, [activeOrganization?.id]);

  // Load invites
  const loadInvites = useCallback(async () => {
    if (!activeOrganization?.id) return;

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
  }, [activeOrganization?.id]);

  // Switch active organization
  const switchOrganization = async (orgId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ active_organization_id: orgId })
        .eq("id", user.id);

      if (error) throw error;

      const newActive = organizations.find(o => o.id === orgId);
      setActiveOrganization(newActive || null);
      toast.success(`Bytte till ${newActive?.name}`);
    } catch (error) {
      console.error("Error switching organization:", error);
      toast.error("Kunde inte byta organisation");
    }
  };

  // Create new organization
  const createOrganization = async (name: string, logoUrl?: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name, logo_url: logoUrl })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as founder
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: "founder",
          permissions: {
            can_edit_settings: true,
            can_use_ai: true,
            can_manage_calendar: true,
            can_manage_members: true
          }
        });

      if (memberError) throw memberError;

      // Set as active organization
      await supabase
        .from("users")
        .update({ active_organization_id: org.id })
        .eq("id", user.id);

      toast.success("Organisation skapad!");
      await loadOrganizations();
      return org.id;
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Kunde inte skapa organisation");
      return null;
    }
  };

  // Join organization by invite code
  const joinByCode = async (code: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // First check organization invite code
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("invite_code", code.toUpperCase())
        .eq("invite_link_enabled", true)
        .single();

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
            toast.error("Du är redan medlem i denna organisation");
            return false;
          }
          throw error;
        }

        await supabase
          .from("users")
          .update({ active_organization_id: org.id })
          .eq("id", user.id);

        toast.success(`Välkommen till ${org.name}!`);
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
        toast.error("Ogiltig eller utgången inbjudningskod");
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

      toast.success("Du har gått med i organisationen!");
      await loadOrganizations();
      return true;
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error("Kunde inte gå med i organisationen");
      return false;
    }
  };

  // Create email invite
  const createEmailInvite = async (email: string): Promise<boolean> => {
    if (!activeOrganization?.id || !user?.id) return false;

    try {
      const { error } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: activeOrganization.id,
          email: email.toLowerCase(),
          created_by: user.id
        });

      if (error) throw error;

      toast.success(`Inbjudan skickad till ${email}`);
      await loadInvites();
      return true;
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Kunde inte skapa inbjudan");
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

      toast.success("Behörigheter uppdaterade");
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Kunde inte uppdatera behörigheter");
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

      toast.success(role === "admin" ? "Medlem uppgraderad till Admin" : "Admin nedgraderad till Medlem");
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Kunde inte uppdatera roll");
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

      toast.success("Medlem borttagen");
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Kunde inte ta bort medlem");
      return false;
    }
  };

  // Update organization settings
  const updateOrganization = async (updates: Partial<Organization>): Promise<boolean> => {
    if (!activeOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", activeOrganization.id);

      if (error) throw error;

      setActiveOrganization(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Inställningar sparade");
      return true;
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Kunde inte spara inställningar");
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
