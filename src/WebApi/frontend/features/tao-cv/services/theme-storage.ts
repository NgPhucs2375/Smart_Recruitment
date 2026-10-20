import { createDefaultLayoutConfig, normalizeLayoutConfig } from "../resume-data";
import {
  isValidCssGradient,
  sanitizeCssBackground,
  sanitizeCssColor,
} from "../validation";
import { DEFAULT_AVATAR_CONFIG } from "../types/theme-studio";
import type {
  CvColorPalette,
  CvSpacingConfig,
  CvThemeConfig,
  CvThemeCustomization,
  CvTypographyConfig,
  CvZoneBackgrounds,
  DecorationStyle,
  SkillDisplayMode,
  TimelineStyle,
  ZoneStyle,
} from "../types/theme-studio";

const STORAGE_KEY = "smart_cv_custom_themes_v1";

const DEFAULT_COLORS: CvColorPalette = {
  primary: "#1e293b",
  secondary: "#475569",
  textPrimary: "#0f172a",
  textMuted: "#64748b",
  paperBackground: "#ffffff",
};

const DEFAULT_TYPOGRAPHY: CvTypographyConfig = {
  fontFamily: "font-sans",
  baseFontSizePx: 13.5,
  headingVariant: "underline",
  uppercaseHeadings: true,
  dividerStyle: "solid",
  dividerWidthPx: 2,
  enclosure: "flat",
  verticalTagEnabled: false,
  lineHeightScale: 1.4,
  headerAlign: "left",
  dividerSpacingMm: 2,
};

const DEFAULT_DESIGN = {
  mainWidthPct: 100,
  borderRadiusPx: 8,
  zoneStyle: "flat" as ZoneStyle,
  decoration: "none" as DecorationStyle,
  timelineStyle: "none" as TimelineStyle,
  skillDisplayMode: "outline-tag" as SkillDisplayMode,
};

const ZONE_STYLES: ZoneStyle[] = [
  "flat",
  "floating-cards",
  "split-margin",
  "overlap-header",
];
const DECORATION_STYLES: DecorationStyle[] = [
  "none",
  "soft-blobs",
  "geometric-circles",
  "diagonal-cut",
  "top-accent-bar",
  "subtle-grid",
];
const TIMELINE_STYLES: TimelineStyle[] = ["none", "vertical-line", "boxed-item"];

/** Map token kỹ năng legacy -> canonical (theme cũ trong DB / seeds cũ). */
const SKILL_MODE_ALIASES: Record<string, SkillDisplayMode> = {
  tags: "outline-tag",
  inline: "minimal-comma",
  bars: "progress-bar",
};

const DEFAULT_ZONES: CvZoneBackgrounds = {
  headerBg: "transparent",
  sidebarBg: "#f1f5f9",
  mainBg: "transparent",
};

const DEFAULT_SPACING: CvSpacingConfig = {
  density: "normal",
  sectionGapMm: 5,
  itemGapMm: 3,
  pagePaddingMm: 15,
};

function seedTheme(
  id: string,
  name: string,
  description: string,
  thumbnailGradient: string,
  colors: CvColorPalette,
): CvThemeConfig {
  const now = new Date().toISOString();
  return {
    id,
    slug: id,
    name,
    category: "all",
    level: "all",
    atsFriendly: true,
    description,
    thumbnailGradient,
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    layout: createDefaultLayoutConfig(),
    structure: "single",
    sidebarWidthPct: 32,
    ...DEFAULT_DESIGN,
    colors,
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    zones: { ...DEFAULT_ZONES },
    policy: { policyApproved: true, isPublished: true },
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
  };
}

/** 3 theme mặc định đạt chuẩn, luôn có mặt kể cả khi localStorage trống. */
function defaultThemes(): CvThemeConfig[] {
  return [
    seedTheme(
      "corporate-slate",
      "Corporate Slate",
      "Xanh đá công sở, ATS-friendly cho mọi ngành",
      "linear-gradient(135deg,#1e293b,#475569)",
      { ...DEFAULT_COLORS },
    ),
    seedTheme(
      "emerald-dev",
      "Emerald Dev",
      "Xanh ngọc cho lập trình viên hiện đại",
      "linear-gradient(135deg,#047857,#10b981)",
      {
        primary: "#047857",
        secondary: "#10b981",
        textPrimary: "#0f172a",
        textMuted: "#64748b",
        paperBackground: "#ffffff",
      },
    ),
    seedTheme(
      "royal-blue",
      "Deep Royal Blue",
      "Xanh hoàng gia trang trọng cho senior/lead",
      "linear-gradient(135deg,#1d4ed8,#60a5fa)",
      {
        primary: "#1d4ed8",
        secondary: "#60a5fa",
        textPrimary: "#111827",
        textMuted: "#475569",
        paperBackground: "#f8fafc",
      },
    ),
  ];
}

function isThemeConfig(v: unknown): v is CvThemeConfig {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  // Chỉ gate id + name; các khối còn lại do normalizeTheme đắp default.
  return typeof t.id === "string" && t.id.length > 0 && typeof t.name === "string";
}

function readStored(): CvThemeConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isThemeConfig);
  } catch {
    return [];
  }
}

function persist(themes: CvThemeConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(themes.filter((t) => !t.isDefault)),
    );
  } catch {
    // localStorage đầy hoặc bị chặn: bỏ qua, giữ theme trong memory phiên này.
  }
}

export function getAllThemes(): CvThemeConfig[] {
  const custom = readStored().map(normalizeTheme);
  const ids = new Set(custom.map((t) => t.id));
  return [...custom, ...defaultThemes().filter((t) => !ids.has(t.id))];
}

function clampNum(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

const SKILL_MODES: SkillDisplayMode[] = [
  "pill",
  "outline-tag",
  "progress-bar",
  "dot-rating",
  "minimal-comma",
  "list",
];

/** Chuẩn hoá token hiển thị kỹ năng: canonical giữ nguyên, legacy map sang canonical. */
function normalizeSkillMode(v: unknown): SkillDisplayMode {
  if (typeof v === "string") {
    if ((SKILL_MODES as string[]).includes(v)) return v as SkillDisplayMode;
    if (SKILL_MODE_ALIASES[v]) return SKILL_MODE_ALIASES[v];
  }
  return DEFAULT_DESIGN.skillDisplayMode;
}

function pickEnum<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return typeof v === "string" && (allowed as string[]).includes(v)
    ? (v as T)
    : fallback;
}

/** accentGradient chỉ nhận linear-gradient hợp lệ; "" = không dùng (xóa được). */
function normalizeGradient(v: unknown): string {
  if (typeof v !== "string") return "";
  return isValidCssGradient(v) ? v.trim() : "";
}

/** Theme cũ thiếu field mới → đắp default, không vỡ Studio/picker. */
export function normalizeTheme(t: CvThemeConfig): CvThemeConfig {
  const policyApproved = t.policy?.policyApproved ?? false;
  const rawColors = (t as unknown as { colors?: Record<string, unknown> }).colors ?? {};
  const rawZones = (t as unknown as { zones?: Record<string, unknown> }).zones ?? {};
  const clean = (v: unknown, fallback: string) =>
    sanitizeCssColor(typeof v === "string" ? v : "", fallback);
  return {
    ...t,
    slug: t.slug || t.id,
    category: t.category ?? "all",
    level: t.level ?? "all",
    atsFriendly: t.atsFriendly ?? true,
    layout: normalizeLayoutConfig(
      (t as { layout?: unknown }).layout,
    ),
    colors: {
      ...DEFAULT_COLORS,
      ...Object.fromEntries(
        Object.entries(rawColors).map(([k, v]) => [
          k,
          clean(v, DEFAULT_COLORS[k as keyof typeof DEFAULT_COLORS] ?? "#1e293b"),
        ]),
      ),
      // Nền giấy cho phép gradient (Canva paper) — không bị clean() ép về hex.
      paperBackground: sanitizeCssBackground(
        rawColors.paperBackground,
        DEFAULT_COLORS.paperBackground,
      ),
    },
    structure: t.structure ?? "single",
    sidebarWidthPct:
      typeof t.sidebarWidthPct === "number"
        ? Math.max(25, Math.min(45, t.sidebarWidthPct))
        : 32,
    mainWidthPct: clampNum(t.mainWidthPct, 60, 100, DEFAULT_DESIGN.mainWidthPct),
    borderRadiusPx: clampNum(
      t.borderRadiusPx,
      0,
      16,
      DEFAULT_DESIGN.borderRadiusPx,
    ),
    zoneStyle: pickEnum(t.zoneStyle, ZONE_STYLES, DEFAULT_DESIGN.zoneStyle),
    decoration: pickEnum(t.decoration, DECORATION_STYLES, DEFAULT_DESIGN.decoration),
    timelineStyle: pickEnum(t.timelineStyle, TIMELINE_STYLES, DEFAULT_DESIGN.timelineStyle),
    accentGradient: normalizeGradient(t.accentGradient),
    skillDisplayMode: normalizeSkillMode(t.skillDisplayMode),
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      ...(t.typography ?? {}),
      lineHeightScale: clampNum(t.typography?.lineHeightScale, 1.1, 1.7, 1.4),
      dividerSpacingMm: clampNum(t.typography?.dividerSpacingMm, 0, 6, 2),
    },
    spacing: { ...DEFAULT_SPACING, ...(t.spacing ?? {}) },
    zones: {
      ...DEFAULT_ZONES,
      ...Object.fromEntries(
        Object.entries(rawZones).map(([k, v]) => [
          k,
          // Nền phân vùng cho phép gradient lẫn rgba trong suốt.
          sanitizeCssBackground(
            v,
            DEFAULT_ZONES[k as keyof typeof DEFAULT_ZONES] ?? "transparent",
          ),
        ]),
      ),
    },
    policy: {
      ...(t.policy ?? {}),
      policyApproved,
      isPublished: t.policy?.isPublished ?? policyApproved,
    },
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG, ...(t.avatarConfig ?? {}) },
  };
}

/**
 * Theme đang Hiển thị (IsActive) mới lên picker của ứng viên.
 * Cổng publish duy nhất là isPublished; policyApproved chỉ là nhãn audit
 * nội bộ admin nên KHÔNG dùng để chặn user.
 */
export function getPublishedThemes(): CvThemeConfig[] {
  return getAllThemes().filter((t) => t.policy?.isPublished !== false);
}

/**
 * Khớp theme theo định danh canonical (slug) hoặc id nội bộ (CV cũ đã lưu
 * cfg.id). Dùng thống nhất ở preview/PDF để không rơi về template mặc định.
 */
export function themeMatchesId(theme: CvThemeConfig, id: string): boolean {
  return theme.slug === id || theme.id === id;
}

/** Tìm trong danh sách theme đã publish theo slug hoặc id nội bộ. */
export function findPublishedTheme(
  themes: CvThemeConfig[],
  id: string,
): CvThemeConfig | null {
  return themes.find((t) => themeMatchesId(t, id)) ?? null;
}

/**
 * Ghép delta tùy biến của ứng viên lên theme nền (đã publish), rồi chuẩn hoá
 * lại toàn bộ (clamp token). Delta null/undefined = giữ nguyên theme gốc.
 */
export function applyThemeCustomization(
  base: CvThemeConfig,
  delta?: CvThemeCustomization | null,
): CvThemeConfig {
  if (!delta) return base;
  return normalizeTheme({
    ...base,
    structure: delta.structure ?? base.structure,
    sidebarWidthPct: delta.sidebarWidthPct ?? base.sidebarWidthPct,
    mainWidthPct: delta.mainWidthPct ?? base.mainWidthPct,
    borderRadiusPx: delta.borderRadiusPx ?? base.borderRadiusPx,
    zoneStyle: delta.zoneStyle ?? base.zoneStyle,
    decoration: delta.decoration ?? base.decoration,
    timelineStyle: delta.timelineStyle ?? base.timelineStyle,
    accentGradient: delta.accentGradient ?? base.accentGradient,
    skillDisplayMode: delta.skillDisplayMode ?? base.skillDisplayMode,
    colors: { ...base.colors, ...(delta.colors ?? {}) },
    typography: { ...base.typography, ...(delta.typography ?? {}) },
    spacing: { ...base.spacing, ...(delta.spacing ?? {}) },
    zones: { ...base.zones, ...(delta.zones ?? {}) },
    avatarConfig: {
      ...(base.avatarConfig ?? DEFAULT_AVATAR_CONFIG),
      ...(delta.avatarConfig ?? {}),
    },
    layout: delta.layout ?? base.layout,
  });
}

/** Diff nông cho object phẳng (colors/typography/spacing/zones/avatar). */
function shallowDiff<T extends object>(base: T, next: T): Partial<T> | undefined {
  const out: Partial<T> = {};
  let changed = false;
  (Object.keys(next) as (keyof T)[]).forEach((key) => {
    if (next[key] !== base[key]) {
      out[key] = next[key];
      changed = true;
    }
  });
  return changed ? out : undefined;
}

/**
 * Tính delta từ theme nền `base` -> bản đang chỉnh `next` để chỉ lưu phần khác
 * biệt (guardrail: không clone full theme). Trả undefined khi không đổi gì.
 */
export function diffThemeCustomization(
  base: CvThemeConfig,
  next: CvThemeConfig,
): CvThemeCustomization | undefined {
  const b = normalizeTheme(base);
  const n = normalizeTheme(next);
  const delta: CvThemeCustomization = { themeId: b.slug || b.id };
  let changed = false;

  if ((n.structure ?? "single") !== (b.structure ?? "single")) {
    delta.structure = n.structure;
    changed = true;
  }
  if ((n.sidebarWidthPct ?? 32) !== (b.sidebarWidthPct ?? 32)) {
    delta.sidebarWidthPct = n.sidebarWidthPct;
    changed = true;
  }
  if ((n.mainWidthPct ?? 100) !== (b.mainWidthPct ?? 100)) {
    delta.mainWidthPct = n.mainWidthPct;
    changed = true;
  }
  if ((n.borderRadiusPx ?? 8) !== (b.borderRadiusPx ?? 8)) {
    delta.borderRadiusPx = n.borderRadiusPx;
    changed = true;
  }
  if ((n.zoneStyle ?? "flat") !== (b.zoneStyle ?? "flat")) {
    delta.zoneStyle = n.zoneStyle;
    changed = true;
  }
  if ((n.decoration ?? "none") !== (b.decoration ?? "none")) {
    delta.decoration = n.decoration;
    changed = true;
  }
  if ((n.timelineStyle ?? "none") !== (b.timelineStyle ?? "none")) {
    delta.timelineStyle = n.timelineStyle;
    changed = true;
  }
  if ((n.accentGradient ?? "") !== (b.accentGradient ?? "")) {
    delta.accentGradient = n.accentGradient ?? "";
    changed = true;
  }
  if (normalizeSkillMode(n.skillDisplayMode) !== normalizeSkillMode(b.skillDisplayMode)) {
    delta.skillDisplayMode = normalizeSkillMode(n.skillDisplayMode);
    changed = true;
  }

  const colors = shallowDiff(b.colors, n.colors);
  if (colors) {
    delta.colors = colors;
    changed = true;
  }
  const typography = shallowDiff(b.typography, n.typography);
  if (typography) {
    delta.typography = typography;
    changed = true;
  }
  const spacing = shallowDiff(b.spacing, n.spacing);
  if (spacing) {
    delta.spacing = spacing;
    changed = true;
  }
  const zones = shallowDiff(b.zones, n.zones);
  if (zones) {
    delta.zones = zones;
    changed = true;
  }
  const avatarConfig = shallowDiff(
    b.avatarConfig ?? DEFAULT_AVATAR_CONFIG,
    n.avatarConfig ?? DEFAULT_AVATAR_CONFIG,
  );
  if (avatarConfig) {
    delta.avatarConfig = avatarConfig;
    changed = true;
  }
  if (JSON.stringify(b.layout) !== JSON.stringify(n.layout)) {
    delta.layout = n.layout;
    changed = true;
  }

  return changed ? delta : undefined;
}

export function saveTheme(theme: CvThemeConfig): void {
  const custom = readStored().filter((t) => t.id !== theme.id);
  custom.unshift({
    ...theme,
    updatedAt: new Date().toISOString(),
    isDefault: false,
  });
  persist(custom);
}

export function deleteTheme(id: string): void {
  persist(readStored().filter((t) => t.id !== id));
}

function randomIdSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Nhân bản 1 theme thành BẢN MỚI: sinh `id` mới, bỏ `slug` (tự gen theo tên
 * mới), reset cờ publish — để lưu KHÔNG đè mẫu gốc trên DB.
 */
export function cloneThemeConfig(
  src: CvThemeConfig,
  name?: string,
): CvThemeConfig {
  const now = new Date().toISOString();
  return {
    ...src,
    id: `custom-${Date.now().toString(36)}-${randomIdSuffix()}`,
    slug: "",
    name: name ?? src.name,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    layout: {
      ...src.layout,
      sections: Object.fromEntries(
        Object.entries(src.layout.sections).map(([k, v]) => [k, { ...v }]),
      ) as typeof src.layout.sections,
      sectionOrder: [...src.layout.sectionOrder],
      sidebarSections: src.layout.sidebarSections
        ? [...src.layout.sidebarSections]
        : undefined,
    },
    colors: { ...src.colors },
    typography: { ...src.typography },
    spacing: { ...src.spacing },
    zones: { ...src.zones },
    avatarConfig: src.avatarConfig ? { ...src.avatarConfig } : undefined,
    policy: { policyApproved: false, isPublished: true },
  };
}

export function newThemeDraft(name = ""): CvThemeConfig {
  const now = new Date().toISOString();
  return {
    id: `custom-${Date.now().toString(36)}`,
    slug: "",
    name,
    category: "all",
    level: "all",
    atsFriendly: true,
    description: "",
    thumbnailGradient: "linear-gradient(135deg,#1e293b,#0ea5e9)",
    createdAt: now,
    updatedAt: now,
    isDefault: false,
    layout: createDefaultLayoutConfig(),
    structure: "single",
    sidebarWidthPct: 32,
    ...DEFAULT_DESIGN,
    colors: { ...DEFAULT_COLORS },
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    zones: { ...DEFAULT_ZONES },
    policy: { policyApproved: false, isPublished: true },
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
  };
}

export { DEFAULT_COLORS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING, DEFAULT_ZONES };
