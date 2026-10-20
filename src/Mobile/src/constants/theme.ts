/**
 * Design tokens map 1:1 từ Web HIREAI (src/WebApi/frontend/app/globals.css).
 * Light = .tone-candidate, Dark = .dark .tone-candidate.
 * Giữ nguyên key cũ (text/background/backgroundElement/backgroundSelected/
 * textSecondary/primary/border) để useTheme() hoạt động xuyên suốt app.
 */

import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

// Nền kem ấm + card ivory (light) — đúng --background / --card của Web.
export const Colors = {
  light: {
    text: '#2f3440', // --foreground
    background: '#f7f3ec', // --background (kem ấm)
    backgroundElement: '#fffdf9', // --card (ivory)
    backgroundSelected: '#eaf1f8', // --secondary / --accent (brand-soft)
    textSecondary: '#6d7480', // --muted-foreground
    primary: '#355c8c', // --primary (navy)
    border: '#ddd4c7', // --border (linen)
    muted: '#f0eee8', // --muted
    destructive: '#b3362b', // --destructive
    input: '#d8d3c8', // --input
    primaryForeground: '#ffffff', // --primary-foreground
    primaryHover: '#2d4f79', // --primary-hover
  },
  dark: {
    text: '#ede6d8', // --foreground
    background: '#242321', // --background
    backgroundElement: '#2d2b28', // --card
    backgroundSelected: '#33364a', // --secondary (tone-candidate dark)
    textSecondary: '#a49d90', // --muted-foreground
    primary: '#8ea6cf', // --primary (tone-candidate dark)
    border: '#3e3a34', // --border
    muted: '#34312d', // --muted
    destructive: '#e07a6a', // --destructive
    input: '#3e3a34', // --input
    primaryForeground: '#23262e', // --primary-foreground
    primaryHover: '#c2b8a6', // --primary-hover
  },
} as const;

// Accent品牌 palette — hằng số, không đổi giữa light/dark (Web @theme).
export const Palette = {
  navy: '#355c8c',
  marine: '#35638f',
  mist: '#8fb3cf',
  sage: '#7fae9b', // = --color-teal
  sand: '#d7b98e',
  bronze: '#8a6a3b',
  sandsoft: '#f7eddc',
  softSage: '#eaf4ef',
  softGold: '#f6ebdd',
  cream: '#f1eadf',
  ivory: '#faf8f3',
  parchment: '#f7f5f1',
  charcoal: '#2f3440',
  linen: '#ddd4c7',
  white: '#ffffff',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Font Be Vietnam Pro — mỗi weight là 1 family name riêng trên Android.
const ANDROID_FONTS = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extraBold: 'BeVietnamPro_800ExtraBold',
} as const;

const IOS_FAMILY = 'Be Vietnam Pro';

export const Fonts = {
  sans: Platform.select({
    ios: IOS_FAMILY,
    android: ANDROID_FONTS.regular,
    web: '"Be Vietnam Pro", system-ui, sans-serif',
    default: ANDROID_FONTS.regular,
  }) as string,
  medium: Platform.select({
    ios: IOS_FAMILY,
    android: ANDROID_FONTS.medium,
    web: '"Be Vietnam Pro", system-ui, sans-serif',
    default: ANDROID_FONTS.medium,
  }) as string,
  semibold: Platform.select({
    ios: IOS_FAMILY,
    android: ANDROID_FONTS.semibold,
    web: '"Be Vietnam Pro", system-ui, sans-serif',
    default: ANDROID_FONTS.semibold,
  }) as string,
  bold: Platform.select({
    ios: IOS_FAMILY,
    android: ANDROID_FONTS.bold,
    web: '"Be Vietnam Pro", system-ui, sans-serif',
    default: ANDROID_FONTS.bold,
  }) as string,
  extraBold: Platform.select({
    ios: IOS_FAMILY,
    android: ANDROID_FONTS.extraBold,
    web: '"Be Vietnam Pro", system-ui, sans-serif',
    default: ANDROID_FONTS.extraBold,
  }) as string,
  serif: Platform.select({ ios: 'ui-serif', default: 'serif' }) as string,
  rounded: Platform.select({ ios: 'ui-rounded', default: 'sans-serif' }) as string,
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }) as string,
};

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extraBold';

const WEIGHT_KEY: Record<FontWeightName, keyof typeof Fonts> = {
  regular: 'sans',
  medium: 'medium',
  semibold: 'semibold',
  bold: 'bold',
  extraBold: 'extraBold',
};

/** Trả về fontFamily đúng theo weight (giữ hoạt động fontWeight trên Android). */
export function font(weight: FontWeightName = 'regular'): string {
  return Fonts[WEIGHT_KEY[weight]];
}

// Radius tokens — --radius: 0.625rem (10px) + các bậc của Web.
export const Radius = {
  sm: 6, // --radius-sm
  md: 8, // --radius-md
  lg: 10, // --radius-lg
  xl: 12, // --radius-xl
  '2xl': 16, // --radius-2xl (card)
  '3xl': 22, // --radius-3xl
  '4xl': 26, // --radius-4xl
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Shadow tokens — map từ arbitrary shadow của Web (card/filter/dialog).
export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: Palette.navy,
      shadowOpacity: 0.1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 9 },
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  filter: Platform.select({
    ios: {
      shadowColor: Palette.navy,
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  dialog: Platform.select({
    ios: {
      shadowColor: Palette.charcoal,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
