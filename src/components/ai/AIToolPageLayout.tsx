import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreditsDisplay from '@/components/CreditsDisplay';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { IncompleteProfileModal } from '@/components/IncompleteProfileModal';

interface AIToolPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  children: ReactNode;
}

const AIToolPageLayout = ({ title, description, icon: Icon, gradient, children }: AIToolPageLayoutProps) => {
  const navigate = useNavigate();
  const { isProfileComplete, missingFields, showModal, setShowModal } = useProfileCompleteness();

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
          <div className="shrink-0 hidden sm:block">
            <CreditsDisplay variant="compact" />
          </div>
        </div>

        {/* Content - disabled overlay if profile incomplete */}
        {!isProfileComplete ? (
          <div className="relative">
            <div className="opacity-50 pointer-events-none select-none">
              {children}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              <div className="bg-card border rounded-xl p-6 text-center shadow-lg max-w-sm mx-4">
                <p className="font-semibold text-lg mb-2">Företagsinformation saknas</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Fyll i obligatorisk företagsinformation för att använda AI-verktyg.
                </p>
                <Button variant="gradient" onClick={() => setShowModal(true)}>
                  Fyll i information
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
    </DashboardLayout>
  );
};

export default AIToolPageLayout;
