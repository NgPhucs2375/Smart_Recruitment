import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';

/**
 * AppHeader 1:1 với CandidateHeader của Web (phiên bản mobile):
 * SafeAreaView trên, row h-16, nền topbar + border-b. Logo HIREAI bên trái,
 * chuông thông báo bên phải (chỉ hiển thị với vai trò Ứng viên/Nhân sự).
 */
export function AppHeader() {
  const theme = useTheme();
  const { isCompact } = useResponsive();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.bar,
          isCompact && styles.compactBar,
          { borderBottomColor: theme.border, backgroundColor: theme.background },
        ]}
      >
        <BrandLogo size="md" />
        <NotificationBell />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { width: '100%' },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactBar: { paddingHorizontal: 16 },
});
