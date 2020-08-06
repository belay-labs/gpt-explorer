export const URL =
  process.env.NODE_ENV === "production"
    ? "https://gpt-3-explorer.vercel.app/"
    : "http://localhost:3000/";

// Local storage keys
export const API_STORAGE_KEY = "api-key";
export const HIDE_PARAMS_KEY = "settings-hide-params";
export const RAW_STORAGE_KEY = "setting-show-raw";

// Language engines
export const LANGUAGE_ENGINES = ["ada", "babbage", "curie", "davinci"];

// Setting defaults
export const DEFAULT_MAX_TOKEN = 100;
export const DEFAULT_STOP = "Q:";
export const DEFAULT_TEMP = 0.9;
export const DEFAULT_FREQ = 0.0;
export const DEFAULT_PRES = 0.0;
export const DEFAULT_ENGINE = "davinci";
