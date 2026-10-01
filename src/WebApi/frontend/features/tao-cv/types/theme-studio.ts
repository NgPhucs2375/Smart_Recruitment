import type { CvSectionId, ResumeLayoutConfig } from "../resume-data";

export type FontFamilyToken = "font-sans" | "font-serif" | "font-mono";
export type HeadingVariant = "underline" | "left-border" | "pill" | "minimal" | "accent-bg";
export type SpacingDensity = "compact" | "normal" | "relaxed";

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

  // 4 trụ cột theme
  layout: ResumeLayoutConfig;
  colors: CvColorPalette;
  typography: CvTypographyConfig;
  spacing: CvSpacingConfig;
  policy: CvPublishPolicy;
}

export type { CvSectionId, ResumeLayoutConfig };
