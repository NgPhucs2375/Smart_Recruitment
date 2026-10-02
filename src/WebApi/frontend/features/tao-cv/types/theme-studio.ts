import type { CvSectionId, ResumeLayoutConfig } from "../resume-data";

export type FontFamilyToken = "font-sans" | "font-serif" | "font-mono";
export type HeadingVariant = "underline" | "left-border" | "pill" | "minimal" | "accent-bg";
export type SpacingDensity = "compact" | "normal" | "relaxed";
export type LayoutStructure = "single" | "sidebar-left" | "sidebar-right" | "banner-top";
export type DividerStyle = "solid" | "dashed" | "gradient" | "accent-dot" | "none";
export type SectionEnclosure = "flat" | "boxed" | "left-pill";

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

export interface CvPublishPolicy {
  /** Switch duyệt phát hành. */
  policyApproved: boolean;
  /** Admin ID / Username. */
  approvedBy?: string;
  /** ISO Date string. */
  approvedAt?: string;
  /** Ghi chú phiên bản của Admin. */
  notes?: string;
}

export interface CvThemeConfig {
  /** Slug duy nhất (vd 'tech-emerald-2026'). */
  id: string;
  /** Tên hiển thị (vd 'Emerald Engineer Modern'). */
  name: string;
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
  colors: CvColorPalette;
  typography: CvTypographyConfig;
  spacing: CvSpacingConfig;
  zones: CvZoneBackgrounds;
  policy: CvPublishPolicy;
}

export type { CvSectionId, ResumeLayoutConfig };
