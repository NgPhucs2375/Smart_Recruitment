import { router, type Href } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, Palette } from '@/constants/theme';
import { useNotificationCenter } from '@/features/notifications/notification-provider';
import { useTheme } from '@/hooks/use-theme';

export function NotificationBell() {
  const theme = useTheme();
  const { audience, unreadCount, refreshUnread } = useNotificationCenter();

  if (!audience) return null;

  const label =
    unreadCount > 0
      ? `Thông báo, ${unreadCount} chưa đọc`
      : 'Thông báo';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void refreshUnread();
        router.push('/notifications' as Href);
      }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Bell size={19} color={theme.text} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.destructive }]}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: font('bold'),
    fontSize: 9,
    lineHeight: 12,
    color: Palette.white,
  },
});
