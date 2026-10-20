import type { CvSectionId, ResumeLayoutConfig } from "../resume-data";

export type FontFamilyToken = "font-sans" | "font-serif" | "font-mono";
export type HeadingVariant =
  "underline" | "left-border" | "pill" | "minimal" | "accent-bg";
export type SpacingDensity = "compact" | "normal" | "relaxed";
export type LayoutStructure =
  "single" | "sidebar-left" | "sidebar-right" | "banner-top";
export type DividerStyle =
  "solid" | "dashed" | "gradient" | "accent-dot" | "none";
export type SectionEnclosure = "flat" | "boxed" | "left-pill";
/** Căn lề khối header (tên, chức danh, liên hệ). */
/** split = tên/chức danh bên trái, avatar + liên hệ dồn sang phải. */
export type HeaderAlign = "left" | "center" | "right" | "split";
/**
 * Cách hiển thị danh sách kỹ năng (chuẩn mới kiểu Canva).
 * Legacy `tags | inline | bars` được normalize sang `outline-tag | minimal-comma | progress-bar`.
 */
export type SkillDisplayMode =
  | "pill"
  | "outline-tag"
  | "progress-bar"
  | "dot-rating"
  | "minimal-comma"
  | "list"
  // Legacy (theme cũ trong DB / seeds cũ) — luôn map về canonical khi normalize.
  | "tags"
  | "inline"
  | "bars";
/** Vị trí avatar so với khối chữ trong header. */
export type AvatarPosition = "left" | "right";
/** Kiểu dáng phân vùng (Canva-like): ghép sát / thẻ nổi / lề giấy / đè header. */
export type ZoneStyle =
  | "flat"
  | "floating-cards"
  | "split-margin"
  | "overlap-header";
/** Họa tiết trang trí nền tờ CV. */
export type DecorationStyle =
  | "none"
  | "soft-blobs"
  | "geometric-circles"
  | "diagonal-cut"
  | "top-accent-bar"
  | "subtle-grid";
/** Kiểu timeline cho Kinh nghiệm / Học vấn. */
export type TimelineStyle = "none" | "vertical-line" | "boxed-item";

export interface CvColorPalette {
  /** Màu thương hiệu (tiêu đề, gạch chân, icon, tag). */
  primary: string;
  /** Màu nhấn phụ (subheadings, timeline line). */
  secondary: string;
  /** Màu chữ nội dung chính. */
  textPrimary: string;
  /** Màu chữ phụ. */
  textMuted: string;
  /** Nền giấy A4. */
  paperBackground: string;
}

export interface CvTypographyConfig {
  fontFamily: FontFamilyToken;
  /** 12px -> 15px (default 13.5px). */
  baseFontSizePx: number;
  headingVariant: HeadingVariant;
  uppercaseHeadings: boolean;
  /** Kiểu đường phân cách giữa các mục. */
  dividerStyle: DividerStyle;
  /** Độ dày nét liền/nét đứt (1 | 2). */
  dividerWidthPx: 1 | 2;
  /** Kiểu bọc section. */
  enclosure: SectionEnclosure;
  /** Dải chữ xoay dọc mép giấy. */
  verticalTagEnabled: boolean;
  /** Chữ trong dải dọc (trống = dùng chức danh). */
  verticalTagText?: string;
  /** Hệ số giãn dòng (1.1–1.7, default 1.4). */
  lineHeightScale: number;
  /** Căn lề khối header. */
  headerAlign: HeaderAlign;
  /** Khoảng hở trên/dưới đường phân cách mục (0–6mm, default 2). */
  dividerSpacingMm: number;
}

export interface CvSpacingConfig {
  density: SpacingDensity;
  /** Khoảng cách giữa các section (default 5mm). */
  sectionGapMm: number;
  /** Khoảng cách giữa các item con (default 3mm). */
  itemGapMm: number;
  /** Lề 4 phía tờ A4 (default 15mm). */
  pagePaddingMm: number;
}

export interface CvZoneBackgrounds {
  /** Nền khối header/banner (hỗ trợ rgba trong suốt). */
  headerBg: string;
  /** Nền cột sidebar (hỗ trợ rgba trong suốt). */
  sidebarBg: string;
  /** Nền phần nội dung chính. */
  mainBg: string;
}

/** Cấu hình ảnh đại diện trong ThemeCanvas (Task avatar). */
export interface CvAvatarConfig {
  /** Cho phép hiển thị avatar trong theme này hay không. */
  visible: boolean;
  /** circle = rounded-full | rounded = rounded-2xl | square = rounded-none. */
  shape: "circle" | "rounded" | "square";
  /** 80 | 100 | 120 (default 96). */
  sizePx: number;
  /** Có viền bao quanh hay không. */
  hasBorder: boolean;
  /** Màu viền theo token theme. */
  borderColor?: "primary" | "secondary" | "white" | "muted";
  /** Vị trí avatar so với khối chữ (default trái). */
  position?: AvatarPosition;
}

export const DEFAULT_AVATAR_CONFIG: CvAvatarConfig = {
  visible: true,
  shape: "circle",
  sizePx: 96,
  hasBorder: false,
  borderColor: "primary",
  position: "left",
};

export interface CvPublishPolicy {
  /** Switch duyệt phát hành (audit gate: tên + sections + contrast). */
  policyApproved: boolean;
  /** Switch "Hiển thị" trên bảng admin (map IsActive DB). Độc lập với policyApproved. */
  isPublished: boolean;
  /** Admin ID / Username. */
  approvedBy?: string;
  /** ISO Date string. */
  approvedAt?: string;
  /** Ghi chú phiên bản của Admin. */
  notes?: string;
}

/** Danh mục theme (map DanhMuc DB) — hiển thị ở bảng quản trị. */
export type ThemeCategory = "ats" | "developer" | "designer" | "business" | "creative" | "all";
/** Cấp bậc mục tiêu (map CapBac DB) — hiển thị ở bảng quản trị. */
export type ThemeLevel = "fresher" | "junior" | "senior" | "all";

export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: "ats", label: "ATS chuẩn" },
  { id: "developer", label: "Developer" },
  { id: "designer", label: "Designer" },
  { id: "business", label: "Business" },
  { id: "creative", label: "Sáng tạo" },
  { id: "all", label: "Tất cả" },
];

export const THEME_LEVELS: { id: ThemeLevel; label: string }[] = [
  { id: "fresher", label: "Fresher" },
  { id: "junior", label: "Junior" },
  { id: "senior", label: "Senior" },
  { id: "all", label: "Mọi cấp bậc" },
];

/** Slug từ tên theme: bỏ dấu, thường hóa, nối gạch ngang. */
export function slugifyThemeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export interface CvThemeConfig {
  /** Khóa nội bộ duy nhất (vd 'custom-m3x…'); DB dùng `slug` làm định danh. */
  id: string;
  /** Tên hiển thị (vd 'Emerald Engineer Modern'). */
  name: string;
  /** Slug / mã định danh (map Slug DB, hiện ở bảng quản trị). Trống = tự gen theo tên. */
  slug: string;
  /** Danh mục (map DanhMuc DB). */
  category: ThemeCategory;
  /** Cấp bậc mục tiêu (map CapBac DB). */
  level: ThemeLevel;
  /** Chuẩn ATS (map ThanThienATS DB). */
  atsFriendly: boolean;
  description?: string;
  /** Gradient preview nhỏ trên TemplatePicker. */
  thumbnailGradient?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;

  // 4 trụ cột theme + vùng màu & khung xương mở rộng
  layout: ResumeLayoutConfig;
  /** Khung xương: 1 cột / sidebar trái-phải / banner. */
  structure: LayoutStructure;
  /** Rộng sidebar % (25–45) khi layout 2 cột. */
  sidebarWidthPct: number;
  /** Bề rộng vùng nội dung chính % tờ giấy (60–100) — áp cho 1 cột/banner. */
  mainWidthPct: number;
  /** Bo góc khối bọc/kỹ năng (0–16px, default 8). */
  borderRadiusPx: number;
  /** Kiểu dáng phân vùng (thẻ nổi, vát lề…) — Canva-like. */
  zoneStyle: ZoneStyle;
  /** Họa tiết trang trí nền (blob, vòng tròn, vát chéo…). */
  decoration: DecorationStyle;
  /** Kiểu timeline cho Kinh nghiệm / Học vấn. */
  timelineStyle: TimelineStyle;
  /** Gradient điểm nhấn (heading accent-bg, divider, thanh đỉnh). Optional. */
  accentGradient?: string;
  /** Kiểu hiển thị kỹ năng. */
  skillDisplayMode: SkillDisplayMode;
  colors: CvColorPalette;
  typography: CvTypographyConfig;
  spacing: CvSpacingConfig;
  zones: CvZoneBackgrounds;
  policy: CvPublishPolicy;
  /** Cấu hình avatar (optional để tương thích theme cũ). */
  avatarConfig?: CvAvatarConfig;
}

/**
 * Delta tùy biến giao diện của ỨNG VIÊN trên một theme Studio đã publish.
 * Chỉ chứa phần khác mặc định (guardrail: không clone full theme); null = dùng
 * nguyên theme gốc. Lưu ở cột `CauHinhJson` của CV / CVPhienBan.
 */
export interface CvThemeCustomization {
  /** Slug theme Studio làm nền. */
  themeId: string;
  structure?: LayoutStructure;
  sidebarWidthPct?: number;
  mainWidthPct?: number;
  borderRadiusPx?: number;
  zoneStyle?: ZoneStyle;
  decoration?: DecorationStyle;
  timelineStyle?: TimelineStyle;
  accentGradient?: string;
  skillDisplayMode?: SkillDisplayMode;
  colors?: Partial<CvColorPalette>;
  typography?: Partial<CvTypographyConfig>;
  spacing?: Partial<CvSpacingConfig>;
  zones?: Partial<CvZoneBackgrounds>;
  avatarConfig?: Partial<CvAvatarConfig>;
  layout?: ResumeLayoutConfig;
}

export type { CvSectionId, ResumeLayoutConfig };
