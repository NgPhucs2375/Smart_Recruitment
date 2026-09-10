import type { AuthProvider } from "@refinedev/core";
import { saveIdentity, loadIdentity, clearIdentity, buildIdentity } from "./access-control-provider";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = "/api/dotnet/account";
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// ─── ASP.NET Core Identity API response types ─────────────────────────────────

interface MeResponse {
  id: string;
  email: string;
  userName: string;
  roles: string[];
  permissions: { resource: string; action: string }[];
}

function normalizeMeResponse(value: unknown): MeResponse | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const roles = raw.roles ?? raw.Roles;
  const permissions = raw.permissions ?? raw.Permissions;
  const id = raw.id ?? raw.Id;
  const email = raw.email ?? raw.Email;
  const userName = raw.userName ?? raw.UserName;

  if (
    typeof id !== "string" ||
    typeof email !== "string" ||
    typeof userName !== "string" ||
    !Array.isArray(roles) ||
    !Array.isArray(permissions)
  ) {
    return null;
  }

  // Roles có thể lẫn blob JSON quyền (do JWT inbound mapping đẩy claim
  // "roles" vào nhóm Role) — bóc tách: giữ tên role, trích permissions nhúng.
  const cleanRoles: string[] = [];
  const embeddedPermissions: { resource: string; action: string }[] = [];
  for (const role of roles) {
    if (typeof role !== "string") continue;
    const trimmed = role.trim();
    if (!trimmed.startsWith("{")) {
      cleanRoles.push(role);
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed) as {
        role?: unknown;
        permissions?: unknown;
      };
      if (typeof parsed.role === "string" && parsed.role) cleanRoles.push(parsed.role);
      if (Array.isArray(parsed.permissions)) {
        for (const p of parsed.permissions) {
          if (!p || typeof p !== "object") continue;
          const rec = p as Record<string, unknown>;
          const resource = rec.resource ?? rec.Resource;
          const acts = rec.action ?? rec.Action;
          const list = Array.isArray(acts) ? acts : [acts];
          for (const a of list) {
            if (typeof resource === "string" && typeof a === "string") {
              embeddedPermissions.push({ resource, action: a });
            }
          }
        }
      }
    } catch {
      // Bỏ qua blob lỗi — không chặn đăng nhập
    }
  }

  const seen = new Set<string>();
  const mergedPermissions = [
    ...permissions.flatMap((permission) => {
      if (!permission || typeof permission !== "object") return [];
      const item = permission as Record<string, unknown>;
      const resource = item.resource ?? item.Resource;
      const action = item.action ?? item.Action;
      return typeof resource === "string" && typeof action === "string"
        ? [{ resource, action }]
        : [];
    }),
    ...embeddedPermissions,
  ].filter((p) => {
    const key = `${p.resource}::${p.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    id,
    email,
    userName,
    roles: [...new Set(cleanRoles)],
    permissions: mergedPermissions,
  };
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

function saveTokens(jwToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, jwToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  clearIdentity();
}

// ─── Fetch /me định danh + quyền ─────────────────────────────

async function fetchAndSaveMe(token: string): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Record<string, unknown>;
    const wrapped = body.Data ?? body.data;
    const me = normalizeMeResponse(wrapped ?? body);
    if (!me) return null;
    saveIdentity(buildIdentity(me));
    return me;
  } catch {
    return null;
  }
}

// ─── Refresh token ────────────────────────────────────────────────────────────

async function attemptRefresh(): Promise<boolean> {
  const CurrentrefreshToken = getRefreshToken();
  if (!CurrentrefreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: CurrentrefreshToken }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    const data = body?.Data ?? body?.data;
    const jwToken = data?.JWToken ?? data?.jwToken;
    const newRefreshToken = data?.RefreshToken ?? data?.refreshToken;
    if (!jwToken) return false;
    
    saveTokens(jwToken, newRefreshToken);
    await fetchAndSaveMe(jwToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  return getToken();
}

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Trả về token còn hạn; tự refresh khi sắp hết hạn (<60s). Null nếu không có/không refresh được. */
export async function getValidToken(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  const exp = parseJwtExp(token);
  if (exp !== null && exp - Date.now() > 60_000) return token;
  // Hết hạn hoặc không đọc được exp → thử refresh
  const refreshed = await attemptRefresh();
  return refreshed ? getToken() : null;
}

/** Re-fetch /me and refresh the cached identity + permissions in localStorage.
 *  Call after any server-side permission change (e.g. saving the permission matrix). */
export async function refreshIdentity(): Promise<void> {
  const token = getToken();
  if (token) await fetchAndSaveMe(token);
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export const authProvider: AuthProvider = {
  // 1. POST /account/authenticate → tokens
  // 2. GET  /me    → identity + permissions (stored in localStorage)
  login: async (payload) => {
    clearAuth();
    try {
      // Nhận diện luồng đăng nhập (Google hay Local) — hỗ trợ cả payload từ useGoogleAuth
      const isExternal = payload.providerName === "google" || payload.provider === "Google" || !!payload.credential || !!payload.idToken;
      
      const endpoint = isExternal ? `${API_URL}/external-login` : `${API_URL}/authenticate`;
      
      const rawToken: string | undefined = payload.idToken || payload.credential || payload.IdToken;
      if (isExternal && (!rawToken || typeof rawToken !== "string" || rawToken.split(".").length !== 3)) {
        console.warn("[auth] Google credential không hợp lệ, length=", rawToken?.length, "snippet=", rawToken?.slice(0,40));
        return { success: false, error: { name: "Đăng nhập thất bại", message: "Token Google không hợp lệ (không phải JWT). Vui lòng thử lại." } };
      }

      const requestBody = isExternal 
        ? { Provider: "Google", IdToken: rawToken }
        : { Email: payload.email, Password: payload.password };

      if (isExternal) console.log("[auth] external-login sending IdToken length", rawToken?.length);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        let message = isExternal ? "Đăng nhập Google thất bại" : "Email hoặc mật khẩu không đúng";
        try {
          const body = await res.json();
          // Backend trả Response{Message, Errors} hoặc ProblemDetails
          const serverMsg = body?.Message ?? body?.message ?? body?.detail ?? body?.title;
          const serverErrors = Array.isArray(body?.Errors) ? body.Errors.join("; ") : Array.isArray(body?.errors) ? body.errors.join("; ") : "";
          if (serverMsg) message = serverErrors ? `${serverMsg}: ${serverErrors}` : serverMsg;
          console.warn("[auth] login failed", endpoint, res.status, body);
        } catch { /* ignore */ }
        return { success: false, error: { name: "Đăng nhập thất bại", message } };
      }

      // Xử lý lưu Token và Identity chung cho cả 2 luồng
      const body = await res.json();
      const data = body?.Data ?? body?.data;
      const jwToken = data?.JWToken ?? data?.jwToken;
      const refreshToken = data?.RefreshToken ?? data?.refreshToken;
      
      if (jwToken) {
        saveTokens(jwToken, refreshToken);
        await fetchAndSaveMe(jwToken);
      }
      
      return { success: true, redirectTo: "/dashboard" };
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

  register: async (payload) =>{
    try{
      const res = await fetch(`${API_URL}/register`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if(!res.ok){
        let message = "Đăng ký không thành công !";
        try{
          const body = await res.json();
          message = body.detail ?? body?.title ?? body?.Message ?? message;
        }catch{}
        return {success:false,error:{name:"Lỗi đăng ký",message}};
      }
      return {success:true,redirectTo:"/login"};
    }catch(err){
      return{
        success: false,
        error:{
          name: "Lỗi kết nối",
          message: err instanceof Error ? err.message : "Không thể kết nối máy chủ",
        },
      };
    }
  },

  logout: async () => {
    clearAuth()
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

  // 401 → ...thử làm mới rồi đăng xuất; 403 → chuyển hướng đến trang không được phép
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

// ─── Magic Link API ───────────────────────────────────────────────────────────

export async function requestMagicLink(payload: {
  email: string;
  purpose?: string;
  role?: string;
  hoTen?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/request-magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: payload.email,
        Purpose: payload.purpose,
        Role: payload.role,
        HoTen: payload.hoTen, // Hỗ trợ tương thích với MagicLinkFormData[cite: 19]
      }),
    });

    if (!res.ok) {
      let message = "Không thể yêu cầu liên kết đăng nhập.";
      try {
        const body = await res.json();
        message = body?.detail ?? body?.title ?? body?.Message ?? message;
      } catch { /* ignore */ }
      return { success: false, message };
    }

    const body = await res.json();
    return { success: true, message: body?.Message ?? "Liên kết đã được gửi." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Lỗi kết nối máy chủ",
    };
  }
}

export async function magicLogin(payload: {
  email: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/magic-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: payload.email,
        Token: payload.token,
      }),
    });

    if (!res.ok) {
      let message = "Liên kết đăng nhập không hợp lệ hoặc đã hết hạn.";
      try {
        const body = await res.json();
        message = body?.detail ?? body?.title ?? body?.Message ?? message;
      } catch { /* ignore */ }
      return { success: false, error: message };
    }

    const body = await res.json();
    const data = body?.Data ?? body?.data;
    const jwToken = data?.JWToken ?? data?.jwToken;
    const refreshToken = data?.RefreshToken ?? data?.refreshToken;

    if (jwToken) {
      saveTokens(jwToken, refreshToken); // Lưu token vào localStorage[cite: 18]
      await fetchAndSaveMe(jwToken);     // Đồng bộ thông tin định danh và quyền[cite: 18]
      return { success: true };
    }
    
    return { success: false, error: "Máy chủ không cấp phát được Token." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi kết nối máy chủ",
    };
  }
}
