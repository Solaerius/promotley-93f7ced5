import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CookieConsent = () => {
  const { t } = useTranslation();
  const {
    showBanner,
    preferences,
    acceptAll,
    acceptNecessary,
    saveCustomPreferences,
    setPreferences,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [tempPreferences, setTempPreferences] = useState(preferences);

  if (!showBanner) return null;

  const handleSaveCustom = () => {
    saveCustomPreferences(tempPreferences);
    setShowSettings(false);
  };

  const handleClose = () => {
    acceptNecessary();
  };

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
        <Card className="max-w-4xl mx-auto p-6 bg-card/95 backdrop-blur-lg border-2 border-primary/20 shadow-glow">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon and Text */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Cookie className="w-6 h-6 text-primary shrink-0" />
                <h3 className="font-bold text-lg">{t('cookies.banner_title')}</h3>
                <button
                  onClick={handleClose}
                  className="ml-auto md:hidden text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('cookies.close_aria')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('cookies.banner_description')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {t('cookies.customize')}
              </Button>
              <Button
                variant="ghost"
                onClick={acceptNecessary}
              >
                {t('cookies.necessary_only')}
              </Button>
              <Button
                variant="gradient"
                onClick={acceptAll}
              >
                {t('cookies.accept_all')}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              {t('cookies.settings_title')}
            </DialogTitle>
            <DialogDescription>
              {t('cookies.settings_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-1 space-y-1">
                <Label className="text-base font-semibold">{t('cookies.necessary_label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.necessary_description')}
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
              <div className="flex-1 space-y-1">
                <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer">
                  {t('cookies.analytics_label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.analytics_description')}
                </p>
              </div>
              <Switch
                id="analytics"
                checked={tempPreferences.analytics}
                onCheckedChange={(checked) =>
                  setTempPreferences({ ...tempPreferences, analytics: checked })
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
              <div className="flex-1 space-y-1">
                <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                  {t('cookies.marketing_label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.marketing_description')}
                </p>
              </div>
              <Switch
                id="marketing"
                checked={tempPreferences.marketing}
                onCheckedChange={(checked) =>
                  setTempPreferences({ ...tempPreferences, marketing: checked })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={acceptNecessary}
              className="flex-1"
            >
              {t('cookies.necessary_only')}
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveCustom}
              className="flex-1"
            >
              {t('cookies.save_settings')}
            </Button>
          </div>

          {/* Privacy Link */}
          <p className="text-xs text-muted-foreground text-center">
            {t('cookies.privacy_link')}{' '}
            <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">
              {t('cookies.privacy_link_text')}
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
