import { router, type Href } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/features/auth';
import { canUseInternalChat } from '@/features/chat/roles';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';

/**
 * AppHeader 1:1 với CandidateHeader của Web (phiên bản mobile):
 * SafeAreaView trên, row h-16, nền topbar + border-b. Logo HIREAI bên trái,
 * lối tắt Tin nhắn (kiểu Messenger) + chuông thông báo bên phải.
 * Chat nội bộ chỉ dành cho Nhân sự/Người đại diện — ẩn nút tin nhắn với vai trò khác.
 */
export function AppHeader() {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const { user } = useAuth();
  const canChat = canUseInternalChat(user?.roles);

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
        <View style={styles.actions}>
          {canChat ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tin nhắn"
              onPress={() => router.push('/messages' as Href)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.messageBtn,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <MessageCircle size={19} color={theme.text} />
            </Pressable>
          ) : null}
          <NotificationBell />
        </View>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});