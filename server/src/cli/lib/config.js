import fs from "fs"
import path from "path"
import os from "os"

const CONFIG_DIR = path.join(os.homedir(), ".star-cli")
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json")

const DEFAULT_CONFIG = {
  googleApiKey: "",
  model: "gemini-2.5-flash"
}

/**
 * Ensures the configuration directory exists.
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

/**
 * Gets the current configuration.
 * @returns {Object} The configuration object.
 */
export function getConfig() {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG }
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf-8")
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) }
  } catch (error) {
    // If the file is malformed, return defaults
    return { ...DEFAULT_CONFIG }
  }
}

/**
 * Saves the configuration.
 * @param {Object} config The configuration object to save.
 * @returns {boolean} True if successfully saved, false otherwise.
 */
export function saveConfig(config) {
  try {
    ensureConfigDir()
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("Failed to save configuration:", error.message)
    return false
  }
}

/**
 * Sets the Google Gemini API Key.
 * @param {string} key The API key to set.
 * @returns {boolean} True if successfully saved.
 */
export function setApiKey(key) {
  const config = getConfig()
  config.googleApiKey = key.trim()
  return saveConfig(config)
}

/**
 * Sets the active AI Model.
 * @param {string} model The model name to set.
 * @returns {boolean} True if successfully saved.
 */
export function setModel(model) {
  const config = getConfig()
  config.model = model.trim()
  return saveConfig(config)
}

/**
 * Gets the Google Gemini API Key.
 * @returns {string} The API key.
 */
export function getApiKey() {
  return getConfig().googleApiKey
}

/**
 * Gets the active AI Model.
 * @returns {string} The active model.
 */
export function getModel() {
  return getConfig().model
}
