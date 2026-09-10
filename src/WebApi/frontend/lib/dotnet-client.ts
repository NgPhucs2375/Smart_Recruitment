import { getAuthToken } from "./auth-provider";

/**
 * Client dùng chung gọi backend .NET qua proxy /api/dotnet.
 * Backend serialize PascalCase (PropertyNamingPolicy = null) nên mọi
 * response đều được đọc cả 2 casing: Succeeded/succeeded, Data/data...
 */
export function dotnetErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.Message === "string" && b.Message) return b.Message;
    if (Array.isArray(b.errors) && b.errors.length > 0) return b.errors.join(", ");
    if (Array.isArray(b.Errors) && b.Errors.length > 0) return b.Errors.join(", ");
  }
  return fallback;
}

export async function dotnetRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`/api/dotnet/${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new Error(dotnetErrorMessage(body, `HTTP ${res.status}`));
  }
  const succeeded = (body?.Succeeded ?? body?.succeeded) === true;
  if (!succeeded) {
    throw new Error(dotnetErrorMessage(body, "Thao tác không thành công"));
  }
  return (body?.Data ?? body?.data) as T;
}

/** Lấy field bất kể PascalCase hay camelCase. */
export function pick<T>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k] as T;
  }
  return undefined;
}

/** Chuẩn hóa 1 object: thử camelCase trước, rồi PascalCase. */
export function normalizeKeys<T extends Record<string, unknown>>(
  raw: unknown,
  mapping: { [K in keyof T]: string[] },
): T | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(mapping)) {
    out[key] = pick(r, ...(mapping as Record<string, string[]>)[key]);
  }
  return out as T;
}
