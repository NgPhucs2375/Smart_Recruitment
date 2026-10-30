import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { font, Radius } from '@/constants/theme';
import { getApplicationStatus } from '@/features/applications/constants';
import { getJobStatus } from '@/features/hr/constants';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

/* ------------------------------------------------------------------ */
/* Top bar cho route ngoài tab (/hr/*) — theo pattern companies/[id]   */
/* ------------------------------------------------------------------ */

export function HrTopBar({
  title,
  right,
}: {
  title: string;
  /** Ví dụ: nút Lưu/refresh đặt bên phải top bar. */
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={() => safeBack('/dashboard')}
        hitSlop={8}
        style={({ pressed }) => [styles.topBarSide, { opacity: pressed ? 0.6 : 1 }]}
      >
        <ArrowLeft size={20} color={theme.text} />
      </Pressable>
      <ThemedText style={styles.topBarTitle} numberOfLines={1} type="smallBold">
        {title}
      </ThemedText>
      <View style={styles.topBarSide}>{right}</View>
    </View>
  );
}

/** SafeAreaView dùng cho màn ngoài tab: bọc HrTopBar + nội dung. */
export function HrScreenShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: theme.background }]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Badge trạng thái tin / đơn                                          */
/* ------------------------------------------------------------------ */

export function JobStatusBadge({ value }: { value: unknown }) {
  const status = getJobStatus(value);
  return (
    <Badge variant={status.variant as BadgeVariant} style={styles.badge}>
      {status.label}
    </Badge>
  );
}

export function AppStatusBadge({ value }: { value: unknown }) {
  const status = getApplicationStatus(value);
  return (
    <Badge variant={status.tone} style={styles.badge}>
      {status.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Chip bộ lọc                                                         */
/* ------------------------------------------------------------------ */

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.backgroundElement,
          borderColor: active ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemedText
        style={[styles.chipText, { color: active ? theme.primaryForeground : theme.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Trạng thái màn hình                                                 */
/* ------------------------------------------------------------------ */

export function HrLoadingState({ label = 'Đang tải…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} />
      <ThemedText style={[styles.centerLabel, { color: theme.textSecondary }]} type="small">
        {label}
      </ThemedText>
    </View>
  );
}

export function HrErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText style={styles.centerTitle} type="smallBold">
        Không tải được dữ liệu
      </ThemedText>
      <ThemedText style={[styles.centerLabel, { color: theme.textSecondary }]} type="small">
        {message}
      </ThemedText>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={[styles.stateButton, { backgroundColor: theme.backgroundSelected }]}
        >
          <ThemedText style={[styles.stateButtonText, { color: theme.primary }]}>Thử lại</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function HrEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText style={styles.centerTitle} type="smallBold">
        {title}
      </ThemedText>
      {description ? (
        <ThemedText style={[styles.centerLabel, { color: theme.textSecondary }]} type="small">
          {description}
        </ThemedText>
      ) : null}
      {action}
    </View>
  );
}

/** Banner thông báo thành công/lỗi — mirror toast inline của Web. */
export function NoticeBar({ kind, message }: { kind: 'success' | 'error'; message: string }) {
  const theme = useTheme();
  const success = kind === 'success';
  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: success ? '#eaf4ef' : `${theme.destructive}14`,
          borderColor: success ? `${theme.primary}33` : `${theme.destructive}44`,
        },
      ]}
    >
      <ThemedText style={[styles.noticeText, { color: success ? theme.primary : theme.destructive }]} type="small">
        {message}
      </ThemedText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card (Dashboard)                                                */
/* ------------------------------------------------------------------ */

export function KpiCard({
  icon,
  label,
  value,
  sub,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.kpi,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.kpiHead}>
        <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]} type="small" numberOfLines={2}>
          {label}
        </ThemedText>
        <View style={[styles.kpiIcon, { backgroundColor: `${theme.primary}14` }]}>{icon}</View>
      </View>
      <ThemedText style={styles.kpiValue}>{value}</ThemedText>
      {sub ? (
        <ThemedText style={{ color: theme.textSecondary }} type="code">
          {sub}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { flex: 1, textAlign: 'center' },
  badge: { alignSelf: 'flex-start' },
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: font('medium'), fontSize: 12 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  centerTitle: { fontSize: 15 },
  centerLabel: { textAlign: 'center', fontSize: 13 },
  stateButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
  stateButtonText: { fontFamily: font('semibold'), fontSize: 13 },
  notice: { borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  noticeText: { fontSize: 13 },
  kpi: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  kpiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kpiLabel: { flex: 1 },
  kpiIcon: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiValue: { fontFamily: font('bold'), fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
});
