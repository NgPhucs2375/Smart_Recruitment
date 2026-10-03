"use client";

import { getAuthToken } from "@/lib/auth-provider";

/** Theme CV từ API backend (DbSet cv_themes). Field names PascalCase. */
export interface CvThemeVm {
  Id: number;
  Slug: string;
  Ten: string;
  MoTa?: string | null;
  MoTaNgan?: string | null;
  PreviewStorageKey?: string | null;
  DanhMuc?: string | null;
  NganhPhuHop?: string | null;
  ViTriMucTieu?: string | null;
  CapBac?: string | null;
  Tags?: string | null;
  PhongCachThietKe?: string | null;
  SoCot: number;
  ThanThienATS: boolean;
  MauSacChuDao?: string | null;
  TamLyMauSac?: string | null;
  KhuyenNghiSuDung?: string | null;
  TranhSuDungKhi?: string | null;
  GoiYAI?: string | null;
  LaMacDinh: boolean;
  IsActive: boolean;
  ThuTu: number;
}

export interface CvThemeInput {
  Slug: string;
  Ten: string;
  MoTa?: string | null;
  MoTaNgan?: string | null;
  DanhMuc?: string | null;
  NganhPhuHop?: string | null;
  ViTriMucTieu?: string | null;
  CapBac?: string | null;
  Tags?: string | null;
  PhongCachThietKe?: string | null;
  SoCot?: number;
  ThanThienATS?: boolean;
  MauSacChuDao?: string | null;
  TamLyMauSac?: string | null;
  KhuyenNghiSuDung?: string | null;
  TranhSuDungKhi?: string | null;
  GoiYAI?: string | null;
  LaMacDinh?: boolean;
  IsActive?: boolean;
  ThuTu?: number;
}

interface ApiResponse<T> {
  Succeeded: boolean;
  Message?: string | null;
  Data?: T | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/dotnet${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: `Bearer ${getAuthToken() ?? ""}`,
      ...init?.headers,
    },
  });
  if (res.status === 401) throw new Error("Hết phiên đăng nhập, vui lòng đăng nhập lại");
  if (res.status === 403) throw new Error("Bạn không có quyền thực hiện thao tác này");
  let body: unknown = null;
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const b = body as Record<string, unknown> | null;
    const msg =
      (typeof b?.["Message"] === "string" && b["Message"]) ||
      (typeof b?.["message"] === "string" && b["message"]) ||
      `Lỗi HTTP ${res.status}`;
    throw new Error(msg);
  }
  const wrapped = body as ApiResponse<T>;
  if (wrapped && typeof wrapped === "object" && "Succeeded" in wrapped) {
    if (!wrapped.Succeeded) throw new Error(wrapped.Message || "Thao tác thất bại");
    return (wrapped.Data ?? wrapped) as T;
  }
  return body as T;
}

const BASE = "/cvthemes";

export const cvThemesApi = {
  /** Admin list (có phân trang _start/_end/_filter của backend). */
  list(params?: { _filter?: string }): Promise<CvThemeVm[]> {
    const qs = new URLSearchParams({ _start: "0", _end: "0" });
    if (params?._filter) qs.set("_filter", params._filter);
    return request<CvThemeVm[]>(`${BASE}?${qs.toString()}`);
  },
  /** Gallery public + AI: chỉ theme đang bật, không cần đăng nhập. */
  active(): Promise<CvThemeVm[]> {
    return request<CvThemeVm[]>(`${BASE}/active`);
  },
  get(id: number): Promise<CvThemeVm> {
    return request<CvThemeVm>(`${BASE}/show/${id}`);
  },
  create(input: CvThemeInput): Promise<number> {
    return request<number>(BASE, { method: "POST", body: JSON.stringify(input) });
  },
  update(id: number, input: CvThemeInput & { Id: number }): Promise<number> {
    return request<number>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },
  remove(id: number): Promise<number> {
    return request<number>(`${BASE}/${id}`, { method: "DELETE" });
  },
  /** Upload ảnh preview (FormData). Trả về StorageKey. */
  uploadPreview(id: number, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    return request<string>(`${BASE}/${id}/preview`, { method: "POST", body: form });
  },
  /** URL ảnh preview public cho <img> (stream qua backend, không cần token). */
  previewUrl(id: number): string {
    return `/api/dotnet${BASE}/${id}/preview`;
  },
};
