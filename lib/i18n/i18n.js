import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importing translation files
import enTranslations from './lang/en.json';
import noTranslations from './lang/no.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      no: { translation: noTranslations }
      // ... other languages
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
