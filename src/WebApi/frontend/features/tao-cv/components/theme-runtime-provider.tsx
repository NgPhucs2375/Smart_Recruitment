"use client";

import type { CSSProperties, ReactNode } from "react";
import type { CvThemeConfig } from "../types/theme-studio";

interface ThemeRuntimeProviderProps {
  theme: CvThemeConfig;
  children: ReactNode;
  className?: string;
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
  const style = {
    "--cv-primary": theme.colors.primary,
    "--cv-secondary": theme.colors.secondary,
    "--cv-text": theme.colors.textPrimary,
    "--cv-muted": theme.colors.textMuted,
    "--cv-paper-bg": theme.colors.paperBackground,
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
    backgroundColor: "var(--cv-paper-bg)",
    color: "var(--cv-text)",
    padding: "var(--cv-page-padding)",
  } as CSSProperties;

  return (
    <div
      className={`cv-theme-canvas w-[210mm] min-h-[297mm] max-w-full transition-all ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
