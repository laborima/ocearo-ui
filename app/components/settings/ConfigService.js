class ConfigService {
    constructor() {
        // Default configuration
        this.defaultConfig = {
            signalkUrl: 'https://demo.signalk.org:443',
            username: '',
            password: '',
            debugMode: false,
        };

        this.configKey = 'ocearoConfig'; // Key used to store the config in localStorage
        this.config = this.loadConfig(); // Load existing config or initialize with defaults
    }

    // Load configuration from localStorage or initialize with defaults
    loadConfig() {
        const storedConfig = localStorage.getItem(this.configKey);
        if (storedConfig) {
            try {
                return JSON.parse(storedConfig);
            } catch (error) {
                console.error('Failed to parse stored configuration:', error);
                return { ...this.defaultConfig };
            }
        } else {
            // If no config exists, initialize with defaults
            this.saveConfig(this.defaultConfig);
            return { ...this.defaultConfig };
        }
    }

    // Save the current configuration to localStorage
    saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }; // Merge new values
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }

    // Get a specific configuration value
    get(key) {
        return this.config[key];
    }

    // Set a specific configuration value and save it
    set(key, value) {
        this.config[key] = value;
        this.saveConfig(this.config);
    }

    // Reset configuration to default values
    resetConfig() {
        this.config = { ...this.defaultConfig };
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }

    // Get all configuration values
    getAll() {
        return { ...this.config };
    }
}

// Export a single instance of the service for the entire app
const configService = new ConfigService();
export default configService;
