import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import configService from './ConfigService';
import { useOcearoContext } from '../context/OcearoContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/i18n';

const SettingsBadge = ({ color }) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} animate-pulse ml-2 shrink-0`} />
);

const ConfigPage = ({ onSave }) => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useOcearoContext();
    const initialConfig = configService.getAll();
    const computedSignalKUrl = configService.getComputedSignalKUrl();
    const boats = configService.getBoatsData(); // Get full list of boats

    const [config, setConfig] = useState(initialConfig);
    const [useAuthentication, setUseAuthentication] = useState(
        initialConfig.useAuthentication || !!initialConfig.username || !!initialConfig.password
    );
    const [signalKUrlSet, setSignalKUrlSet] = useState(initialConfig.signalKUrlSet || false);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveIndicator, setSaveIndicator] = useState({ visible: false, message: '' });

    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'interface'

    // Track changes by comparing current config with initial config
    const checkForChanges = useCallback(
        (newConfig) => {
            const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(initialConfig);
            setHasUnsavedChanges(hasChanges);
        },
        [initialConfig]
    );

    useEffect(() => {
        const loadConfiguration = async () => {
            const configFromService = configService.getAll();
            setConfig(configFromService);
            
            // Initialize states from config
            setSignalKUrlSet(configFromService.signalKUrlSet || false);
            setUseAuthentication(configFromService.useAuthentication || !!configFromService.username || !!configFromService.password);

            if (configFromService.selectedBoat) {
                const currentBoat = boats.find((boat) => boat.name === configFromService.selectedBoat);
                setSelectedBoat(currentBoat || null);
            }
        };

        loadConfiguration();
    }, [boats]);

    // Update config, check for changes, and auto-save
    const updateConfig = (updates) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        checkForChanges(newConfig);
        
        // Auto-save when settings change
        const updatedConfig = { ...newConfig };
        
        // Update theme in context if it changed
        if (updates.theme && updates.theme !== theme) {
            setTheme(updates.theme);
        }
        
        // Handle SignalK URL settings
        if (updates.hasOwnProperty('signalKUrlSet')) {
            // When toggling the signalKUrlSet checkbox
            if (updates.signalKUrlSet === false) {
                // If turning off custom URL, use computed URL
                updatedConfig.signalkUrl = computedSignalKUrl;
                updatedConfig.username = '';
                updatedConfig.password = '';
                updatedConfig.useAuthentication = false;
            }
            // If turning on custom URL, keep the current URL (don't overwrite)
        } else if (!signalKUrlSet && !updates.hasOwnProperty('signalkUrl')) {
            // Only apply computed URL if signalKUrlSet is false and we're not setting URL
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        }
        
        // Handle authentication toggle separately
        if (updates.hasOwnProperty('useAuthentication')) {
            updatedConfig.useAuthentication = updates.useAuthentication;
            if (!updates.useAuthentication) {
                // Clear auth credentials when authentication is disabled
                updatedConfig.username = '';
                updatedConfig.password = '';
            }
        }
        
        // Save the config
        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
        
        // Show save indicator
        setSaveIndicator({ visible: true, message: t('settings.savedAuto') });
        setTimeout(() => setSaveIndicator({ visible: false, message: '' }), 2000);
    };

    const handleSave = () => {
        const updatedConfig = { ...config };

        // Should match updateConfig logic
        if (!signalKUrlSet) {
            // Only use computed URL when signalKUrlSet is false
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        } else if (!useAuthentication) {
            // Keep custom URL but clear auth credentials
            updatedConfig.username = '';
            updatedConfig.password = '';
        }
        
        // Always save the state of configuration switches
        updatedConfig.signalKUrlSet = signalKUrlSet;
        updatedConfig.useAuthentication = useAuthentication;

        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
        
        // Show save indicator
        setSaveIndicator({ visible: true, message: t('settings.saved') });
        setTimeout(() => setSaveIndicator({ visible: false, message: '' }), 2000);
    };

    const handleReset = () => {
        const defaultConfig = configService.getDefaultConfig();
        setConfig(defaultConfig);
        // Reset authentication settings
        setUseAuthentication(false);
        defaultConfig.useAuthentication = false;
        // Reset SignalK URL settings
        setSignalKUrlSet(false);
        defaultConfig.signalKUrlSet = false;
        // Reset custom URLs settings
        defaultConfig.showCustomUrls = false;
        defaultConfig.customExternalUrls = {}; // Reset to empty object to use default URLs
        // Save the reset configuration
        configService.saveConfig(defaultConfig);
        setHasUnsavedChanges(false);
    };

    const handleBoatChange = (e) => {
        const boatName = e.target.value;
        const boat = boats.find((b) => b.name === boatName);
        setSelectedBoat(boat || null);
        updateConfig({ selectedBoat: boatName });
    };

    return (
        <div className="p-8 text-hud-main w-full relative">
            <header className="mb-10 flex justify-between items-start sm:items-center relative min-h-[4rem]">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">
                        {t('settings.title')}
                    </h1>
                    <p className="text-hud-secondary text-sm font-medium uppercase tracking-widest">{t('settings.subtitle')}</p>
                </div>
                {saveIndicator.visible && (
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-0 sm:relative text-xs font-black bg-oGreen/20 text-oGreen border border-oGreen/30 px-4 py-2 rounded-full uppercase tracking-widest whitespace-nowrap"
                    >
                        {saveIndicator.message}
                    </motion.span>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="flex bg-hud-bg p-1 rounded-xl border border-hud mb-8">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex-1 py-3 px-6 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${
                        activeTab === 'system'
                            ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20'
                            : 'text-hud-secondary hover:text-hud-main'
                    }`}
                >
                    {t('settings.tabSystem')}
                </button>
                <button
                    onClick={() => setActiveTab('interface')}
                    className={`flex-1 py-3 px-6 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${
                        activeTab === 'interface'
                            ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20'
                            : 'text-hud-secondary hover:text-hud-main'
                    }`}
                >
                    {t('settings.tabInterface')}
                </button>
            </div>

            <div className="space-y-8">
                {activeTab === 'system' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Connection Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.connection')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-hud-bg tesla-hover">
                                    <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary flex items-center">
                                        {t('settings.signalkServer')}
                                        {!signalKUrlSet && <SettingsBadge color="bg-oBlue" />}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={signalKUrlSet}
                                            onChange={(e) => {
                                                setSignalKUrlSet(e.target.checked);
                                                updateConfig({ signalKUrlSet: e.target.checked });
                                            }}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>

                                {!signalKUrlSet && (
                                    <div className="p-4 rounded-xl bg-hud-bg border border-hud">
                                        <span className="text-xs font-bold uppercase tracking-widest text-hud-muted block mb-1">{t('settings.detectedUrl')}</span>
                                        <span className="text-sm font-mono text-oBlue">{computedSignalKUrl}</span>
                                    </div>
                                )}
                            </div>

                            {signalKUrlSet && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.customEndpoint')}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors font-mono"
                                            placeholder="https://your-signalk-server.local"
                                            value={config.signalkUrl || ''}
                                            onChange={(e) => updateConfig({ signalkUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-hud-bg tesla-hover">
                                        <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary flex items-center">
                                            {t('settings.authentication')}
                                            {signalKUrlSet && !useAuthentication && <SettingsBadge color="bg-oBlue" />}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={useAuthentication}
                                                onChange={(e) => {
                                                    setUseAuthentication(e.target.checked);
                                                    updateConfig({ useAuthentication: e.target.checked });
                                                }}
                                            />
                                            <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                        </label>
                                    </div>

                                    {useAuthentication && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.username')}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors"
                                                    value={config.username || ''}
                                                    onChange={(e) => updateConfig({ username: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.password')}</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors"
                                                    value={config.password || ''}
                                                    onChange={(e) => updateConfig({ password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </section>

                        {/* Vessel Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.vessel')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.activeProfile')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.selectedBoat || ''}
                                        onChange={handleBoatChange}
                                    >
                                        <option value="" className="bg-hud-bg">{t('settings.selectVessel')}</option>
                                        {boats.map((boat) => (
                                            <option key={boat.name} value={boat.name} className="bg-hud-bg">
                                                {boat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedBoat && (
                                    <div className="p-4 rounded-xl bg-oBlue/10 border border-oBlue/20 space-y-1">
                                        <div className="text-xs font-black uppercase tracking-widest text-oBlue mb-2">{t('settings.specifications')}</div>
                                        <div className="text-sm font-medium">{t('settings.model')}: <span className="text-hud-main">{selectedBoat.modelPath}</span></div>
                                        <div className="text-sm font-medium">{t('settings.capabilities')}: <span className="text-hud-main">{selectedBoat.capabilities?.join(', ')}</span></div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Advanced Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.advanced')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="space-y-1">
                                        <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary flex items-center">
                                            {t('settings.debugMode')}
                                            {config.debugMode && <SettingsBadge color="bg-yellow-400" />}
                                        </span>
                                        <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                            {t('settings.debugModeDesc')}
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.debugMode || false}
                                        onChange={(e) => {
                                            const updates = { debugMode: e.target.checked };
                                            if (!signalKUrlSet && e.target.checked) {
                                                updates.signalkUrl = 'https://demo.signalk.org:443';
                                            }
                                            updateConfig(updates);
                                        }}
                                    />
                                    <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                </label>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="tesla-card p-6 border-oRed/10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black uppercase tracking-widest text-oRed/80">{t('settings.critical')}</h2>
                                <div className="h-[1px] flex-grow bg-oRed/5 mx-4" />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-xl bg-oRed/5 border border-oRed/10">
                                <div className="space-y-1">
                                    <span className="text-sm font-bold uppercase tracking-widest text-oRed/80">{t('settings.factoryReset')}</span>
                                    <p className="text-xs text-oRed/40 font-medium uppercase tracking-wider">{t('settings.factoryResetDesc')}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="bg-oRed/20 text-oRed border border-oRed/30 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-oRed hover:text-hud-main transition-all duration-300 shadow-lg shadow-oRed/10"
                                >
                                    {t('common.reset')}
                                </button>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Appearance Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.appearance')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.themeMode')}</label>
                                    <div className="flex bg-hud-bg p-1 rounded-xl border border-hud">
                                        {['dark', 'light'].map((themeOption) => (
                                            <button
                                                key={themeOption}
                                                onClick={() => updateConfig({ theme: themeOption })}
                                                className={`flex-1 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                                    config.theme === themeOption
                                                        ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20'
                                                        : 'text-hud-secondary hover:text-hud-main'
                                                }`}
                                            >
                                                {themeOption}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.uiAccents')}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-hud-bg tesla-hover self-end h-[60px]">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.metallic')}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={config.metallicEffect || false}
                                                    onChange={(e) => updateConfig({ metallicEffect: e.target.checked })}
                                                />
                                                <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                            </label>
                                        </div>
                                        <div className="p-2 rounded-xl bg-hud-bg border border-hud flex items-center space-x-4">
                                            <input
                                                type="color"
                                                className="w-12 h-10 bg-transparent cursor-pointer rounded overflow-hidden border-none"
                                                value={config.primaryColor || '#09bfff'}
                                                onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                                            />
                                            <span className="text-xs font-mono uppercase text-hud-main/60">{config.primaryColor || '#09bfff'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Language Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.language')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.languageDesc')}</label>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-1 bg-hud-bg p-1 rounded-xl border border-hud">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                i18n.changeLanguage(lang.code);
                                                updateConfig({ language: lang.code });
                                            }}
                                            className={`py-3 px-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                                (config.language || 'en') === lang.code
                                                    ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20'
                                                    : 'text-hud-secondary hover:text-hud-main'
                                            }`}
                                        >
                                            <span>{lang.flag}</span>
                                            <span>{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Navigation & HUD Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.navigationHud')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.compassOrientation')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.compassNorthUp ? t('settings.northAtTop') : t('settings.northAtBottom')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.compassNorthUp || false}
                                            onChange={(e) => updateConfig({ compassNorthUp: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>
                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.hide3DCompass')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.hide3DCompass ? t('settings.hidden') : t('settings.visible')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.hide3DCompass || false}
                                            onChange={(e) => updateConfig({ hide3DCompass: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.hideTrueWind')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.hideTrueWind ? t('settings.hidden') : t('settings.visible')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.hideTrueWind || false}
                                            onChange={(e) => updateConfig({ hideTrueWind: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.attitudeIndicator')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.showAttitudeIndicator !== false ? t('settings.visible') : t('settings.hidden')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.showAttitudeIndicator !== false}
                                            onChange={(e) => updateConfig({ showAttitudeIndicator: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.sailTrimSliders')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.showSailTrimSliders !== false ? t('settings.visible') : t('settings.hidden')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.showSailTrimSliders !== false}
                                            onChange={(e) => updateConfig({ showSailTrimSliders: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.rigging')}</span>
                                            <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                                {config.showRigging !== false ? t('settings.visible') : t('settings.hidden')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={config.showRigging !== false}
                                            onChange={(e) => updateConfig({ showRigging: e.target.checked })}
                                        />
                                        <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">
                                        {t('settings.aisLengthScaling')}
                                        <span className="block text-xs text-hud-muted font-medium mt-1 uppercase">{t('settings.mapTargetVisibility')}</span>
                                    </label>
                                    <span className="text-xl font-black text-oBlue bg-oBlue/10 px-3 py-1 rounded-lg">
                                        {config.aisLengthScalingFactor || 0.7}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    className="w-full h-1.5 bg-hud-bg-elevated rounded-lg appearance-none cursor-pointer accent-oBlue"
                                    min="0.1"
                                    max="2.0"
                                    step="0.1"
                                    value={config.aisLengthScalingFactor || 0.7}
                                    onChange={(e) => updateConfig({
                                        aisLengthScalingFactor: parseFloat(e.target.value)
                                    })}
                                />
                            </div>
                        </section>

                        {/* Units & Values Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.unitsValues')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.distanceUnits')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.distanceUnits || 'nm'}
                                        onChange={(e) => updateConfig({ distanceUnits: e.target.value })}
                                    >
                                        <option value="nm" className="bg-hud-bg">Nautical Miles</option>
                                        <option value="km" className="bg-hud-bg">Kilometres</option>
                                        <option value="mi" className="bg-hud-bg">Miles</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.depthUnits')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.depthUnits || 'm'}
                                        onChange={(e) => updateConfig({ depthUnits: e.target.value })}
                                    >
                                        <option value="m" className="bg-hud-bg">metres</option>
                                        <option value="ft" className="bg-hud-bg">feet</option>
                                        <option value="fa" className="bg-hud-bg">fathoms</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.speedUnits')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.speedUnits || 'kn'}
                                        onChange={(e) => updateConfig({ speedUnits: e.target.value })}
                                    >
                                        <option value="kn" className="bg-hud-bg">knots</option>
                                        <option value="km/h" className="bg-hud-bg">km/h</option>
                                        <option value="mph" className="bg-hud-bg">mph</option>
                                        <option value="m/s" className="bg-hud-bg">m/s</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.temperatureUnits')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.temperatureUnits || 'C'}
                                        onChange={(e) => updateConfig({ temperatureUnits: e.target.value })}
                                    >
                                        <option value="C" className="bg-hud-bg">Celsius</option>
                                        <option value="F" className="bg-hud-bg">Fahrenheit</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.positionFormat')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.positionFormat || 'DD'}
                                        onChange={(e) => updateConfig({ positionFormat: e.target.value })}
                                    >
                                        <option value="DD" className="bg-hud-bg">-128.12345</option>
                                        <option value="DM" className="bg-hud-bg">-128° 07.407&apos;</option>
                                        <option value="DMS" className="bg-hud-bg">-128° 07&apos; 24.4&quot;</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.preferTrueValues')}</label>
                                    <select
                                        className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors appearance-none cursor-pointer"
                                        value={config.preferTrueValues !== false ? 'true' : 'false'}
                                        onChange={(e) => updateConfig({ preferTrueValues: e.target.value === 'true' })}
                                    >
                                        <option value="true" className="bg-hud-bg">{t('settings.preferTrue')}</option>
                                        <option value="false" className="bg-hud-bg">{t('settings.preferMagnetic')}</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Preferred Paths Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.preferredPaths')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.trueWindSpeed')}</label>
                                    <div className="space-y-2 p-4 rounded-xl bg-hud-bg border border-hud">
                                        {[{value: 'speedTrue', label: t('settings.pathSpeedTrue')}, {value: 'speedApparent', label: t('settings.pathSpeedApparent')}].map((option) => (
                                            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="preferredWindSpeedPath"
                                                    value={option.value}
                                                    checked={(config.preferredWindSpeedPath || 'speedTrue') === option.value}
                                                    onChange={(e) => updateConfig({ preferredWindSpeedPath: e.target.value })}
                                                    className="w-4 h-4 accent-oBlue"
                                                />
                                                <span className="text-sm text-hud-main">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.trueWindDirection')}</label>
                                    <div className="space-y-2 p-4 rounded-xl bg-hud-bg border border-hud">
                                        {[{value: 'directionTrue', label: t('settings.pathDirectionTrue')}, {value: 'angleApparent', label: t('settings.pathAngleApparent')}, {value: 'angleTrueWater', label: t('settings.pathAngleTrueWater')}].map((option) => (
                                            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="preferredWindDirectionPath"
                                                    value={option.value}
                                                    checked={(config.preferredWindDirectionPath || 'directionTrue') === option.value}
                                                    onChange={(e) => updateConfig({ preferredWindDirectionPath: e.target.value })}
                                                    className="w-4 h-4 accent-oBlue"
                                                />
                                                <span className="text-sm text-hud-main">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{t('settings.headingCog')}</label>
                                    <div className="space-y-2 p-4 rounded-xl bg-hud-bg border border-hud">
                                        {[{value: 'courseOverGroundTrue', label: t('settings.pathCourseOverGroundTrue')}, {value: 'headingTrue', label: t('settings.pathHeadingTrue')}, {value: 'courseOverGroundMagnetic', label: t('settings.pathCourseOverGroundMagnetic')}, {value: 'headingMagnetic', label: t('settings.pathHeadingMagnetic')}].map((option) => (
                                            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="preferredHeadingPath"
                                                    value={option.value}
                                                    checked={(config.preferredHeadingPath || 'courseOverGroundTrue') === option.value}
                                                    onChange={(e) => updateConfig({ preferredHeadingPath: e.target.value })}
                                                    className="w-4 h-4 accent-oBlue"
                                                />
                                                <span className="text-sm text-hud-main">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* External Links Settings */}
                        <section className="tesla-card p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.externalLinks')}</h2>
                                <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                            </div>

                            <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="space-y-1">
                                        <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{t('settings.customToolUrls')}</span>
                                        <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">
                                            {t('settings.customToolUrlsDesc')}
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.showCustomUrls || false}
                                        onChange={(e) => updateConfig({
                                            showCustomUrls: e.target.checked
                                        })}
                                    />
                                    <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oBlue"></div>
                                </label>
                            </div>

                            {config.showCustomUrls && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-6 pt-4 border-t border-hud"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { id: 'navigation', label: t('settings.urlNavigation'), placeholder: "${signalkUrl}/@signalk/freeboard-sk/" },
                                            { id: 'instrument', label: t('settings.urlInstruments'), placeholder: "${signalkUrl}/@mxtommy/kip/" },
                                            { id: 'dashboard', label: t('settings.urlMetrics'), placeholder: "${signalkUrl}/grafana" },
                                            { id: 'webcam1', label: t('settings.urlWebcamAlpha'), placeholder: "https://example.com/stream1" },
                                            { id: 'webcam2', label: t('settings.urlWebcamBeta'), placeholder: "https://example.com/stream2" },
                                            { id: 'weather', label: t('settings.urlAtmospheric'), placeholder: "https://windy.com/..." }
                                        ].map((urlConfig) => (
                                            <div key={urlConfig.id} className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-hud-secondary ml-1">{urlConfig.label}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-hud-bg border border-hud rounded-xl p-4 text-sm text-hud-main focus:outline-none focus:border-oBlue/50 transition-colors font-mono"
                                                    placeholder={urlConfig.placeholder}
                                                    value={(config.customExternalUrls?.[urlConfig.id]) || ''}
                                                    onChange={(e) => {
                                                        const customExternalUrls = { ...config.customExternalUrls } || {};
                                                        customExternalUrls[urlConfig.id] = e.target.value;
                                                        updateConfig({ customExternalUrls });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigPage;
