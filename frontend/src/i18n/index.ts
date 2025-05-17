import { i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationEN from './locales/en.json';
import translationPL from './locales/pl.json';

// Create i18n instance
const i18nInstance = i18n.createInstance();

i18nInstance
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN
      },
      pl: {
        translation: translationPL
      }
    },
    lng: 'pl', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Prevents issues with SSR
    }
  });

export default i18nInstance;
