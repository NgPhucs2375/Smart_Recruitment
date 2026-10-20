/**
 * Thư viện màu & gradient kiểu Canva dùng chung cho Admin Studio lẫn User
 * Studio: 12+ gradient, 16+ bộ phối màu theo nhóm chủ đề, nút "đảo màu"
 * (shuffle) và auto-fix tương phản chữ để không bao giờ có chữ tối trên nền tối.
 */
import { contrastAgainstBackground, isDarkBackground } from "../theme-contrast";
import type { CvThemeConfig } from "../types/theme-studio";

export interface CanvaGradient {
  id: string;
  name: string;
  css: string;
}

/** 16 preset gradient chuẩn Canva (2 stop + góc 135°). */
export const CANVA_GRADIENTS: CanvaGradient[] = [
  { id: "sunset-peach", name: "Sunset Peach", css: "linear-gradient(135deg,#ff7e5f,#feb47b)" },
  { id: "ocean-breeze", name: "Ocean Breeze", css: "linear-gradient(135deg,#2193b0,#6dd5ed)" },
  { id: "royal-violet", name: "Royal Violet", css: "linear-gradient(135deg,#7f00ff,#e100ff)" },
  { id: "mint-fresh", name: "Mint Fresh", css: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { id: "glassmorphism", name: "Glassmorphism", css: "linear-gradient(135deg,#8fd3f4,#84fab0)" },
  { id: "soft-pastel", name: "Soft Pastel", css: "linear-gradient(135deg,#a1c4fd,#c2e9fb)" },
  { id: "cyber-neon", name: "Cyber Neon", css: "linear-gradient(135deg,#00f260,#0575e6)" },
  { id: "warm-editorial", name: "Warm Editorial", css: "linear-gradient(135deg,#f2994a,#f2c94c)" },
  { id: "midnight-navy", name: "Midnight Navy", css: "linear-gradient(135deg,#1e3a8a,#3b82f6)" },
  { id: "coral-reef", name: "Coral Reef", css: "linear-gradient(135deg,#f43b47,#453a94)" },
  { id: "emerald-gold", name: "Emerald Gold", css: "linear-gradient(135deg,#0f766e,#eab308)" },
  { id: "graphite", name: "Graphite", css: "linear-gradient(135deg,#232526,#414345)" },
  { id: "rose-quartz", name: "Rose Quartz", css: "linear-gradient(135deg,#ee9ca7,#ffdde1)" },
  { id: "deep-space", name: "Deep Space", css: "linear-gradient(135deg,#0f0c29,#302b63)" },
  { id: "fresh-lime", name: "Fresh Lime", css: "linear-gradient(135deg,#a8e063,#56ab2f)" },
  { id: "blue-steel", name: "Blue Steel", css: "linear-gradient(135deg,#283048,#859398)" },
];

export type PaletteGroup = "corporate" | "creative" | "pastel" | "minimal" | "vibrant";

export const PALETTE_GROUP_LABELS: { id: PaletteGroup; label: string }[] = [
  { id: "corporate", label: "Chuyên nghiệp" },
  { id: "creative", label: "Sáng tạo" },
  { id: "pastel", label: "Pastel nhẹ" },
  { id: "minimal", label: "Tối giản" },
  { id: "vibrant", label: "Nổi bật" },
];

export interface CanvaPalette {
  id: string;
  name: string;
  group: PaletteGroup;
  primary: string;
  secondary: string;
  paperBackground: string;
  /** Nền header/banner (solid hoặc gradient). Trống = giữ nguyên. */
  headerBg?: string;
  /** Nền sidebar (solid hoặc gradient). Trống = giữ nguyên. */
  sidebarBg?: string;
  /** Gradient điểm nhấn (heading/divider/thanh đỉnh). Trống = bỏ. */
  accentGradient?: string;
  textPrimary?: string;
  textMuted?: string;
}

/** 20 bộ phối màu chia 5 nhóm chủ đề. */
export const CANVA_PALETTES: CanvaPalette[] = [
  // Chuyên nghiệp
  { id: "corporate-slate", name: "Corporate Slate", group: "corporate", primary: "#1e293b", secondary: "#475569", paperBackground: "#ffffff", sidebarBg: "#f1f5f9" },
  { id: "royal-navy", name: "Royal Navy", group: "corporate", primary: "#1e3a8a", secondary: "#3b82f6", paperBackground: "#ffffff", sidebarBg: "#eff6ff" },
  { id: "forest-executive", name: "Forest Executive", group: "corporate", primary: "#14532d", secondary: "#22c55e", paperBackground: "#ffffff", sidebarBg: "#f0fdf4" },
  { id: "burgundy-boardroom", name: "Burgundy Boardroom", group: "corporate", primary: "#881337", secondary: "#be123c", paperBackground: "#ffffff", sidebarBg: "#fff1f2" },
  // Sáng tạo
  { id: "canva-purple", name: "Canva Purple", group: "creative", primary: "#7c3aed", secondary: "#f59e0b", paperBackground: "#ffffff", sidebarBg: "#f5f3ff", accentGradient: "linear-gradient(135deg,#7c3aed,#f59e0b)" },
  { id: "ocean-studio", name: "Ocean Studio", group: "creative", primary: "#0891b2", secondary: "#22d3ee", paperBackground: "#ffffff", sidebarBg: "#ecfeff", accentGradient: "linear-gradient(135deg,#0891b2,#22d3ee)" },
  { id: "sunset-creative", name: "Sunset Creative", group: "creative", primary: "#ea580c", secondary: "#fb923c", paperBackground: "#fffbeb", sidebarBg: "#fff7ed", accentGradient: "linear-gradient(135deg,#ff7e5f,#feb47b)" },
  { id: "coral-pop", name: "Coral Pop", group: "creative", primary: "#e11d48", secondary: "#fb7185", paperBackground: "#fff1f2", sidebarBg: "#ffe4e6", accentGradient: "linear-gradient(135deg,#f43b47,#453a94)" },
  // Pastel
  { id: "pastel-sky", name: "Pastel Sky", group: "pastel", primary: "#3b82f6", secondary: "#93c5fd", paperBackground: "#f8fafc", sidebarBg: "#eff6ff" },
  { id: "mint-pastel", name: "Mint Pastel", group: "pastel", primary: "#10b981", secondary: "#6ee7b7", paperBackground: "#f0fdf4", sidebarBg: "#ecfdf5" },
  { id: "blush-pastel", name: "Blush Pastel", group: "pastel", primary: "#f472b6", secondary: "#f9a8d4", paperBackground: "#fdf2f8", sidebarBg: "#fce7f3" },
  { id: "lavender-pastel", name: "Lavender Pastel", group: "pastel", primary: "#8b5cf6", secondary: "#c4b5fd", paperBackground: "#f5f3ff", sidebarBg: "#ede9fe" },
  // Tối giản
  { id: "monochrome", name: "Monochrome", group: "minimal", primary: "#111827", secondary: "#4b5563", paperBackground: "#ffffff", sidebarBg: "#f3f4f6" },
  { id: "warm-gray", name: "Warm Gray", group: "minimal", primary: "#57534e", secondary: "#a8a29e", paperBackground: "#fafaf9", sidebarBg: "#f5f5f4" },
  { id: "cool-slate", name: "Cool Slate", group: "minimal", primary: "#334155", secondary: "#64748b", paperBackground: "#f8fafc", sidebarBg: "#f1f5f9" },
  { id: "charcoal", name: "Charcoal", group: "minimal", primary: "#18181b", secondary: "#3f3f46", paperBackground: "#ffffff", sidebarBg: "#f4f4f5" },
  // Nổi bật
  { id: "vibrant-cyber", name: "Cyber Neon", group: "vibrant", primary: "#0575e6", secondary: "#00f260", paperBackground: "#ffffff", headerBg: "linear-gradient(135deg,#00f260,#0575e6)", sidebarBg: "#0f172a", accentGradient: "linear-gradient(135deg,#00f260,#0575e6)" },
  { id: "vibrant-sunset", name: "Vibrant Sunset", group: "vibrant", primary: "#ff7e5f", secondary: "#feb47b", paperBackground: "#ffffff", headerBg: "linear-gradient(135deg,#ff7e5f,#feb47b)", sidebarBg: "#fff7ed", accentGradient: "linear-gradient(135deg,#ff7e5f,#feb47b)" },
  { id: "vibrant-royal", name: "Royal Violet Pop", group: "vibrant", primary: "#7f00ff", secondary: "#e100ff", paperBackground: "#ffffff", headerBg: "linear-gradient(135deg,#7f00ff,#e100ff)", sidebarBg: "#faf5ff", accentGradient: "linear-gradient(135deg,#7f00ff,#e100ff)" },
  { id: "vibrant-emerald", name: "Emerald Gold Pop", group: "vibrant", primary: "#0f766e", secondary: "#eab308", paperBackground: "#ffffff", headerBg: "linear-gradient(135deg,#0f766e,#eab308)", sidebarBg: "#f0fdfa", accentGradient: "linear-gradient(135deg,#0f766e,#eab308)" },
];

/** Ghép 1 palette lên theme: đổi màu chủ đạo, nền vùng, gradient nhấn + auto-fix chữ. */
export function applyPalette(
  theme: CvThemeConfig,
  palette: CanvaPalette,
): CvThemeConfig {
  const next: CvThemeConfig = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: palette.primary,
      secondary: palette.secondary,
      paperBackground: palette.paperBackground,
      ...(palette.textPrimary ? { textPrimary: palette.textPrimary } : {}),
      ...(palette.textMuted ? { textMuted: palette.textMuted } : {}),
    },
    zones: {
      ...theme.zones,
      ...(palette.headerBg !== undefined ? { headerBg: palette.headerBg } : {}),
      ...(palette.sidebarBg !== undefined ? { sidebarBg: palette.sidebarBg } : {}),
    },
    accentGradient: palette.accentGradient ?? theme.accentGradient ?? "",
  };
  return autoFixTextContrast(next);
}

/** Chọn palette ngẫu nhiên cho nút "đảo màu". */
export function randomPalette(): CanvaPalette {
  return CANVA_PALETTES[Math.floor(Math.random() * CANVA_PALETTES.length)];
}

/**
 * Đảo màu thông minh: chọn palette ngẫu nhiên + xoay màu lên header/sidebar/accent
 * rồi tự tính lại màu chữ theo tương phản (auto-fix) để luôn đọc được.
 */
export function shufflePalette(theme: CvThemeConfig): CvThemeConfig {
  const palette = randomPalette();
  const roll = Math.random();
  const gradient = palette.accentGradient ?? CANVA_GRADIENTS[Math.floor(Math.random() * CANVA_GRADIENTS.length)].css;
  let headerBg = palette.headerBg;
  if (roll < 0.34) headerBg = gradient;
  else if (roll < 0.67) headerBg = palette.primary;
  // else giữ theo palette.
  const sidebarRoll = Math.random();
  const sidebarBg =
    sidebarRoll < 0.25 ? palette.primary : palette.sidebarBg ?? theme.zones.sidebarBg;
  const next = applyPalette(theme, { ...palette, headerBg, sidebarBg, accentGradient: gradient });
  return autoFixTextContrast(next);
}

/** Tự chỉnh màu chữ để đạt tương phản tối thiểu trên nền giấy hiện tại. */
export function autoFixTextContrast(theme: CvThemeConfig): CvThemeConfig {
  const paper = theme.colors.paperBackground;
  const dark = isDarkBackground(paper);
  const ensure = (
    current: string,
    min: number,
    fallbackLight: string,
    fallbackDark: string,
  ): string =>
    contrastAgainstBackground(current, paper) >= min
      ? current
      : dark
        ? fallbackLight
        : fallbackDark;
  return {
    ...theme,
    colors: {
      ...theme.colors,
      textPrimary: ensure(theme.colors.textPrimary, 4.5, "#f8fafc", "#0f172a"),
      textMuted: ensure(theme.colors.textMuted, 3, "#cbd5e1", "#64748b"),
      secondary: ensure(theme.colors.secondary, 3, "#cbd5e1", "#475569"),
    },
  };
}
