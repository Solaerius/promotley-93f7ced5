import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, Users } from "lucide-react";
import logo from "@/assets/logo.png";

export default function OAuthLandingScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <img src={logo} alt="Promotley" className="h-10 w-10" />
        <span className="font-bold text-xl">Promotley</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('onboarding.oauth_welcome')}</h1>
        <p className="text-muted-foreground">{t('onboarding.oauth_subtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Register company */}
        <button
          onClick={() => navigate("/organization/new")}
          className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">{t('onboarding.register_company')}</p>
            <p className="text-xs text-muted-foreground">
              {t('onboarding.create_customize_org')}
            </p>
          </div>
        </button>

        {/* Join company */}
        <button
          onClick={() => navigate("/onboarding")}
          className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">{t('onboarding.join_company')}</p>
            <p className="text-xs text-muted-foreground">
              {t('onboarding.join_company_desc')}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
