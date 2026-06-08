/**
 * db-config.js — SmartProcure Hotel & Meal Configuration
 * Persists via localStorage key 'sp_config_v1'
 */

const DB_CONFIG_KEY = 'sp_config_v1';

const CONFIG_DEFAULTS = {
  totalRooms:    80,
  occupancyRate: 75,
  guestsPerRoom: 1.8,
  bufferRate:    5,
  mealSettings: {
    breakfast: { mealRate: 90, bufferFactor: 1.0 },
    lunch:     { mealRate: 70, bufferFactor: 1.0 },
    dinner:    { mealRate: 80, bufferFactor: 1.0 },
  },
};

function getConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(DB_CONFIG_KEY));
    if (!stored) return JSON.parse(JSON.stringify(CONFIG_DEFAULTS));
    // Deep merge mealSettings so missing keys get defaults
    const merged = Object.assign({}, CONFIG_DEFAULTS, stored);
    merged.mealSettings = Object.assign(
      JSON.parse(JSON.stringify(CONFIG_DEFAULTS.mealSettings)),
      stored.mealSettings || {}
    );
    ['breakfast','lunch','dinner'].forEach(m => {
      merged.mealSettings[m] = Object.assign(
        JSON.parse(JSON.stringify(CONFIG_DEFAULTS.mealSettings[m])),
        (stored.mealSettings || {})[m] || {}
      );
    });
    return merged;
  } catch {
    return JSON.parse(JSON.stringify(CONFIG_DEFAULTS));
  }
}

function saveConfig(obj) {
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(obj));
}
