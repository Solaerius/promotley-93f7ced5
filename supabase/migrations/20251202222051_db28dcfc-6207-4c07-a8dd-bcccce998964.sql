-- ================================================
-- MULTI-ORGANIZATION SYSTEM
-- ================================================

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  invite_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  invite_link_enabled BOOLEAN NOT NULL DEFAULT true,
  credits_pool INTEGER NOT NULL DEFAULT 50,
  max_credits INTEGER NOT NULL DEFAULT 50,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('founder', 'admin', 'member')),
  permissions JSONB NOT NULL DEFAULT '{"can_edit_settings": false, "can_use_ai": true, "can_manage_calendar": true, "can_manage_members": true}'::jsonb,
  credit_limit INTEGER,
  credits_used INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. Create organization_invites table
CREATE TABLE public.organization_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT,
  invite_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Add active_organization_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS active_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. Add organization_id to existing tables
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tokens ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_posts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.social_stats ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_analysis_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 6. Create helper function to check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- 7. Create helper function to check organization role
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE user_id = _user_id
    AND organization_id = _org_id
$$;

-- 8. Create helper function to check organization permission
CREATE OR REPLACE FUNCTION public.has_org_permission(_user_id UUID, _org_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND (
        role IN ('founder', 'admin')
        OR (permissions->>_permission)::boolean = true
      )
  )
$$;

-- 9. Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies for organizations
CREATE POLICY "Users can view orgs they belong to"
ON public.organizations FOR SELECT
USING (is_org_member(auth.uid(), id));

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their orgs"
ON public.organizations FOR UPDATE
USING (get_org_role(auth.uid(), id) IN ('founder', 'admin'));

-- 11. RLS policies for organization_members
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Founders and admins can insert members"
ON public.organization_members FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Allow self-insert when joining via invite
    user_id = auth.uid()
    OR get_org_role(auth.uid(), organization_id) IN ('founder', 'admin')
  )
);

CREATE POLICY "Founders and admins can update members"
ON public.organization_members FOR UPDATE
USING (
  get_org_role(auth.uid(), organization_id) IN ('founder', 'admin')
  AND role != 'founder' -- Cannot modify founder
);

CREATE POLICY "Founders and admins can delete members"
ON public.organization_members FOR DELETE
USING (
  get_org_role(auth.uid(), organization_id) IN ('founder', 'admin')
  AND role != 'founder' -- Cannot delete founder
  AND user_id != auth.uid() -- Cannot delete self
);

-- 12. RLS policies for organization_invites
CREATE POLICY "Members can view org invites"
ON public.organization_invites FOR SELECT
USING (is_org_member(auth.uid(), organization_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can create invites"
ON public.organization_invites FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('founder', 'admin'));

CREATE POLICY "Admins can update invites"
ON public.organization_invites FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) IN ('founder', 'admin') OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete invites"
ON public.organization_invites FOR DELETE
USING (get_org_role(auth.uid(), organization_id) IN ('founder', 'admin'));

-- 13. Create trigger to update organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_code ON public.organization_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations(invite_code);