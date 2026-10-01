import { createDefaultLayoutConfig } from "../resume-data";
import type {
  CvColorPalette,
  CvSpacingConfig,
  CvThemeConfig,
  CvTypographyConfig,
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
    name,
    description,
    thumbnailGradient,
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    layout: createDefaultLayoutConfig(),
    colors,
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    policy: { policyApproved: true },
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
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    !!t.layout &&
    !!t.colors &&
    !!t.typography &&
    !!t.spacing &&
    !!t.policy
  );
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(themes.filter((t) => !t.isDefault)));
  } catch {
    // localStorage đầy hoặc bị chặn: bỏ qua, giữ theme trong memory phiên này.
  }
}

export function getAllThemes(): CvThemeConfig[] {
  const custom = readStored();
  const ids = new Set(custom.map((t) => t.id));
  return [...custom, ...defaultThemes().filter((t) => !ids.has(t.id))];
}

/** Chỉ theme duyệt policy mới lên TemplatePicker của ứng viên. */
export function getPublishedThemes(): CvThemeConfig[] {
  return getAllThemes().filter((t) => t.policy?.policyApproved === true);
}

export function saveTheme(theme: CvThemeConfig): void {
  const custom = readStored().filter((t) => t.id !== theme.id);
  custom.unshift({ ...theme, updatedAt: new Date().toISOString(), isDefault: false });
  persist(custom);
}

export function deleteTheme(id: string): void {
  persist(readStored().filter((t) => t.id !== id));
}

export function newThemeDraft(name = ""): CvThemeConfig {
  const now = new Date().toISOString();
  return {
    id: `custom-${Date.now().toString(36)}`,
    name,
    description: "",
    thumbnailGradient: "linear-gradient(135deg,#1e293b,#0ea5e9)",
    createdAt: now,
    updatedAt: now,
    isDefault: false,
    layout: createDefaultLayoutConfig(),
    colors: { ...DEFAULT_COLORS },
    typography: { ...DEFAULT_TYPOGRAPHY },
    spacing: { ...DEFAULT_SPACING },
    policy: { policyApproved: false },
  };
}

export { DEFAULT_COLORS, DEFAULT_TYPOGRAPHY, DEFAULT_SPACING };
