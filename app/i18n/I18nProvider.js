'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import configService from '../components/settings/ConfigService';

/**
 * I18nProvider wraps the application with react-i18next context.
 * It synchronizes the language from ConfigService on mount.
 */
export default function I18nProvider({ children }) {
    useEffect(() => {
        const storedLanguage = configService.get('language');
        if (storedLanguage && storedLanguage !== i18n.language) {
            i18n.changeLanguage(storedLanguage);
        }
    }, []);

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
