import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { font, Palette, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Salary pill — Web: rounded-full bg-teal/15 px-3 py-1.5 text-[13px] font-bold text-primary.
 */
export function SalaryPill({
  children,
  icon,
  style,
}: {
  children: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.salary,
        { backgroundColor: `${Palette.sage}26` }, // sage @ 15%
        style,
      ]}
    >
      {icon}
      <Text numberOfLines={1} style={[styles.salaryText, { color: theme.primary }]}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Meta pill — Web: rounded-full border border-border bg-muted px-2.5 py-1 text-xs.
 * Dùng cho workMode / địa điểm / cấp bậc.
 */
export function MetaPill({
  children,
  icon,
  textColor,
  style,
}: {
  children: ReactNode;
  icon?: ReactNode;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.meta,
        { backgroundColor: theme.muted, borderColor: theme.border },
        style,
      ]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[styles.metaText, { color: textColor ?? theme.textSecondary }]}
      >
        {typeof children === 'string' ? children : undefined}
      </Text>
      {typeof children !== 'string' ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  salary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  salaryText: {
    fontFamily: font('bold'),
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontFamily: font('medium'),
    fontSize: 12,
  },
});
