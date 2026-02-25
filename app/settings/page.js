'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import configService from '../components/settings/ConfigService';

export default function SettingsPage()
{
    const router = useRouter();

    useEffect(() => {
        configService.setCurrentView('settings');
        router.replace('/');
    }, [router]);

    return null;
}
