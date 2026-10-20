/**
 * 7 preset themes chuẩn Canva — seed cho bảng Quản lý CV (DB) qua C# seeder.
 * Mỗi config đầy đủ Design Tokens; policyApproved + isPublished = true để
 * lên sóng ngay. JSON export cho C#: chạy `node scripts/export-canva-seeds.cjs`.
 */
import { createDefaultLayoutConfig } from "../resume-data";
import type {
  CvThemeConfig,
  DecorationStyle,
  LayoutStructure,
  ThemeCategory,
  ThemeLevel,
  TimelineStyle,
  ZoneStyle,
} from "../types/theme-studio";

type SeedInput = {
  slug: string;
  name: string;
  description: string;
  gradient: string;
  category: ThemeCategory;
  level: ThemeLevel;
  atsFriendly: boolean;
  structure: LayoutStructure;
  sidebarWidthPct: number;
  sidebarSections?: ("skills" | "certificates" | "education")[];
  contactsPlacement?: "header" | "sidebar";
  colors: CvThemeConfig["colors"];
  typography: Partial<CvThemeConfig["typography"]>;
  zones?: Partial<CvThemeConfig["zones"]>;
  avatarConfig?: CvThemeConfig["avatarConfig"];
  mainWidthPct?: number;
  borderRadiusPx?: number;
  skillDisplayMode?: CvThemeConfig["skillDisplayMode"];
  zoneStyle?: ZoneStyle;
  decoration?: DecorationStyle;
  timelineStyle?: TimelineStyle;
  accentGradient?: string;
};

const BASE_TYPOGRAPHY: CvThemeConfig["typography"] = {
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

const BASE_SPACING: CvThemeConfig["spacing"] = {
  density: "normal",
  sectionGapMm: 5,
  itemGapMm: 3,
  pagePaddingMm: 15,
};

const BASE_ZONES: CvThemeConfig["zones"] = {
  headerBg: "transparent",
  sidebarBg: "#f1f5f9",
  mainBg: "transparent",
};

function makeSeed(input: SeedInput): CvThemeConfig {
  const now = new Date().toISOString();
  const layout = createDefaultLayoutConfig();
  if (input.sidebarSections) layout.sidebarSections = [...input.sidebarSections];
  if (input.contactsPlacement) layout.contactsPlacement = input.contactsPlacement;
  return {
    id: input.slug,
    slug: input.slug,
    name: input.name,
    description: input.description,
    thumbnailGradient: input.gradient,
    category: input.category,
    level: input.level,
    atsFriendly: input.atsFriendly,
    createdAt: now,
    updatedAt: now,
    isDefault: false,
    layout,
    structure: input.structure,
    sidebarWidthPct: input.sidebarWidthPct,
    mainWidthPct: input.mainWidthPct ?? 100,
    borderRadiusPx: input.borderRadiusPx ?? 8,
    zoneStyle: input.zoneStyle ?? "flat",
    decoration: input.decoration ?? "none",
    timelineStyle: input.timelineStyle ?? "none",
    accentGradient: input.accentGradient ?? "",
    skillDisplayMode: input.skillDisplayMode ?? "outline-tag",
    colors: { ...input.colors },
    typography: { ...BASE_TYPOGRAPHY, ...input.typography },
    spacing: { ...BASE_SPACING },
    zones: { ...BASE_ZONES, ...input.zones },
    policy: { policyApproved: true, isPublished: true },
    avatarConfig: input.avatarConfig,
  };
}

export const CANVA_SEEDS: CvThemeConfig[] = [
  makeSeed({
    slug: "canva-corporate-navy",
    name: "Corporate Navy & White",
    description: "Xanh navy công sở, sidebar trái cho chuyên viên truyền thông",
    gradient: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    category: "business",
    level: "all",
    atsFriendly: true,
    structure: "sidebar-left",
    sidebarWidthPct: 33,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    colors: {
      primary: "#1e3a8a",
      secondary: "#3b82f6",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      paperBackground: "#ffffff",
    },
    typography: { headingVariant: "underline", dividerStyle: "solid", enclosure: "flat" },
    zones: { sidebarBg: "#f0f4f8", headerBg: "transparent" },
    avatarConfig: { visible: true, shape: "circle", sizePx: 96, hasBorder: true, borderColor: "primary" },
  }),
  makeSeed({
    slug: "canva-minimal-monochrome",
    name: "Monochrome Minimalist ATS",
    description: "Đen trắng tối giản, 1 cột chuẩn ATS toàn phần",
    gradient: "linear-gradient(135deg,#111827,#4b5563)",
    category: "ats",
    level: "all",
    atsFriendly: true,
    structure: "single",
    sidebarWidthPct: 32,
    colors: {
      primary: "#111827",
      secondary: "#4b5563",
      textPrimary: "#111827",
      textMuted: "#6b7280",
      paperBackground: "#ffffff",
    },
    typography: { headingVariant: "minimal", dividerStyle: "solid", dividerWidthPx: 1, enclosure: "flat", uppercaseHeadings: true, headerAlign: "center" },
    zones: { sidebarBg: "transparent", headerBg: "transparent" },
    avatarConfig: { visible: false, shape: "circle", sizePx: 96, hasBorder: false },
  }),
  makeSeed({
    slug: "canva-clean-slate",
    name: "Community Manager Clean Slate",
    description: "Xám slate hiện đại, sidebar phải, kỹ năng dạng pill",
    gradient: "linear-gradient(135deg,#0f766e,#14b8a6)",
    category: "developer",
    level: "all",
    atsFriendly: true,
    structure: "sidebar-right",
    sidebarWidthPct: 32,
    sidebarSections: ["skills", "certificates", "education"],
    contactsPlacement: "sidebar",
    colors: {
      primary: "#0f766e",
      secondary: "#14b8a6",
      textPrimary: "#1e293b",
      textMuted: "#64748b",
      paperBackground: "#ffffff",
    },
    typography: { headingVariant: "left-border", dividerStyle: "dashed", enclosure: "left-pill", headerAlign: "split" },
    zones: { sidebarBg: "#f8fafc", headerBg: "transparent" },
    avatarConfig: { visible: true, shape: "circle", sizePx: 96, hasBorder: false },
  }),
  makeSeed({
    slug: "canva-blue-gold-designer",
    name: "Modern Graphic Blue & Gold",
    description: "Xanh ocean + vàng gold, sidebar tối, tag dọc DESIGN PORTFOLIO",
    gradient: "linear-gradient(135deg,#0c4a6e,#eab308)",
    category: "designer",
    level: "all",
    atsFriendly: false,
    structure: "sidebar-left",
    sidebarWidthPct: 35,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    zoneStyle: "floating-cards",
    decoration: "geometric-circles",
    colors: {
      primary: "#0c4a6e",
      secondary: "#eab308",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      paperBackground: "#ffffff",
    },
    typography: {
      headingVariant: "pill",
      dividerStyle: "accent-dot",
      verticalTagEnabled: true,
      verticalTagText: "DESIGN PORTFOLIO",
    },
    zones: { sidebarBg: "#0c4a6e", headerBg: "transparent" },
    avatarConfig: { visible: true, shape: "rounded", sizePx: 100, hasBorder: true, borderColor: "secondary" },
  }),
  makeSeed({
    slug: "canva-executive-banner",
    name: "Executive Blue Header Banner",
    description: "Banner ngang xanh royal cho senior, dưới chia 2 cột",
    gradient: "linear-gradient(135deg,#1d4ed8,#1e3a8a)",
    category: "business",
    level: "senior",
    atsFriendly: true,
    structure: "banner-top",
    sidebarWidthPct: 30,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "header",
    zoneStyle: "overlap-header",
    decoration: "top-accent-bar",
    timelineStyle: "boxed-item",
    colors: {
      primary: "#1d4ed8",
      secondary: "#60a5fa",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      paperBackground: "#ffffff",
    },
    typography: { headingVariant: "underline", dividerStyle: "solid", enclosure: "flat" },
    zones: { headerBg: "#1e3a8a", sidebarBg: "#f1f5f9" },
    avatarConfig: { visible: true, shape: "circle", sizePx: 100, hasBorder: true, borderColor: "white" },
  }),
  makeSeed({
    slug: "canva-darkroom-creative",
    name: "Creative Darkroom Studio",
    description: "Tím vàng trên charcoal nghệ thuật, tag dọc VISUAL RESUME",
    gradient: "linear-gradient(135deg,#7c3aed,#f59e0b)",
    category: "creative",
    level: "all",
    atsFriendly: false,
    structure: "sidebar-left",
    sidebarWidthPct: 36,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    zoneStyle: "floating-cards",
    decoration: "soft-blobs",
    timelineStyle: "vertical-line",
    colors: {
      primary: "#7c3aed",
      secondary: "#f59e0b",
      textPrimary: "#18181b",
      textMuted: "#71717a",
      paperBackground: "#fbfbfe",
    },
    typography: {
      fontFamily: "font-mono",
      headingVariant: "left-border",
      dividerStyle: "gradient",
      verticalTagEnabled: true,
      verticalTagText: "VISUAL RESUME",
    },
    zones: { sidebarBg: "#18181b", headerBg: "transparent" },
    avatarConfig: { visible: true, shape: "rounded", sizePx: 100, hasBorder: false },
  }),
  makeSeed({
    slug: "canva-editorial-classic",
    name: "Classic Editorial Grid",
    description: "Đen trắng serif thanh lịch, section đóng khung",
    gradient: "linear-gradient(135deg,#27272a,#71717a)",
    category: "ats",
    level: "senior",
    atsFriendly: true,
    structure: "single",
    sidebarWidthPct: 32,
    colors: {
      primary: "#27272a",
      secondary: "#71717a",
      textPrimary: "#18181b",
      textMuted: "#71717a",
      paperBackground: "#ffffff",
    },
    typography: { fontFamily: "font-serif", headingVariant: "underline", dividerStyle: "solid", enclosure: "boxed", headerAlign: "split" },
    zones: { sidebarBg: "transparent", headerBg: "transparent" },
    avatarConfig: { visible: true, shape: "circle", sizePx: 96, hasBorder: true, borderColor: "muted" },
  }),
];
