import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { font, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';

type BadgeProps = {
  children: string;
  variant?: BadgeVariant;
  /** Ghi đè màu nền (dùng cho level pill JobCard theo Web). */
  backgroundColor?: string;
  /** Ghi đè màu chữ. */
  color?: string;
  style?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Badge 1:1 với components/ui/badge.tsx của Web:
 * h-5 rounded-md px-2 text-xs font-medium.
 */
export function Badge({
  children,
  variant = 'default',
  backgroundColor,
  color,
  style,
  textStyle,
}: BadgeProps) {
  const theme = useTheme();

  const base: TextStyle = styles.badge;
  let bg = 'transparent';
  let fg: string = theme.text;
  let borderW = 0;
  let borderColor = 'transparent';

  switch (variant) {
    case 'default':
      bg = backgroundColor ?? theme.primary;
      fg = color ?? theme.primaryForeground;
      break;
    case 'secondary':
      bg = backgroundColor ?? theme.backgroundSelected;
      fg = color ?? theme.primaryHover;
      break;
    case 'destructive':
      bg = backgroundColor ?? `${theme.destructive}1A`; // /10
      fg = color ?? theme.destructive;
      break;
    case 'outline':
      bg = backgroundColor ?? 'transparent';
      fg = color ?? theme.textSecondary;
      borderW = 1;
      borderColor = theme.border;
      break;
    case 'ghost':
      bg = backgroundColor ?? 'transparent';
      fg = color ?? theme.textSecondary;
      break;
  }

  return (
    <Text
      style={[
        base,
        {
          backgroundColor: bg,
          color: fg,
          borderWidth: borderW,
          borderColor,
        },
        textStyle,
        style,
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

/** Badge tròn (pill) — dùng cho badge "Mặc định", meta pills. */
export function PillBadge({
  children,
  backgroundColor,
  color,
  style,
  textStyle,
}: Omit<BadgeProps, 'variant'>) {
  return (
    <Text
      style={[
        styles.pill,
        {
          backgroundColor: backgroundColor ?? Palette.navy,
          color: color ?? Palette.white,
        },
        textStyle,
        style,
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  pill: {
    fontFamily: font('bold'),
    fontSize: 10,
    lineHeight: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
});
