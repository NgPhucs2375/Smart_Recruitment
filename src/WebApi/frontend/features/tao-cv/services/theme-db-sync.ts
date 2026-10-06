"use client";

import { cvThemesApi, type CvThemeInput, type CvThemeVm } from "@/lib/api/cv-themes-api";
import { normalizeLayoutConfig } from "../resume-data";
import type { CvThemeConfig } from "../types/theme-studio";

/** Map theme Studio -> payload DB (metadata + toàn bộ design trong CauHinhJson). */
export function themeToDbInput(theme: CvThemeConfig): CvThemeInput {
  return {
    Slug: theme.slug.trim() || theme.id,
    Ten: theme.name.trim(),
    MoTa: theme.description?.trim() || null,
    DanhMuc: theme.category,
    CapBac: theme.level,
    Tags: "Studio,Tùy chỉnh",
    PhongCachThietKe: "studio",
    SoCot: theme.structure === "single" ? 1 : 2,
    ThanThienATS: theme.atsFriendly,
    MauSacChuDao: theme.colors.primary,
    IsActive: theme.policy.isPublished,
    ThuTu: 100,
    CauHinhJson: JSON.stringify(theme),
  };
}

/**
 * Merge input Studio lên row DB hiện có: giữ nguyên các field admin
 * curate (MoTaNgan, NganhPhuHop, TamLyMauSac, …) mà Studio không quản lý.
 */
export function mergeStudioInput(existing: CvThemeVm, theme: CvThemeConfig): CvThemeInput {
  const studio = themeToDbInput(theme);
  return {
    Slug: existing.Slug,
    Ten: studio.Ten,
    MoTa: studio.MoTa,
    MoTaNgan: existing.MoTaNgan,
    DanhMuc: studio.DanhMuc,
    NganhPhuHop: existing.NganhPhuHop,
    ViTriMucTieu: existing.ViTriMucTieu,
    CapBac: studio.CapBac,
    Tags: existing.Tags ?? studio.Tags,
    PhongCachThietKe: studio.PhongCachThietKe,
    SoCot: studio.SoCot,
    ThanThienATS: studio.ThanThienATS,
    MauSacChuDao: studio.MauSacChuDao,
    TamLyMauSac: existing.TamLyMauSac,
    KhuyenNghiSuDung: existing.KhuyenNghiSuDung,
    TranhSuDungKhi: existing.TranhSuDungKhi,
    GoiYAI: existing.GoiYAI,
    LaMacDinh: existing.LaMacDinh,
    IsActive: studio.IsActive,
    ThuTu: existing.ThuTu,
    CauHinhJson: studio.CauHinhJson,
  };
}

export type DbSyncResult =
  | { mode: "created"; id: number }
  | { mode: "updated"; id: number }
  | { mode: "local-only"; error: string };

/**
 * Parse 1 row DB -> theme Studio (config nằm trong CauHinhJson).
 * Trả null khi row không phải theme Studio (theme hệ thống seed).
 * Metadata lấy từ cột DB (source of truth bảng admin), design từ CauHinhJson.
 */
export function parseDbTheme(vm: CvThemeVm): CvThemeConfig | null {
  if (!vm.CauHinhJson) return null;
  try {
    const parsed: unknown = JSON.parse(vm.CauHinhJson);
    if (!parsed || typeof parsed !== "object") return null;
    const cfg = parsed as Partial<CvThemeConfig>;
    if (typeof cfg.id !== "string" || typeof cfg.name !== "string") return null;
    const policyApproved = cfg.policy?.policyApproved ?? false;
    return {
      ...(cfg as CvThemeConfig),
      id: cfg.id || vm.Slug,
      slug: vm.Slug,
      name: cfg.name || vm.Ten,
      category: (vm.DanhMuc as CvThemeConfig["category"]) || cfg.category || "all",
      level: (vm.CapBac as CvThemeConfig["level"]) || cfg.level || "all",
      atsFriendly: vm.ThanThienATS,
      layout: normalizeLayoutConfig(
        (cfg as { layout?: unknown }).layout,
      ),
      policy: {
        ...(cfg.policy ?? {}),
        policyApproved,
        isPublished: vm.IsActive,
      },
    };
  } catch {
    return null;
  }
}

/** Theme Studio đã publish trên DB (IsActive) — nguồn chân lý cross-machine. */
export async function fetchDbThemes(): Promise<CvThemeConfig[]> {
  const list = await cvThemesApi.active();
  const out: CvThemeConfig[] = [];
  for (const vm of list) {
    const t = parseDbTheme(vm);
    if (t && t.policy.policyApproved) out.push(t);
  }
  return out;
}

/**
 * Nạp 1 theme từ DB để sửa trong Studio (?slug= hoặc ?id=).
 * id số -> GET /show/{id}; ngược lại tìm theo Slug trong list.
 */
export async function fetchDbThemeBySlugOrId(slugOrId: string): Promise<CvThemeConfig | null> {
  const key = slugOrId.trim();
  if (!key) return null;
  if (/^\d+$/.test(key)) {
    const vm = await cvThemesApi.get(Number(key));
    return parseDbTheme(vm);
  }
  const list = await cvThemesApi.list();
  const found = list.find((t) => t.Slug?.toLowerCase() === key.toLowerCase());
  return found ? parseDbTheme(found) : null;
}

/**
 * Đồng bộ theme Studio lên DB (để hiện ở bảng admin).
 * Tìm theo slug: có rồi -> PUT, chưa có -> POST.
 * Rớt mạng / thiếu quyền -> local-only, caller toast rõ.
 */
export async function syncThemeToDb(theme: CvThemeConfig): Promise<DbSyncResult> {
  const input = themeToDbInput(theme);
  try {
    const list = await cvThemesApi.list();
    const existing = list.find(
      (t) => t.Slug?.toLowerCase() === input.Slug.toLowerCase(),
    );
    if (existing) {
      await cvThemesApi.update(existing.Id, { ...mergeStudioInput(existing, theme), Id: existing.Id });
      return { mode: "updated", id: existing.Id };
    }
    const id = await cvThemesApi.create(input);
    return { mode: "created", id };
  } catch (e) {
    return { mode: "local-only", error: e instanceof Error ? e.message : "Không đồng bộ DB được" };
  }
}

/** Xóa theme khỏi DB theo slug (best-effort, dùng khi xóa trong Studio). */
export async function deleteDbThemeBySlug(slug: string): Promise<boolean> {
  try {
    const list = await cvThemesApi.list();
    const existing = list.find(
      (t) => t.Slug?.toLowerCase() === slug.trim().toLowerCase(),
    );
    if (!existing) return true;
    await cvThemesApi.remove(existing.Id);
    return true;
  } catch {
    return false;
  }
}
