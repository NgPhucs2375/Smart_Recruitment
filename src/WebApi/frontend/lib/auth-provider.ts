import type { AuthProvider } from "@refinedev/core";
import { saveIdentity, loadIdentity, clearIdentity, buildIdentity } from "./access-control-provider";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = "/api/dotnet";
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// ─── ASP.NET Core Identity API response types ─────────────────────────────────

interface TokenResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  userName: string;
  roles: string[];
  permissions: { resource: string; action: string }[];
}

// ─── Token storage helpers ────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

function saveTokens(tokens: TokenResponse): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  clearIdentity();
}

// ─── Fetch /me and persist identity + permissions ─────────────────────────────

async function fetchAndSaveMe(token: string): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/Users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const me = (await res.json()) as MeResponse;
    saveIdentity(buildIdentity(me));
    return me;
  } catch {
    return null;
  }
}

// ─── Refresh token ────────────────────────────────────────────────────────────

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/Users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const tokens = (await res.json()) as TokenResponse;
    if (!tokens.accessToken) return false;
    saveTokens(tokens);
    await fetchAndSaveMe(tokens.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  return getToken();
}

/** Re-fetch /me and refresh the cached identity + permissions in localStorage.
 *  Call after any server-side permission change (e.g. saving the permission matrix). */
export async function refreshIdentity(): Promise<void> {
  const token = getToken();
  if (token) await fetchAndSaveMe(token);
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export const authProvider: AuthProvider = {
  // 1. POST /Users/login → tokens
  // 2. GET  /Users/me    → identity + permissions (stored in localStorage)
  login: async ({ email, password }) => {
    clearAuth();
    try {
      const res = await fetch(`${API_URL}/Users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let message = "Email hoặc mật khẩu không đúng";
        try {
          const body = await res.json();
          message = body?.detail ?? body?.title ?? body?.Message ?? message;
        } catch { /* ignore */ }
        return { success: false, error: { name: "Đăng nhập thất bại", message } };
      }

      const tokens = (await res.json()) as TokenResponse;
      saveTokens(tokens);

      // Fetch user info + permissions immediately after login
      await fetchAndSaveMe(tokens.accessToken);

      return { success: true, redirectTo: "/" };
    } catch (err) {
      return {
        success: false,
        error: {
          name: "Lỗi kết nối",
          message: err instanceof Error ? err.message : "Không thể kết nối máy chủ",
        },
      };
    }
  },

  logout: async () => {
    clearAuth();
    return { success: true, redirectTo: "/login" };
  },

  // Fast local check — no network call
  check: async () => {
    const token = getToken();
    if (!token) {
      return { authenticated: false, logout: true, redirectTo: "/login" };
    }
    return { authenticated: true };
  },

  // 401 → try refresh then logout; 403 → redirect to unauthorized page
  onError: async (error) => {
    if (error?.statusCode === 403) {
      return { redirectTo: "/unauthorized" };
    }
    if (error?.statusCode === 401) {
      const refreshed = await attemptRefresh();
      if (refreshed) return { error };
      clearAuth();
      return {
        logout: true,
        redirectTo: "/login",
        error: { name: "Unauthorized", message: "Phiên đăng nhập hết hạn" },
      };
    }
    return { error };
  },

  // Read from localStorage — no network call (identity was stored on login)
  getIdentity: async () => {
    const token = getToken();
    if (!token) return null;

    const identity = loadIdentity();
    if (identity) {
      return { id: identity.id, email: identity.email, name: identity.name, roles: identity.roles };
    }

    // Fallback: identity missing (e.g. first load after upgrade) — re-fetch
    const me = await fetchAndSaveMe(token);
    if (!me) return null;
    return { id: me.id, email: me.email, name: me.userName, roles: me.roles };
  },

  // Returns the roles array — used by Refine's usePermissions() hook
  getPermissions: async () => {
    return loadIdentity()?.roles ?? null;
  },
};
