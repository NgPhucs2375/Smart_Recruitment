"use client";

import type { CSSProperties, ReactNode } from "react";
import { isValidCssGradient } from "../validation";
import { isDarkBackground } from "../theme-contrast";
import type { CvThemeConfig } from "../types/theme-studio";

interface ThemeRuntimeProviderProps {
  theme: CvThemeConfig;
  children: ReactNode;
  className?: string;
}

/** Pha màu trong suốt an toàn cho cả hex và màu hàm. */
function tint(color: string, amount: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(amount * 100)}%, transparent)`;
}

/**
 * Lớp trang trí vẽ bằng background-image của tờ giấy (KHÔNG phải DOM node)
 * nên sống sót qua khâu clone phân trang — mỗi tờ A4 đều có hoạ tiết mà
 * không đụng tới luồng item hay sức chứa trang.
 */
function decorationLayers(theme: CvThemeConfig): string[] {
  const deco = theme.decoration ?? "none";
  if (deco === "none") return [];
  const { primary, secondary } = theme.colors;
  switch (deco) {
    case "soft-blobs":
      return [
        `radial-gradient(circle at 88% 5%, ${tint(primary, 0.16)}, transparent 40%)`,
        `radial-gradient(circle at 6% 95%, ${tint(secondary, 0.16)}, transparent 42%)`,
      ];
    case "geometric-circles":
      return [
        `radial-gradient(circle at 92% 9%, transparent 0 7.4%, ${tint(primary, 0.2)} 7.4% 7.9%, transparent 7.9%)`,
        `radial-gradient(circle at 5% 91%, transparent 0 5.4%, ${tint(secondary, 0.2)} 5.4% 5.9%, transparent 5.9%)`,
      ];
    case "diagonal-cut":
      return [`linear-gradient(135deg, ${tint(primary, 0.2)} 0 12%, transparent 12%)`];
    case "top-accent-bar":
      return [
        `linear-gradient(180deg, ${primary} 0 8px, ${secondary} 8px 14px, transparent 14px)`,
      ];
    case "subtle-grid":
      return [
        `repeating-linear-gradient(0deg, ${tint(primary, 0.06)} 0 1px, transparent 1px 24px)`,
        `repeating-linear-gradient(90deg, ${tint(primary, 0.06)} 0 1px, transparent 1px 24px)`,
      ];
    default:
      return [];
  }
}

/**
 * Phun design tokens thành CSS variables lên canvas A4.
 * Mọi section bên trong ăn var() nên đổi token là preview đổi theo,
 * không cần viết lại CSS tĩnh. Không ảnh hưởng template cứng.
 */
export function ThemeRuntimeProvider({
  theme,
  children,
  className = "",
}: ThemeRuntimeProviderProps) {
  const zones = theme.zones ?? {
    headerBg: "transparent",
    sidebarBg: "#f1f5f9",
    mainBg: "transparent",
  };
  const paperBg = theme.colors.paperBackground;
  const paperIsGradient = isValidCssGradient(paperBg);
  // Lớp trên cùng trước, giấy gradient ở đáy; nội dung là DOM nên luôn nổi
  // trên toàn bộ background.
  const backgroundLayers = [
    ...decorationLayers(theme),
    ...(paperIsGradient ? [paperBg] : []),
  ];
  const cardBg = isDarkBackground(paperBg)
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.72)";
  const style = {
    "--cv-primary": theme.colors.primary,
    "--cv-secondary": theme.colors.secondary,
    "--cv-accent": theme.accentGradient || theme.colors.primary,
    "--cv-text": theme.colors.textPrimary,
    "--cv-muted": theme.colors.textMuted,
    "--cv-paper-bg": paperBg,
    "--cv-card-bg": cardBg,
    "--cv-font-size": `${theme.typography.baseFontSizePx}px`,
    "--cv-font-family":
      theme.typography.fontFamily === "font-serif"
        ? "var(--font-serif)"
        : theme.typography.fontFamily === "font-mono"
          ? "var(--font-code)"
          : "var(--font-sans)",
    "--cv-section-gap": `${theme.spacing.sectionGapMm}mm`,
    "--cv-item-gap": `${theme.spacing.itemGapMm}mm`,
    "--cv-page-padding": `${theme.spacing.pagePaddingMm}mm`,
    "--cv-sidebar-width": `${theme.sidebarWidthPct ?? 32}%`,
    "--cv-sidebar-bg": zones.sidebarBg,
    "--cv-header-bg": zones.headerBg,
    "--cv-main-bg": zones.mainBg,
    "--cv-divider-style": theme.typography.dividerStyle ?? "solid",
    "--cv-line-height": `${theme.typography.lineHeightScale ?? 1.4}`,
    "--cv-divider-spacing": `${theme.typography.dividerSpacingMm ?? 2}mm`,
    backgroundColor: paperIsGradient ? "#ffffff" : paperBg,
    ...(backgroundLayers.length > 0
      ? {
          backgroundImage: backgroundLayers.join(", "),
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }
      : {}),
    color: "var(--cv-text)",
    fontSize: "var(--cv-font-size)",
    fontFamily: "var(--cv-font-family)",
    lineHeight: "var(--cv-line-height)",
    // Full-bleed: root KHÔNG padding — màu sidebar/banner ăn sát mép giấy.
    // Padding chỉ nằm trong div nội dung từng vùng (xem theme-canvas).
    padding: 0,
    // Mốc định vị cho chữ tag dọc (position: absolute) của theme-canvas.
    position: "relative",
  } as CSSProperties;

  // Root LÀ tờ A4 (.cv-paper cv-paper-a4) — KHÔNG bọc thêm 1 div 210mm nữa,
  // để CvPaginatedPreview đo/clone đúng .cv-paper như template tĩnh (WYSIWYG).
  return (
    <div
      className={`cv-paper cv-paper-a4 cv-theme-canvas transition-all ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
