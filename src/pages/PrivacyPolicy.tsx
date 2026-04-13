import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('privacy.back')}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">{t('privacy.title')}</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">
              {t('privacy.last_updated')}: {new Date().toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-GB')}
            </p>
            <p>{t('privacy.intro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s1_title')}</h2>
            <p className="mb-4">{t('privacy.s1_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s1_item1')}</li>
              <li>{t('privacy.s1_item2')}</li>
              <li>{t('privacy.s1_item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s2_title')}</h2>
            <p className="mb-4">{t('privacy.s2_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s2_item1')}</li>
              <li>{t('privacy.s2_item2')}</li>
              <li>{t('privacy.s2_item3')}</li>
              <li>{t('privacy.s2_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s3_title')}</h2>
            <p>{t('privacy.s3_intro')}</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('privacy.s3_item1')}</li>
              <li>{t('privacy.s3_item2')}</li>
              <li>{t('privacy.s3_item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s4_title')}</h2>
            <p>{t('privacy.s4_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s5_title')}</h2>
            <p className="mb-4">{t('privacy.s5_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s5_item1')}</li>
              <li>{t('privacy.s5_item2')}</li>
              <li>{t('privacy.s5_item3')}</li>
              <li>{t('privacy.s5_item4')}</li>
              <li>{t('privacy.s5_item5')}</li>
            </ul>
            <p className="mt-4">{t('privacy.s5_outro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s6_title')}</h2>
            <p>{t('privacy.s6_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s7_title')}</h2>
            <p>{t('privacy.s7_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s8_title')}</h2>
            <p>{t('privacy.s8_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.s9_title')}</h2>
            <p>{t('privacy.s9_intro')}</p>
            <p className="mt-4 whitespace-pre-line">{t('privacy.s9_contact')}</p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">{t('privacy.footer')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
