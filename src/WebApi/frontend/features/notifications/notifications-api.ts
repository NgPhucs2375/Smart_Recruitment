import { getValidToken } from "@/lib/auth-provider";
import { normalizeNotificationsVm, type NotificationsVm } from "./notifications";

const BASE = "/api/dotnet/Notifications";

export interface NotificationListParams {
  unreadOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
  // null/undefined = tất cả; BE hỗ trợ 0/1/3
  type?: number | null;
}

function apiError(body: unknown, status: number): Error {
  const row = (body ?? {}) as Record<string, unknown>;
  return new Error(String(row.Message ?? row.message ?? `HTTP ${status}`));
}

async function authedFetch(url: string, init?: RequestInit): Promise<unknown> {
  const token = await getValidToken();
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw apiError(body, response.status);
  const succeeded = (body as Record<string, unknown> | null)?.Succeeded
    ?? (body as Record<string, unknown> | null)?.succeeded;
  if (succeeded === false) throw apiError(body, response.status);
  return body;
}

export async function fetchNotifications(params: NotificationListParams = {}): Promise<NotificationsVm> {
  const query = new URLSearchParams();
  if (params.unreadOnly) query.set("unreadOnly", "true");
  query.set("pageNumber", String(params.pageNumber ?? 1));
  query.set("pageSize", String(params.pageSize ?? 15));
  if (params.type != null) query.set("type", String(params.type));
  const body = await authedFetch(`${BASE}?${query.toString()}`);
  return normalizeNotificationsVm(body);
}

export async function markNotificationRead(id: number): Promise<void> {
  await authedFetch(`${BASE}/read/${id}`, { method: "POST", body: "{}" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authedFetch(`${BASE}/read`, { method: "POST", body: "{}" });
}

export async function deleteNotification(id: number): Promise<void> {
  await authedFetch(`${BASE}/${id}`, { method: "DELETE" });
}
