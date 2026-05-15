export const APP_CONFIG = {
  name: "Arteka Label Vision",
  defaultUserRole: "user",
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const API_TIMEOUT = 30000;
