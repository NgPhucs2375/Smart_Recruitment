import { authProvider } from "@/lib/auth-provider";
import {
  normalizeAuthError,
  resolvePostLoginTarget,
} from "./login-handler";
import { loadIdentity } from "@/lib/access-control-provider";

/**
 * Non-hook login service for callers that cannot (or should not) use
 * Refine `useLogin` — e.g. the landing inline form.
 * Same engine underneath: POST /account/authenticate → tokens →
 * GET /account/me. Callers navigate to `redirectTo` themselves.
 */
export async function loginWithPasswordService(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string | null; redirectTo: string | null }> {
  try {
    const result = await authProvider.login({ email, password });
    if (!result.success) {
      return {
        success: false,
        message: normalizeAuthError(
          result.error,
          "Email hoặc mật khẩu không đúng",
        ),
        redirectTo: null,
      };
    }
    const roles = loadIdentity()?.roles ?? [];
    return {
      success: true,
      message: null,
      redirectTo:
        (typeof result.redirectTo === "string" && result.redirectTo) ||
        resolvePostLoginTarget(roles, null),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Không thể kết nối máy chủ",
      redirectTo: null,
    };
  }
}
