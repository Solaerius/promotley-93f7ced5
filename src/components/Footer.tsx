import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { LanguageSwitcher } from './LanguageSwitcher';

const Footer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const handleContact = () => {
    navigator.clipboard.writeText('hej@promotley.se').then(() => {
      toast({ title: 'hej@promotley.se', description: t('footer.email_copied') });
    }).catch(() => {
      toast({ title: 'hej@promotley.se' });
    });
  };

  return (
    <footer className="border-t border-border/20 py-12 bg-[hsl(var(--gradient-hero-bg))]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Promotley" className="h-6 w-6" />
              <span className="font-bold text-foreground">Promotley</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t('footer.tagline')}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
            <button onClick={handleContact} className="hover:text-foreground transition-colors cursor-pointer">{t('footer.contact')}</button>
          </div>

          {/* Language + copyright */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <LanguageSwitcher />
            <p className="text-xs text-muted-foreground">© {currentYear} Promotley. {t('footer.rights')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
