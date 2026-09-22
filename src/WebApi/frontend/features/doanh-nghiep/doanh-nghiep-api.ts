"use client";

import { getAuthToken } from "@/lib/auth-provider";

/** Company record — field names mirror GetAllDoanhNghiepsViewModel (no invented fields). */
export interface DoanhNghiepVm {
  id: number;
  tenDoanhNghiep: string;
  moTa: string;
  website: string;
  diaChi: string;
  logoUrl: string;
  maSoThue: string;
  linhVucHoatDong: string;
  quyMoNhanSu: string;
  nguoiDaiDienId?: number | null;
}

export type CompanyListError = "forbidden" | "not-found" | "empty" | "network";

const API = "/api/dotnet/doanhnghieps";

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function normalizeCompany(raw: unknown): DoanhNghiepVm | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id ?? r.Id ?? 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  const repId = r.nguoiDaiDienId ?? r.NguoiDaiDienId;
  return {
    id,
    tenDoanhNghiep: str(r.tenDoanhNghiep ?? r.TenDoanhNghiep),
    moTa: str(r.moTa ?? r.MoTa),
    website: str(r.website ?? r.Website),
    diaChi: str(r.diaChi ?? r.DiaChi),
    logoUrl: str(r.logoUrl ?? r.LogoUrl),
    maSoThue: str(r.maSoThue ?? r.MaSoThue),
    linhVucHoatDong: str(r.linhVucHoatDong ?? r.LinhVucHoatDong),
    quyMoNhanSu: str(r.quyMoNhanSu ?? r.QuyMoNhanSu),
    nguoiDaiDienId: repId == null || repId === "" ? null : Number(repId),
  };
}

async function apiFetch(path: string): Promise<unknown> {
  const token = getAuthToken();
  const res = await fetch(path, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (res.status === 403) {
    const err = new Error("forbidden") as Error & { code?: string };
    err.code = "forbidden";
    throw err;
  }
  if (!res.ok) {
    const message =
      (body && typeof (body.Message ?? body.message) === "string"
        ? (body.Message ?? body.message)
        : null) ?? `HTTP ${res.status}`;
    const err = new Error(String(message)) as Error & { code?: string; status?: number };
    err.code = res.status === 404 ? "not-found" : "network";
    err.status = res.status;
    throw err;
  }
  return body?.Data ?? body?.data ?? body;
}

function toList(payload: unknown): DoanhNghiepVm[] {
  let arr: unknown[] = [];
  if (Array.isArray(payload)) arr = payload;
  else if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const nested = o.items ?? o.Items ?? o.data ?? o.Data;
    if (Array.isArray(nested)) arr = nested;
  }
  return arr
    .map(normalizeCompany)
    .filter((c): c is DoanhNghiepVm => c !== null);
}

export const doanhNghiepApi = {
  /** Existing list endpoint only (_filter keyword). No invented filters. */
  list: async (keyword?: string): Promise<DoanhNghiepVm[]> => {
    const q = new URLSearchParams({ _start: "0", _end: "100" });
    if (keyword?.trim()) q.set("_filter", keyword.trim());
    return toList(await apiFetch(`${API}?${q.toString()}`));
  },
  /** Existing detail endpoint. Read-only use. */
  getById: async (id: number): Promise<DoanhNghiepVm | null> => {
    const payload = await apiFetch(`${API}/show/${id}`);
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return normalizeCompany(payload);
    }
    return toList(payload)[0] ?? null;
  },
};

export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CT";
  if (parts.length === 1) return (parts[0] as string).slice(0, 2).toUpperCase();
  return `${(parts[0] as string)[0]}${(parts[parts.length - 1] as string)[0]}`.toUpperCase();
}
