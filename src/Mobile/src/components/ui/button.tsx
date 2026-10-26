import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type ButtonProps = {
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Bo tròn pill (Web hay override rounded-full). */
  pill?: boolean;
  disabled?: boolean;
  /** Icon react element đặt trước label. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Button 1:1 với components/ui/button.tsx của Web:
 * base rounded-lg text-sm font-medium, active scale 0.98, disabled opacity 50%.
 */
export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  pill = false,
  disabled = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    default: { minHeight: 40, paddingHorizontal: 14, gap: 6 },
    sm: { minHeight: 32, paddingHorizontal: 10, gap: 4 },
    lg: { minHeight: 48, paddingHorizontal: 18, gap: 6 },
    icon: { minHeight: 36, minWidth: 36, paddingHorizontal: 0, gap: 0 },
  };

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: string }> = {
    default: {
      container: { backgroundColor: theme.primary },
      text: theme.primaryForeground,
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.border,
      },
      text: theme.text,
    },
    secondary: {
      container: { backgroundColor: theme.backgroundSelected },
      text: theme.primaryHover,
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: theme.textSecondary,
    },
    destructive: {
      container: { backgroundColor: `${theme.destructive}1A` },
      text: theme.destructive,
    },
  };

  const v = variantStyles[variant];
  const radius = pill ? Radius.pill : Radius.md;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 14;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        v.container,
        { borderRadius: radius, opacity: disabled ? 0.5 : pressed ? 0.98 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon}
        {children ? (
          <Text
            style={[styles.text, { color: v.text, fontSize }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            flexShrink={1}
          >
            {children}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontFamily: font('medium'),
  },
});
