// Same-origin-agnostic admin API client. The admin panel talks only to the
// Bankacı API admin endpoints, always with the ba_ admin session token. Every
// value is sent as a query parameter or JSON body; nothing is interpolated into
// a URL path except identifiers the server itself issued.

const API_URL = (
  process.env.REACT_APP_BANKACI_API_URL || "https://api.bankaci.app"
).replace(/\/$/, "");

export async function api(path, { token, params, method = "GET", body } = {}) {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload && payload.error ? payload.error : "request_failed"
    );
    error.status = response.status;
    throw error;
  }
  return payload;
}

// Short-lived admin sessions (30 min) are kept in sessionStorage so a refresh or
// tab switch on a phone does not drop the operator back to the login screen. It
// never reaches another origin or device, and is cleared on sign-out.
const TOKEN_KEY = "bankaci-admin-token";

export function readStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function writeStoredToken(token) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session stays in memory only */
  }
}
