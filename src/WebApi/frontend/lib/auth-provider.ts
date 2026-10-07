import type { AuthProvider } from "@refinedev/core";
import { saveIdentity, loadIdentity, clearIdentity, buildIdentity } from "./access-control-provider";
import { homePortalFor, type PortalKind } from "./portal-roles";
import { resolvePostLoginTarget } from "@/components/auth/login-handler";

const LOGIN_PORTAL_KEY = "hireai.login.portal";

function rememberLoginPortal(portal: PortalKind | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (portal === "candidate" || portal === "employer") {
      sessionStorage.setItem(LOGIN_PORTAL_KEY, portal);
    }
  } catch {
    // ignore storage errors
  }
}

function consumeLoginPortal(): PortalKind | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(LOGIN_PORTAL_KEY);
    sessionStorage.removeItem(LOGIN_PORTAL_KEY);
    return v === "candidate" || v === "employer" ? v : null;
  } catch {
    return null;
  }
}

/** Non-consuming peek at the stored login portal (for redirect fallbacks). */
function peekLoginPortal(): PortalKind | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(LOGIN_PORTAL_KEY);
    return v === "candidate" || v === "employer" ? v : null;
  } catch {
    return null;
  }
}

/** Portal-aware login route: employer deep-links fall back to employer login. */
export function loginRouteForPortal(): "/employer/login" | "/login" {
  const stored = peekLoginPortal();
  if (stored) return stored === "employer" ? "/employer/login" : "/login";
  const home = homePortalFor(loadIdentity()?.roles ?? []);
  return home === "employer" ? "/employer/login" : "/login";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = "/api/dotnet/account";
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
// Google external-login can be slow on the first request while the backend
// fetches Google's signing certificates and creates the local account.
const LOGIN_REQUEST_TIMEOUT_MS = 60_000;

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

  // /me is authoritative: never merge withdrawn permissions from legacy JWT blobs.
  const cleanRoles = roles.filter((role): role is string => typeof role === "string" &&
    ["QUAN_TRI_VIEN", "NGUOI_DAI_DIEN", "NHAN_SU", "UNG_VIEN"].includes(role));
  if (cleanRoles.length !== 1) return null;

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

function identityFromJwt(token: string): MeResponse | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      encoded.length + ((4 - (encoded.length % 4)) % 4),
      "=",
    );
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
    const roleClaim = claims.roles ?? claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const roles = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : [];
    return normalizeMeResponse({
      id: claims.uid ?? claims.sub,
      email: claims.email,
      userName: claims.sub ?? claims.email,
      roles,
      permissions: [],
    });
  } catch {
    return null;
  }
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
  sessionEpoch += 1;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  clearIdentity();
}

/** Clear the frontend session (tokens + cached identity). Reused by portal gates — no JWT logic. */
export function clearFrontendSession(): void {
  clearAuth();
}

// ─── Fetch /me định danh + quyền ─────────────────────────────

async function fetchAndSaveMe(token: string): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
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

let sessionEpoch = 0;
let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshInFlight) refreshInFlight = refreshOnce().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function refreshOnce(): Promise<boolean> {
  const epoch = sessionEpoch;
  const CurrentrefreshToken = getRefreshToken();
  if (!CurrentrefreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Token: CurrentrefreshToken }),
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const body = await res.json();
    const data = body?.Data ?? body?.data;
    const jwToken = data?.JWToken ?? data?.jwToken;
    const newRefreshToken = data?.RefreshToken ?? data?.refreshToken;
    if (!jwToken || epoch !== sessionEpoch || getRefreshToken() !== CurrentrefreshToken) return false;
    
    saveTokens(jwToken, newRefreshToken);
    await fetchAndSaveMe(jwToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  const token = getToken();
  if (!token) return null;

  const exp = parseJwtExp(token);
  if (exp !== null && exp <= Date.now()) {
    // Preserve the refresh token for the asynchronous refresh path.
    return null;
  }
  return token;
}

/** End the local session and force unauthenticated pages to the correct login portal. */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  const target = loginRouteForPortal();
  clearAuth();
  if (window.location.pathname !== target) {
    window.location.replace(target);
  }
}

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: unknown };
    const exp = typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
    return Number.isFinite(exp) ? exp * 1000 : null;
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
  if (!refreshed) {
    clearAuth();
    return null;
  }
  return getToken();
}

/** Re-fetch /me and refresh the cached identity + permissions in localStorage. */
export async function refreshIdentity(): Promise<boolean> {
  const token = await getValidToken();
  // khong co access token -> tra false
  if(!token) return false;

  const me = await fetchAndSaveMe(token);
  return me !== null;
}

/** Force a new JWT after a server-side role change. */
export async function refreshSession(): Promise<boolean> {
  return attemptRefresh();
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export const authProvider: AuthProvider = {
  // 1. POST /account/authenticate → tokens
  // 2. GET  /me    → identity + permissions (stored in localStorage)
  login: async (payload) => {
    clearAuth();
    try {
      const portal = (payload.portal ?? payload.expectedPortal) as PortalKind | undefined;
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
        signal: AbortSignal.timeout(LOGIN_REQUEST_TIMEOUT_MS),
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
      
      if (!jwToken) {
        clearAuth();
        return {
          success: false,
          error: { name: "Đăng nhập thất bại", message: "Máy chủ không trả về access token." },
        };
      }

      saveTokens(jwToken, refreshToken);
      // GenerateJWToken embeds roles and permissions. Use them immediately to
      // avoid a second /me round-trip; keep /me as a compatibility fallback.
      const me = identityFromJwt(jwToken) ?? await fetchAndSaveMe(jwToken);
      if (me) saveIdentity(buildIdentity(me));
      if (!me) {
        clearAuth();
        return {
          success: false,
          error: {
            name: "Không tải được tài khoản",
            message: "Đăng nhập thành công nhưng không tải được thông tin người dùng. Vui lòng thử lại.",
          },
        };
      }

      rememberLoginPortal(portal);
      // Shared-auth model: the same API serves every portal. The login URL
      // is only a hint — backend `/account/me` roles are the source of
      // truth and `AppLayout` picks the candidate / recruiter / admin
      // shell from them. Cross-portal accounts log in successfully and
      // land on the dashboard of their own role.
      return {
        success: true,
        redirectTo: resolvePostLoginTarget(me.roles, payload.redirectTo ?? payload.next),
      };
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

  // 1. POST /account/register → success/failure
  register: async (payload) =>{
    try{
      const res = await fetch(`${API_URL}/register`,{
        method: "POST",
        headers: {
           "Content-Type": "application/json" 
          },
        body: JSON.stringify(payload),
      });

      // Đọc response body trước
      const body = await res.json().catch(() => null);

      // Check Status code nghiệp vụ của BE
      const succeeded = 
        body?.Succeeded ??
        body?.succeeded;

      // Get Message BE
      const message = 
        body?.Message ??
        body?.message ??
        body?.detail ??
        body?.title ??
        "Đăng ký không thành công.";

      // Check cả HTTP và nghiệp vụ
      if(!res.ok || succeeded !== true){
        return{
          success: false,
          error:{
            name: "Lỗi đăng ký",
            message,
          },
        };
      }

      // Chỉ tới đây khi thật sự thành công 
      return {
        success:true,
        redirectTo: String(payload.role ?? payload.Role ?? "").toUpperCase() === "NGUOI_DAI_DIEN" ? "/employer/login" : "/login"
      };
    }
    catch(err){
      return{
        success: false,
        error:{
          name: "Lỗi kết nối",
          message: 
          err instanceof Error 
            ? err.message
            : "Không thể kết nối máy chủ",
        },
      };
    }
  },

  logout: async () => {
    // Determine the workspace BEFORE clearing identity: candidate goes back
    // to /login, recruiter/HR to the employer login route. Admin follows the
    // portal they logged in from (stored at login), else the safe default.
    const roles = loadIdentity()?.roles ?? [];
    const storedPortal = consumeLoginPortal();
    const home = homePortalFor(roles);
    const portal: PortalKind =
      storedPortal ?? (home === "employer" ? "employer" : "candidate");
    const refreshToken = getRefreshToken();
    clearAuth();
    if (refreshToken) {
      try { await fetch(`${API_URL}/revoke-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Token: refreshToken }), signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS) }); }
      catch { /* The local session is already cleared. */ }
    }
    return { success: true, redirectTo: portal === "employer" ? "/employer/login" : "/login" };
  },

  // Fast local check — no network call
  check: async () => {
    let token = await getValidToken();
    if (!token) {
      return { authenticated: false, logout: true, redirectTo: loginRouteForPortal() };
    }
    let identity = await fetchAndSaveMe(token);
    if (!identity && await attemptRefresh()) {
      token = getToken();
      if (token) identity = await fetchAndSaveMe(token);
    }
    if (!identity) { const target = loginRouteForPortal(); clearAuth(); return { authenticated: false, logout: true, redirectTo: target }; }
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
      redirectToLogin();
      return {
        logout: true,
        redirectTo: loginRouteForPortal(),
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

type AccountActionResult = { success: boolean; message?: string };

async function accountAction(
  endpoint: string,
  body: Record<string, string>,
  authenticated = false,
): Promise<AccountActionResult> {
  try {
    const token = authenticated ? await getValidToken() : null;
    if (authenticated && !token) 
      return { 
        success: false,
        message: "Phiên đăng nhập đã hết hạn." 
      };

    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    // Đọc response Body trước
    const responseBody = await res.json().catch(() => ({}));
    
    // Lấy thông báo
    const message = 
      responseBody?.Message ??
      responseBody?.message ?? 
      responseBody?.detail ?? 
      responseBody?.title;

    // Check Status code nghiệp vụ của BE
    const succeeded =
      responseBody?.Succeeded ??
      responseBody?.succeeded;
    
    if(!res.ok || succeeded !== true){
      return {
        success: false,
        message: message ?? "Thao tác không thành công.",
      };
    }
    return {
      success: true,
      message: message ?? "Thao tác thành công.",
    }
  } 
  catch (err) {
    return { 
      success: false,
      message: err instanceof Error 
        ? err.message : "Lỗi kết nối máy chủ." };
  }
}

export function requestPasswordReset(email: string): Promise<AccountActionResult> {
  return accountAction("forgot-password", { Email: email });
}

export function resendVerificationEmail(email: string): Promise<AccountActionResult> {
  return accountAction("resend-verification-email", { Email: email });
}

export function resetPassword(email: string, token: string, password: string): Promise<AccountActionResult> {
  return accountAction("reset-password", { Email: email, Token: token, Password: password });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<AccountActionResult> {
  return accountAction("change-password", {
    MatKhauHienTai: currentPassword,
    MatKhauMoi: newPassword,
  }, true);
}

export async function magicLogin(payload: {
  email: string;
  token: string;
  portal?: PortalKind;
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
      // Same shared-auth model as password/Google login: portal is a hint,
      // roles from /me decide the shell. No rejection on mismatch.
      rememberLoginPortal(payload.portal);
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
