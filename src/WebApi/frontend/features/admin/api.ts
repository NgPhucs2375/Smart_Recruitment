"use client";

import { getValidToken, refreshSession, redirectToLogin } from "@/lib/auth-provider";
import { unwrapResponse, listResponse } from "@/lib/api/response-contract";
import { loadIdentity } from "@/lib/access-control-provider";
import { hasPermission } from "@/lib/permissions";

function extractMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b["Message"] === "string" && b["Message"]) return b["Message"];
  if (typeof b["message"] === "string" && b["message"]) return b["message"];
  if (Array.isArray(b["Errors"]) && b["Errors"].length > 0) return String(b["Errors"][0]);
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let token = await getValidToken();
  const send = () => fetch(`/api/dotnet${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let res = await send();
  if (res.status === 401 && await refreshSession()) { token = await getValidToken(); res = await send(); }
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Hết phiên đăng nhập, vui lòng đăng nhập lại");
  }
  if (res.status === 403) throw new Error("Bạn không có quyền thực hiện thao tác này");
  let body: unknown = null;
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) throw new Error(extractMessage(body, `Lỗi HTTP ${res.status}`));
  return unwrapResponse<T>(body);
}

export const adminApi = {
  list<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T[]> {
    const qs = new URLSearchParams();
    qs.set("_start", "0");
    qs.set("_end", "100");
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") qs.set(k, String(v));
      }
    }
    return request<unknown>(`${path}?${qs.toString()}`).then(body => listResponse<T>(body).data);
  },
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, payload: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(payload) });
  },
  put<T>(path: string, payload?: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: payload === undefined ? undefined : JSON.stringify(payload) });
  },
  remove<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};

/** Vai trò người dùng (enum số từ backend). */
export const VAI_TRO: Record<number, string> = {
  1: "QUAN_TRI_VIEN",
  2: "NGUOI_DAI_DIEN",
  3: "NHAN_SU",
  4: "UNG_VIEN",
};

/** Trigger tin tuyển dụng (enum số từ backend). */
export const TRIGGER_TIN = {
  GuiDuyet: 0,
  AdminDuyet: 4,
  AdminTuChoi: 5,
  TamDungTin: 6,
  MoLaiTin: 7,
  DongTin: 9,
  AdminCuongCheKhoa: 10,
} as const;

export function isAdmin(): boolean {
  const identity = loadIdentity();
  if (!identity) return false;
  if (identity.roles?.some((r) => r.trim().toUpperCase() === "QUAN_TRI_VIEN")) return true;
  return false;
}

export function canDo(resource: string, action: string): boolean {
  if (isAdmin()) return true;
  return hasPermission(loadIdentity()?.permissions, resource, action);
}
