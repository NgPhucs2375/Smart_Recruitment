import { StyleSheet, Text, type TextProps } from 'react-native';

import { font, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'code';
  themeColor?: ThemeColor;
};

// Map fontWeight → family name của Be Vietnam Pro (Android cần family riêng/từng weight).
const WEIGHT_TO_FONT: Record<string, ReturnType<typeof font>> = {
  '100': font('regular'),
  '200': font('regular'),
  '300': font('regular'),
  '400': font('regular'),
  normal: font('regular'),
  '500': font('medium'),
  '600': font('semibold'),
  '700': font('bold'),
  bold: font('bold'),
  '800': font('extraBold'),
  '900': font('extraBold'),
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Gộp toàn bộ style để đọc fontWeight và gán fontFamily đúng weight.
  const flat = StyleSheet.flatten([
    { color: theme[themeColor ?? 'text'] },
    type === 'default' && styles.default,
    type === 'title' && styles.title,
    type === 'small' && styles.small,
    type === 'smallBold' && styles.smallBold,
    type === 'subtitle' && styles.subtitle,
    type === 'link' && styles.link,
    type === 'code' && styles.code,
    style,
  ]) as Record<string, unknown>;

  const resolved = {
    ...flat,
    fontFamily:
      typeof flat.fontFamily === 'string'
        ? flat.fontFamily
        : WEIGHT_TO_FONT[String(flat.fontWeight ?? '400')] ?? font('regular'),
  };

  return <Text style={resolved} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    lineHeight: 30,
    fontWeight: '500',
  },
  code: {
    fontSize: 12,
    fontWeight: '500',
  },
});
