import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import el from './locales/el.json';

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    it: { translation: it },
    pt: { translation: pt },
    nl: { translation: nl },
    pl: { translation: pl },
    sv: { translation: sv },
    da: { translation: da },
    fi: { translation: fi },
    el: { translation: el }
};

/**
 * Supported languages configuration.
 * Designed to be extended with additional European languages.
 */
export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
    { code: 'da', label: 'Dansk', flag: '🇩🇰' },
    { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
    { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' }
];

/**
 * Retrieve the persisted language from localStorage if available.
 * @returns {string|null} The stored language code or null
 */
const getStoredLanguage = () => {
    try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const config = localStorage.getItem('ocearoConfig');
            if (config) {
                const parsed = JSON.parse(config);
                return parsed.language || null;
            }
        }
    } catch (e) {
        // Ignore parse errors
    }
    return null;
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: getStoredLanguage() || undefined,
        fallbackLng: 'en',
        showSupportNotice: false,
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'ocearo-language',
            caches: ['localStorage']
        }
    });

// The page says which language it is shown in: a browser that believes a
// French page is English offers to translate it
const setPageLanguage = (lng) => {
    if (typeof document !== 'undefined' && lng) document.documentElement.lang = lng.split('-')[0];
};
i18n.on('languageChanged', setPageLanguage);
setPageLanguage(i18n.language);

export default i18n;
