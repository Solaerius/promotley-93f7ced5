import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [originalCompanyName, setOriginalCompanyName] = useState("");
  const [isSavingCompanyName, setIsSavingCompanyName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("company_name, avatar_url, company_logo_url")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setCompanyName(data.company_name || "");
        setOriginalCompanyName(data.company_name || "");
        setAvatarUrl(data.avatar_url);
        setCompanyLogoUrl(data.company_logo_url);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSaveCompanyName = async () => {
    if (!user?.id || !companyName.trim()) return;
    setIsSavingCompanyName(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ company_name: companyName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      setOriginalCompanyName(companyName);
      toast({ title: t("account.name_updated") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsSavingCompanyName(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t("settings.profile")}
        </h1>

        <div className="space-y-6">
          {/* Profile images */}
          <section className="space-y-3">
            <h2 className="text-base font-medium text-foreground">
              {t("account.profile_images")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-4 rounded-xl bg-card shadow-sm">
                <User className="h-4 w-4 mb-2 text-muted-foreground" />
                <p className="font-medium mb-2 text-sm">
                  {t("account.profile_picture")}
                </p>
                {user?.id && (
                  <ProfileImageUpload
                    userId={user.id}
                    currentUrl={avatarUrl}
                    type="avatar"
                    onUploadComplete={(url) => setAvatarUrl(url || null)}
                    size="lg"
                  />
                )}
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-card shadow-sm">
                <Building className="h-4 w-4 mb-2 text-muted-foreground" />
                <p className="font-medium mb-2 text-sm">
                  {t("account.company_logo")}
                </p>
                {user?.id && (
                  <ProfileImageUpload
                    userId={user.id}
                    currentUrl={companyLogoUrl}
                    type="company_logo"
                    onUploadComplete={(url) => setCompanyLogoUrl(url || null)}
                    size="lg"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Account info */}
          <section className="space-y-3">
            <h2 className="text-base font-medium text-foreground">
              {t("account.account_info")}
            </h2>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">
                  {t("auth.email")}
                </Label>
                <p className="font-medium mt-1 text-sm">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  {t("onboarding.company_name")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t("account.my_company_placeholder")}
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={handleSaveCompanyName}
                    disabled={
                      isSavingCompanyName ||
                      companyName === originalCompanyName
                    }
                    size="icon"
                    variant="secondary"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
