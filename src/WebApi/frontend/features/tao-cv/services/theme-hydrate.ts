/**
 * "Convert / Hydrate sang Studio": dựng base CvThemeConfig cho MỌI mẫu CV
 * (kể cả template tĩnh chưa có CauHinhJson) để User mở Studio tùy biến tự do.
 * Bảng seed thủ công dưới đây bám sát cấu trúc/màu của từng template gốc; các
 * mẫu `canva-*` tái dùng nguyên CANVA_SEEDS cho khớp tuyệt đối.
 *
 * QUAN TRỌNG: id hydrate phải XÁC ĐỊNH (`hydrateThemeId`) để delta `giaoDien`
 * khớp được giữa dialog Studio và preview bên dưới (nếu id đổi mỗi lần gọi,
 * themeMatchesId sẽ trượt và "Áp dụng" không đổ xuống preview).
 */
import type { CvSectionId } from "../resume-data";
import type {
  CvAvatarConfig,
  CvColorPalette,
  CvThemeConfig,
  CvTypographyConfig,
  DecorationStyle,
  HeaderAlign,
  LayoutStructure,
  SkillDisplayMode,
  TimelineStyle,
  ZoneStyle,
} from "../types/theme-studio";
import { CANVA_SEEDS } from "./canva-seeds";
import { newThemeDraft, normalizeTheme } from "./theme-storage";

/** Id xác định cho theme hydrate từ template — bắt buộc ổn định giữa các lần gọi. */
export function hydrateThemeId(templateId: string): string {
  return `hydrated-${templateId}`;
}

interface TemplateSeed {
  name: string;
  colors: Partial<CvColorPalette>;
  structure?: LayoutStructure;
  sidebarWidthPct?: number;
  sidebarSections?: CvSectionId[];
  contactsPlacement?: "header" | "sidebar";
  headerAlign?: HeaderAlign;
  typography?: Partial<CvTypographyConfig>;
  zones?: Partial<CvThemeConfig["zones"]>;
  mainWidthPct?: number;
  borderRadiusPx?: number;
  skillDisplayMode?: SkillDisplayMode;
  zoneStyle?: ZoneStyle;
  decoration?: DecorationStyle;
  timelineStyle?: TimelineStyle;
  accentGradient?: string;
  avatarConfig?: CvAvatarConfig;
}

const NO_AVATAR: CvAvatarConfig = {
  visible: false,
  shape: "circle",
  sizePx: 96,
  hasBorder: false,
  borderColor: "primary",
  position: "left",
};

const avatar = (p: Partial<CvAvatarConfig>): CvAvatarConfig => ({
  ...NO_AVATAR,
  visible: true,
  ...p,
});

/**
 * Seed cho 28 template tĩnh (7 mẫu canva-* lấy từ CANVA_SEEDS).
 * Bảng đã đối chiếu trực tiếp với JSX từng template (structure, cột sidebar,
 * căn header, màu, kiểu heading, avatar).
 */
const TEMPLATE_THEME_SEEDS: Record<string, TemplateSeed> = {
  "academic-cv": {
    name: "Academic CV",
    colors: { primary: "#171717", secondary: "#4b5563", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { fontFamily: "font-serif", headingVariant: "underline" },
    avatarConfig: NO_AVATAR,
  },
  "archi-portfolio": {
    name: "Archi Portfolio",
    colors: { primary: "#334155", secondary: "#475569", textMuted: "#64748b", paperBackground: "#f8fafc" },
    headerAlign: "split",
    typography: { fontFamily: "font-mono", headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    decoration: "subtle-grid",
    borderRadiusPx: 0,
    avatarConfig: NO_AVATAR,
  },
  "ats-classic": {
    name: "ATS Classic",
    colors: { primary: "#171717", secondary: "#6b7280", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "center",
    typography: { headingVariant: "underline", dividerStyle: "none", dividerWidthPx: 1 },
    skillDisplayMode: "minimal-comma",
    avatarConfig: NO_AVATAR,
  },
  "beige-editorial": {
    name: "Beige Editorial",
    colors: { primary: "#292524", secondary: "#78716c", textMuted: "#78716c", paperBackground: "#f7f2e7" },
    headerAlign: "left",
    typography: { fontFamily: "font-serif", headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    zoneStyle: "floating-cards",
    avatarConfig: avatar({ shape: "circle", sizePx: 80, hasBorder: true, borderColor: "white" }),
  },
  "bento-grid": {
    name: "Bento Grid",
    colors: { primary: "#1e3a5f", secondary: "#3b82f6", textMuted: "#64748b", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    zoneStyle: "floating-cards",
    borderRadiusPx: 0,
    skillDisplayMode: "pill",
    avatarConfig: NO_AVATAR,
  },
  "care-plus": {
    name: "Care Plus",
    colors: { primary: "#1e3a8a", secondary: "#2563eb", textMuted: "#64748b", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "accent-bg", dividerStyle: "none" },
    avatarConfig: NO_AVATAR,
  },
  "clean-corporate": {
    name: "Clean Corporate",
    colors: { primary: "#171717", secondary: "#6b7280", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "center",
    typography: { headingVariant: "minimal", dividerStyle: "none", dividerWidthPx: 1 },
    avatarConfig: NO_AVATAR,
  },
  "compact-developer": {
    name: "Compact Developer",
    colors: { primary: "#171717", secondary: "#525252", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "split",
    typography: { fontFamily: "font-mono", headingVariant: "underline", dividerWidthPx: 1 },
    avatarConfig: NO_AVATAR,
  },
  "creative-portfolio": {
    name: "Creative Portfolio",
    colors: { primary: "#7a3b4d", secondary: "#a85c72", textMuted: "#71717a", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    avatarConfig: NO_AVATAR,
  },
  "culinary-signature": {
    name: "Culinary Signature",
    colors: { primary: "#a16207", secondary: "#881337", textMuted: "#78716c", paperBackground: "#fffbeb" },
    headerAlign: "center",
    typography: { fontFamily: "font-serif", headingVariant: "accent-bg", dividerStyle: "none" },
    avatarConfig: NO_AVATAR,
  },
  "data-specialist": {
    name: "Data Specialist",
    colors: { primary: "#274b73", secondary: "#3b82f6", textMuted: "#5b6470", paperBackground: "#ffffff" },
    headerAlign: "split",
    typography: { fontFamily: "font-mono", headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    avatarConfig: NO_AVATAR,
  },
  "den-moody": {
    name: "Den Moody",
    colors: { primary: "#292524", secondary: "#44403c", textMuted: "#78716c", paperBackground: "#fafaf9" },
    structure: "sidebar-left",
    sidebarWidthPct: 34,
    sidebarSections: ["summary", "skills"],
    contactsPlacement: "sidebar",
    headerAlign: "left",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    zones: { sidebarBg: "#1c1917" },
    avatarConfig: avatar({ shape: "square", sizePx: 120, hasBorder: false }),
  },
  "do-hoa-lime": {
    name: "Đồ hoạ Lime",
    colors: { primary: "#1d4ed8", secondary: "#65a30d", textMuted: "#64748b", paperBackground: "#ffffff" },
    structure: "sidebar-left",
    sidebarWidthPct: 32,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    headerAlign: "left",
    typography: { headingVariant: "underline", dividerStyle: "none" },
    zones: { sidebarBg: "#1d4ed8" },
    skillDisplayMode: "progress-bar",
    avatarConfig: avatar({ shape: "circle", sizePx: 96, hasBorder: true, borderColor: "white" }),
  },
  "editorial-magazine": {
    name: "Editorial Magazine",
    colors: { primary: "#111827", secondary: "#b91c1c", textMuted: "#78716c", paperBackground: "#fafaf9" },
    structure: "sidebar-right",
    sidebarWidthPct: 35,
    sidebarSections: ["skills", "education", "certificates"],
    contactsPlacement: "sidebar",
    headerAlign: "split",
    typography: { fontFamily: "font-serif", headingVariant: "minimal", dividerStyle: "solid", dividerWidthPx: 1 },
    avatarConfig: NO_AVATAR,
  },
  "forest-fresh": {
    name: "Forest Fresh",
    colors: { primary: "#14532d", secondary: "#22c55e", textMuted: "#4b5563", paperBackground: "#ffffff" },
    headerAlign: "center",
    typography: { fontFamily: "font-serif", headingVariant: "underline" },
    avatarConfig: NO_AVATAR,
  },
  "kem-minimal": {
    name: "Kem Minimal",
    colors: { primary: "#1c1917", secondary: "#78716c", textMuted: "#a8a29e", paperBackground: "#f7f2e9" },
    headerAlign: "split",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    avatarConfig: avatar({ shape: "circle", sizePx: 80, hasBorder: false }),
  },
  "legal-prestige": {
    name: "Legal Prestige",
    colors: { primary: "#1e3a5f", secondary: "#8a6d2f", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "center",
    typography: { fontFamily: "font-serif", headingVariant: "underline" },
    avatarConfig: NO_AVATAR,
  },
  "mentor-class": {
    name: "Mentor Class",
    colors: { primary: "#1e3a8a", secondary: "#2563eb", textMuted: "#6b7280", paperBackground: "#f8fafc" },
    headerAlign: "left",
    typography: { headingVariant: "underline" },
    avatarConfig: NO_AVATAR,
  },
  "minimal-ats": {
    name: "Minimal ATS",
    colors: { primary: "#171717", secondary: "#6b7280", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "underline", dividerStyle: "none", dividerWidthPx: 1 },
    skillDisplayMode: "minimal-comma",
    avatarConfig: NO_AVATAR,
  },
  "mono-portfolio": {
    name: "Mono Portfolio",
    colors: { primary: "#111111", secondary: "#6b7280", textMuted: "#6b7280", paperBackground: "#ffffff" },
    headerAlign: "split",
    typography: { fontFamily: "font-mono", headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    avatarConfig: avatar({ shape: "square", sizePx: 110, hasBorder: false }),
  },
  "nhan-su-royal": {
    name: "Nhân sự Royal",
    colors: { primary: "#1d4ed8", secondary: "#1e3a8a", textMuted: "#64748b", paperBackground: "#ffffff" },
    headerAlign: "split",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    borderRadiusPx: 12,
    skillDisplayMode: "progress-bar",
    avatarConfig: avatar({ shape: "circle", sizePx: 112, hasBorder: true, borderColor: "secondary" }),
  },
  "ocean-wave": {
    name: "Ocean Wave",
    colors: { primary: "#1e3a8a", secondary: "#075985", textMuted: "#475569", paperBackground: "#ffffff" },
    structure: "sidebar-left",
    sidebarWidthPct: 34,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    headerAlign: "left",
    typography: { headingVariant: "underline" },
    zones: { sidebarBg: "#1e3a8a" },
    timelineStyle: "vertical-line",
    avatarConfig: NO_AVATAR,
  },
  "research-scholar": {
    name: "Research Scholar",
    colors: { primary: "#14532d", secondary: "#166534", textMuted: "#4b5563", paperBackground: "#f7f5ef" },
    structure: "sidebar-right",
    sidebarWidthPct: 32,
    sidebarSections: ["skills", "certificates"],
    headerAlign: "left",
    typography: { fontFamily: "font-serif", headingVariant: "underline" },
    zones: { sidebarBg: "#14532d" },
    avatarConfig: NO_AVATAR,
  },
  "snapshot-pro": {
    name: "Snapshot Pro",
    // Mẫu gốc: sidebar PHẢI 65/35 (Kỹ năng/Học vấn/Chứng chỉ), header căn trái.
    colors: { primary: "#1e3a8a", secondary: "#475569", textMuted: "#64748b", paperBackground: "#ffffff" },
    structure: "sidebar-right",
    sidebarWidthPct: 35,
    sidebarSections: ["skills", "education", "certificates"],
    contactsPlacement: "header",
    headerAlign: "left",
    typography: { headingVariant: "underline" },
    zones: { sidebarBg: "#faf7f2" },
    // Mẫu gốc chỉ dùng monogram chữ (initials), không có ảnh.
    avatarConfig: avatar({ shape: "circle", sizePx: 88, hasBorder: false }),
  },
  "startup-modern": {
    name: "Startup Modern",
    colors: { primary: "#274b73", secondary: "#3b82f6", textMuted: "#5b6470", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "pill", dividerStyle: "none" },
    borderRadiusPx: 10,
    skillDisplayMode: "pill",
    accentGradient: "linear-gradient(135deg,#274b73,#3b82f6)",
    avatarConfig: NO_AVATAR,
  },
  "tech-modern": {
    name: "Tech Modern",
    colors: { primary: "#274b73", secondary: "#3b82f6", textMuted: "#5b6470", paperBackground: "#f2f5f9" },
    structure: "sidebar-left",
    sidebarWidthPct: 32,
    sidebarSections: ["skills", "certificates"],
    contactsPlacement: "sidebar",
    headerAlign: "left",
    typography: { headingVariant: "underline" },
    zones: { sidebarBg: "#f2f5f9" },
    avatarConfig: NO_AVATAR,
  },
  "vault-finance": {
    name: "Vault Finance",
    colors: { primary: "#0f2a44", secondary: "#c9a227", textMuted: "#64748b", paperBackground: "#ffffff" },
    structure: "banner-top",
    headerAlign: "left",
    typography: { headingVariant: "underline" },
    zones: { headerBg: "linear-gradient(135deg,#0f2a44,#1d4e7a)" },
    avatarConfig: NO_AVATAR,
  },
  "zen-minimal": {
    name: "Zen Minimal",
    colors: { primary: "#27272a", secondary: "#9ca3af", textMuted: "#9ca3af", paperBackground: "#ffffff" },
    headerAlign: "left",
    typography: { headingVariant: "minimal", dividerStyle: "none", uppercaseHeadings: false },
    decoration: "subtle-grid",
    avatarConfig: NO_AVATAR,
  },
};

/** Config Studio gốc (chưa ép id) cho template — null nếu không có seed. */
function templateSeedBase(templateId: string): CvThemeConfig | null {
  const canva = CANVA_SEEDS.find(
    (s) => s.slug === templateId || s.id === templateId,
  );
  if (canva) {
    return normalizeTheme({
      ...canva,
      policy: { policyApproved: false, isPublished: true },
    });
  }
  const seed = TEMPLATE_THEME_SEEDS[templateId];
  if (!seed) return null;
  const base = newThemeDraft(seed.name);
  const layout = {
    ...base.layout,
    ...(seed.sidebarSections ? { sidebarSections: [...seed.sidebarSections] } : {}),
    ...(seed.contactsPlacement
      ? { contactsPlacement: seed.contactsPlacement }
      : {}),
  };
  return normalizeTheme({
    ...base,
    layout,
    colors: { ...base.colors, ...seed.colors },
    typography: {
      ...base.typography,
      ...(seed.typography ?? {}),
      ...(seed.headerAlign ? { headerAlign: seed.headerAlign } : {}),
    },
    structure: seed.structure ?? base.structure,
    sidebarWidthPct: seed.sidebarWidthPct ?? base.sidebarWidthPct,
    mainWidthPct: seed.mainWidthPct ?? base.mainWidthPct,
    borderRadiusPx: seed.borderRadiusPx ?? base.borderRadiusPx,
    skillDisplayMode: seed.skillDisplayMode ?? base.skillDisplayMode,
    zoneStyle: seed.zoneStyle ?? base.zoneStyle,
    decoration: seed.decoration ?? base.decoration,
    timelineStyle: seed.timelineStyle ?? base.timelineStyle,
    accentGradient: seed.accentGradient ?? base.accentGradient,
    zones: { ...base.zones, ...(seed.zones ?? {}) },
    avatarConfig: { ...base.avatarConfig, ...(seed.avatarConfig ?? {}) } as CvAvatarConfig,
  });
}

/**
 * Hydrate base cho BẤT KỲ mẫu nào. Template không có seed (mới thêm sau này)
 * rơi về draft trắng trung tính để User vẫn tùy biến được. Id LUÔN xác định.
 */
export function hydrateThemeFromTemplate(templateId: string): CvThemeConfig {
  const base = templateSeedBase(templateId) ?? newThemeDraft(templateId);
  return normalizeTheme({
    ...base,
    id: hydrateThemeId(templateId),
    slug: "",
  });
}

/** Template tĩnh này có seed hydrate sát thiết kế gốc hay không. */
export function hasTemplateSeed(templateId: string): boolean {
  return templateSeedBase(templateId) !== null;
}
