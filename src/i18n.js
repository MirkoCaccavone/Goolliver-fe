import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';


const resources = {
    en: { translation: translationEN },
    it: { translation: translationIT },
};

let initialLang = localStorage.getItem('language');
if (initialLang !== 'en' && initialLang !== 'it') {
    initialLang = 'it';
    localStorage.setItem('language', 'it');
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: initialLang,
        fallbackLng: 'it',
        interpolation: { escapeValue: false },
    });

export default i18n;
