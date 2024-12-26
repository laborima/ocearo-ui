class ConfigService {
    constructor() {
        // Default configuration
        this.defaultConfig = {
            signalkUrl: 'https://demo.signalk.org:443',
            username: '',
            password: '',
            debugMode: false,
            selectedBoat: {
                  "name": "Default",
                  "docPath": "default",
                  "polarPath": "default",
                  "modelPath": "default",
                  "capabilities": ["navigation","rudder","sail"]
                },
            primaryColor: null,
            metallicEffect: false,
        };

        this.configKey = 'ocearoConfig'; // Key used to store the config
        this.inMemoryConfig = { ...this.defaultConfig }; // Fallback storage for SSR
        this.config = this.loadConfig(); // Load existing config or initialize with defaults
    }

    isLocalStorageAvailable() {
        try {
            return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
        } catch {
            return false;
        }
    }

    // Load configuration
    loadConfig() {
        if (this.isLocalStorageAvailable()) {
            const storedConfig = localStorage.getItem(this.configKey);
            if (storedConfig) {
                try {
                    return JSON.parse(storedConfig);
                } catch (error) {
                    console.error('Failed to parse stored configuration:', error);
                    return { ...this.defaultConfig };
                }
            } else {
                this.saveConfig(this.defaultConfig);
                return { ...this.defaultConfig };
            }
        }
        // Use in-memory config during SSR
        return { ...this.inMemoryConfig };
    }

    // Save configuration
    saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.isLocalStorageAvailable()) {
            localStorage.setItem(this.configKey, JSON.stringify(this.config));
        } else {
            this.inMemoryConfig = { ...this.config };
        }
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.saveConfig(this.config);
    }

    resetConfig() {
        this.config = { ...this.defaultConfig };
        if (this.isLocalStorageAvailable()) {
            localStorage.setItem(this.configKey, JSON.stringify(this.config));
        } else {
            this.inMemoryConfig = { ...this.defaultConfig };
        }
    }

    getAll() {
        return { ...this.config };
    }

    getDefaultConfig() {
        return { ...this.defaultConfig };
    }

    async fetchBoats() {
        const ASSET_PREFIX = process.env.ASSET_PREFIX || './';
        const modelPath = `${ASSET_PREFIX}/boats`;

        try {
            const response = await fetch(`${modelPath}/boats.json`);
            const data = await response.json();
            return data.boats || [];
        } catch (error) {
            console.error('Error fetching boats:', error);
            return [];
        }
    }
}

const configService = new ConfigService();
export default configService;
