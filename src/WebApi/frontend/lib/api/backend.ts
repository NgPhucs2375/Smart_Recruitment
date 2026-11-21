import { getValidToken, refreshSession } from "../auth-provider";

/** Body chuẩn của backend .NET (PascalCase) — chấp nhận cả camelCase khi proxy đổi tên. */
export type BackendResponse<T = unknown> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

export const backendSucceeded = (res: BackendResponse<unknown>): boolean =>
  res.Succeeded ?? res.succeeded ?? true;

export const backendMessage = (res: BackendResponse<unknown>): string =>
  res.Message ?? res.message ?? "";

export const backendData = <T,>(res: BackendResponse<unknown>): T | undefined =>
  (res.Data ?? res.data) as T | undefined;

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const key of ["message", "Message", "detail", "title"]) {
      const value = b[key];
      if (typeof value === "string" && value.trim()) return value;
    }
    for (const key of ["errors", "Errors"]) {
      const value = b[key];
      if (Array.isArray(value) && value.length > 0) return value.map(String).join(", ");
    }
  }
  return fallback;
}

/**
 * Fetch backend .NET với token hiện tại, tự refresh một lần khi 401.
 * Ném lỗi khi HTTP không thành công; caller tự kiểm tra `backendSucceeded`.
 */
export async function backendFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<BackendResponse<T>> {
  let token = await getValidToken();
  const url = path.startsWith("/") ? path : `/api/dotnet/${path}`;
  const send = () => fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  let res = await send();
  if (res.status === 401 && await refreshSession()) {
    token = await getValidToken();
    res = await send();
  }
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new Error(errorMessage(body, `HTTP ${res.status}`));
  return (body ?? {}) as BackendResponse<T>;
}
