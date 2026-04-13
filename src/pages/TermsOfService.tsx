import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const TermsOfService = () => {
  const { t, i18n } = useTranslation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('terms.back')}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">{t('terms.title')}</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground mb-4">
              {t('terms.last_updated')}: {new Date().toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-GB')}
            </p>
            <p>{t('terms.intro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s1_title')}</h2>
            <p className="mb-4">{t('terms.s1_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s1_item1')}</li>
              <li>{t('terms.s1_item2')}</li>
              <li>{t('terms.s1_item3')}</li>
              <li>{t('terms.s1_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s2_title')}</h2>
            <p className="mb-4">{t('terms.s2_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s2_item1')}</li>
              <li>{t('terms.s2_item2')}</li>
              <li>{t('terms.s2_item3')}</li>
              <li>{t('terms.s2_item4')}</li>
              <li>{t('terms.s2_item5')}</li>
            </ul>
            <p className="mt-4">{t('terms.s2_outro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s3_title')}</h2>
            <p className="mb-4">{t('terms.s3_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s3_item1')}</li>
              <li>{t('terms.s3_item2')}</li>
              <li>{t('terms.s3_item3')}</li>
            </ul>
            <p className="mt-4">{t('terms.s3_outro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s4_title')}</h2>
            <p className="mb-4">{t('terms.s4_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s4_item1')}</li>
              <li>{t('terms.s4_item2')}</li>
              <li>{t('terms.s4_item3')}</li>
              <li>{t('terms.s4_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s5_title')}</h2>
            <p className="mb-4">{t('terms.s5_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s5_item1')}</li>
              <li>{t('terms.s5_item2')}</li>
            </ul>
            <p className="mt-4 mb-4">{t('terms.s5_payment_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s5_item3')}</li>
              <li>{t('terms.s5_item4')}</li>
              <li>{t('terms.s5_item5')}</li>
              <li>{t('terms.s5_item6')}</li>
              <li>{t('terms.s5_item7')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s6_title')}</h2>
            <p className="mb-4">{t('terms.s6_promotley')}</p>
            <p className="mb-4">{t('terms.s6_yours')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s7_title')}</h2>
            <p className="mb-4">{t('terms.s7_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s7_item1')}</li>
              <li>{t('terms.s7_item2')}</li>
              <li>{t('terms.s7_item3')}</li>
              <li>{t('terms.s7_item4')}</li>
              <li>{t('terms.s7_item5')}</li>
              <li>{t('terms.s7_item6')}</li>
              <li>{t('terms.s7_item7')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s8_title')}</h2>
            <p>{t('terms.s8_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s9_title')}</h2>
            <p className="mb-4">{t('terms.s9_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s9_item1')}</li>
              <li>{t('terms.s9_item2')}</li>
              <li>{t('terms.s9_item3')}</li>
              <li>{t('terms.s9_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s10_title')}</h2>
            <p className="mb-4">{t('terms.s10_yours')}</p>
            <p className="mb-4">{t('terms.s10_ours')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s10_item1')}</li>
              <li>{t('terms.s10_item2')}</li>
              <li>{t('terms.s10_item3')}</li>
              <li>{t('terms.s10_item4')}</li>
            </ul>
            <p className="mt-4">{t('terms.s10_outro')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s11_title')}</h2>
            <p>{t('terms.s11_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s12_title')}</h2>
            <p>{t('terms.s12_body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s13_title')}</h2>
            <p className="mb-4">{t('terms.s13_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s13_item1')}</li>
              <li>{t('terms.s13_item2')}</li>
              <li>{t('terms.s13_item3')}</li>
              <li>{t('terms.s13_item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('terms.s14_title')}</h2>
            <p>{t('terms.s14_intro')}</p>
            <div className="mt-4 space-y-2">
              <p>{t('terms.s14_email')}</p>
              <p>{t('terms.s14_support')}</p>
              <p>{t('terms.s14_contacts')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Jonas.khaldi@promotley.se</li>
                <li>Thami.Alami@promotley.se</li>
                <li>Eddie.Ervenius@promotley.se</li>
              </ul>
              <p className="mt-4">{t('terms.s14_address')}</p>
            </div>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">{t('terms.footer')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
