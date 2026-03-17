export interface Env {
  GEMINI_API_KEY: string;
  APP_PROXY_TOKEN: string;
}

export const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
]);

export const MAX_BODY_BYTES = 20 * 1024 * 1024; // 20 MB
export const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";