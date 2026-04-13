import i18n from '../lib/i18n';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n: { language } } = useTranslation();
  const setLanguage = (lang: 'sv' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18n_lang', lang);
  };
  return { language, setLanguage, languages: ['sv', 'en'] as const };
};
