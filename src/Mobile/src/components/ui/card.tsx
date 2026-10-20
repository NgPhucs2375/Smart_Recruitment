import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { font, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Bật đổ bóng nhẹ (Web dùng shadow khi hover). */
  elevated?: boolean;
};

/**
 * Card 1:1 với components/ui/card.tsx + JobCard của Web:
 * rounded-2xl border-border bg-card.
 */
export function Card({ children, onPress, style, elevated = false }: CardProps) {
  const theme = useTheme();

  const container: ViewStyle = {
    backgroundColor: theme.backgroundElement,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          container,
          elevated && Shadows.card,
          { opacity: pressed ? 0.96 : 1 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[container, elevated && Shadows.card, style]}>{children}</View>;
}

/**
 * Monogram box — logo công ty dạng chữ cái
 * (Web: size-13 rounded-2xl bg-muted font-mono text-primary).
 */
export function Monogram({
  label,
  size = 52,
  radius = Radius['2xl'],
  fontSize,
}: {
  label: string;
  size?: number;
  radius?: number;
  fontSize?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: theme.muted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: font('bold'),
          fontSize: fontSize ?? size * 0.32,
          color: theme.primary,
          letterSpacing: -0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
