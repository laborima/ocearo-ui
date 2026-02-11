import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
    en: { translation: en },
    fr: { translation: fr }
};

/**
 * Supported languages configuration.
 * Designed to be extended with additional European languages.
 */
export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' }
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
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'ocearo-language',
            caches: ['localStorage']
        }
    });

export default i18n;
