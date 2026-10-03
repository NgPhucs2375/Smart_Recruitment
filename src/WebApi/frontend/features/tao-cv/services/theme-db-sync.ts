"use client";

import { cvThemesApi, type CvThemeInput, type CvThemeVm } from "@/lib/api/cv-themes-api";
import { normalizeLayoutConfig } from "../resume-data";
import type { CvThemeConfig } from "../types/theme-studio";

/** Map theme Studio -> payload DB (metadata + toàn bộ design trong CauHinhJson). */
export function themeToDbInput(theme: CvThemeConfig): CvThemeInput {
  return {
    Slug: theme.id,
    Ten: theme.name.trim(),
    MoTa: theme.description?.trim() || null,
    DanhMuc: "studio",
    CapBac: "all",
    Tags: "Studio,Tùy chỉnh",
    PhongCachThietKe: "studio",
    SoCot: theme.structure === "single" ? 1 : 2,
    ThanThienATS: true,
    MauSacChuDao: theme.colors.primary,
    IsActive: theme.policy.policyApproved,
    ThuTu: 100,
    CauHinhJson: JSON.stringify(theme),
  };
}

export type DbSyncResult =
  | { mode: "created"; id: number }
  | { mode: "updated"; id: number }
  | { mode: "local-only"; error: string };

/**
 * Parse 1 row DB -> theme Studio (config nằm trong CauHinhJson).
 * Trả null khi row không phải theme Studio (theme hệ thống seed).
 */
export function parseDbTheme(vm: CvThemeVm): CvThemeConfig | null {
  if (!vm.CauHinhJson) return null;
  try {
    const parsed: unknown = JSON.parse(vm.CauHinhJson);
    if (!parsed || typeof parsed !== "object") return null;
    const cfg = parsed as Partial<CvThemeConfig>;
    if (typeof cfg.id !== "string" || typeof cfg.name !== "string") return null;
    return {
      ...(cfg as CvThemeConfig),
      id: cfg.id || vm.Slug,
      name: cfg.name || vm.Ten,
      layout: normalizeLayoutConfig(
        (cfg as { layout?: unknown }).layout,
      ),
      policy: {
        ...(cfg.policy ?? { policyApproved: false }),
        policyApproved: vm.IsActive,
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
      await cvThemesApi.update(existing.Id, { ...input, Id: existing.Id });
      return { mode: "updated", id: existing.Id };
    }
    const id = await cvThemesApi.create(input);
    return { mode: "created", id };
  } catch (e) {
    return { mode: "local-only", error: e instanceof Error ? e.message : "Không đồng bộ DB được" };
  }
}
