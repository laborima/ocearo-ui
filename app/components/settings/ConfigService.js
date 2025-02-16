import boatsData from '/public/boats/boats.json';

class ConfigService {
  constructor() {
    // Default configuration
    this.defaultConfig = {
      signalkUrl: 'https://demo.signalk.org:443',
      username: '',
      password: '',
      debugMode: false,
      selectedBoat: 'Default',
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

  getSelectedBoat() {
      const selectedBoatName = this.config.selectedBoat;
      if (!selectedBoatName) return []; // Ensure it's an array

      // Find the selected boat
      return this.getBoatsData().find(boat => boat.name === selectedBoatName)
    }


   
   getBoatsData(){
     return boatsData.boats;
   }
   
  /**
   * Returns the computed SignalK URL based on the current debug mode.
   *
   * - If debugMode is on, returns 'https://demo.signalk.org:443'
   * - Otherwise, computes the URL from window.location (if available)
   */
  getComputedSignalKUrl() {
    if (this.config.debugMode) {
      return 'https://demo.signalk.org:443';
    } else if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }`;
    } else {
      // Fallback if window is not available
      return this.defaultConfig.signalkUrl;
    }
  }


}

const configService = new ConfigService();
export default configService;
