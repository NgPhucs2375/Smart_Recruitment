import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { ids } = useBookmarks();
  const { user, signOut } = useAuth();

  const displayName = user?.fullname || user?.userName || user?.email || 'Người dùng';
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const roles = user?.roles?.join(', ') ?? '';

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Hồ sơ của bạn</ThemedText>

        <ThemedView style={[styles.accountCard, { borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>{initial}</ThemedText>
          </View>
          <View style={styles.accountCopy}>
            <ThemedText style={styles.accountTitle}>{displayName}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {user?.email ?? ''}
            </ThemedText>
            {roles ? (
              <ThemedText style={[styles.roles, { color: theme.textSecondary }]}>{roles}</ThemedText>
            ) : null}
          </View>
        </ThemedView>

        <ThemedView style={[styles.summaryCard, { borderColor: theme.border }]}>
          <ThemedText style={styles.summaryValue}>{ids.length}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary, marginTop: 2 }]}>
            Việc làm đã lưu trên thiết bị này
          </ThemedText>
        </ThemedView>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <ThemedText style={[styles.logoutText, { color: theme.text }]}>Đăng xuất</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 26, gap: 16 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 21, fontWeight: '800' },
  accountCopy: { flex: 1, gap: 3 },
  accountTitle: { fontSize: 15, fontWeight: '700' },
  roles: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryCard: { padding: 18, borderRadius: 20, borderWidth: 1 },
  summaryValue: { fontSize: 26, fontWeight: '800' },
  logoutButton: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
