export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "https://api.vcron.cloud").replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "vchron_token";

export function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setStoredToken(token) {
  if (!token) return clearStoredToken();
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* Cookie authentication remains available. */ }
}

export function clearStoredToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* Storage may be unavailable. */ }
}

export function authFetch(input, options = {}) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const target = new URL(input instanceof Request ? input.url : input, window.location.origin);
  const token = getStoredToken();
  if (token && target.origin === new URL(BACKEND_URL, window.location.origin).origin && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { credentials: "include", ...options, headers });
}
