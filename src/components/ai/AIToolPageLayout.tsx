import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LucideIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreditsDisplay from '@/components/CreditsDisplay';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { IncompleteProfileModal } from '@/components/IncompleteProfileModal';
import ModelTierSelector from '@/components/ai/ModelTierSelector';
import { type ModelTier } from '@/lib/modelTiers';
import { useTranslation } from 'react-i18next';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeModal } from '@/components/UpgradeModal';
import { type FeatureKey } from '@/lib/planConfig';

interface AIToolPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  children: ReactNode;
  modelTier?: ModelTier;
  onModelTierChange?: (tier: ModelTier) => void;
  requiredFeature?: FeatureKey;
}

const AIToolPageLayout = ({
  title,
  description,
  icon: Icon,
  gradient,
  children,
  modelTier,
  onModelTierChange,
  requiredFeature,
}: AIToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isProfileComplete, missingFields, showModal, setShowModal } = useProfileCompleteness();
  const access = useFeatureAccess(requiredFeature ?? 'ai_chat');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const planLocked = !!requiredFeature && !access.loading && !access.allowed;

  return (
    <DashboardLayout hideFooter>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ai?tab=verktyg')}
            className="mt-1 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold dashboard-heading-dark">{title}</h1>
            </div>
            <p className="text-sm dashboard-subheading-dark ml-[52px]">{description}</p>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-3">
            {modelTier && onModelTierChange && (
              <ModelTierSelector value={modelTier} onChange={onModelTierChange} compact />
            )}
            <CreditsDisplay variant="compact" />
          </div>
        </div>

        {/* Plan-locked overlay (highest priority) */}
        {planLocked ? (
          <div className="relative">
            <div className="opacity-40 pointer-events-none select-none blur-[1px]">
              {children}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => setUpgradeOpen(true)}
            >
              <div className="bg-card border rounded-xl p-6 text-center shadow-lg max-w-sm mx-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-lg mb-1">
                  {t('plan_gating.locked_title', { plan: access.requiredPlanName })}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('plan_gating.locked_desc', {
                    feature: title,
                    required: access.requiredPlanName,
                    current: access.currentPlanName,
                  })}
                </p>
                <Button variant="gradient" onClick={() => setUpgradeOpen(true)}>
                  {t('plan_gating.upgrade_btn')}
                </Button>
              </div>
            </div>
          </div>
        ) : !isProfileComplete ? (
          <div className="relative">
            <div className="opacity-50 pointer-events-none select-none">
              {children}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              <div className="bg-card border rounded-xl p-6 text-center shadow-lg max-w-sm mx-4">
                <p className="font-semibold text-lg mb-2">{t('ai_tool_layout.company_missing_title')}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('ai_tool_layout.company_missing_desc')}
                </p>
                <Button variant="gradient" onClick={() => setShowModal(true)}>
                  {t('ai_tool_layout.company_fill_btn')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      <IncompleteProfileModal
        open={showModal}
        onOpenChange={setShowModal}
        missingFields={missingFields}
      />

      {requiredFeature && (
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          featureName={title}
          requiredPlanName={access.requiredPlanName}
          currentPlanName={access.currentPlanName}
        />
      )}
    </DashboardLayout>
  );
};

export default AIToolPageLayout;
