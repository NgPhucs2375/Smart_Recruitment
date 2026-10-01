import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { ids } = useBookmarks();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Hồ sơ của bạn</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Đăng nhập để quản lý hồ sơ, CV và các ứng tuyển.
        </ThemedText>

        <ThemedView style={[styles.accountCard, { borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>?</ThemedText>
          </View>
          <View style={styles.accountCopy}>
            <ThemedText style={styles.accountTitle}>Chưa đăng nhập</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Luồng xác thực mobile sẽ được kết nối ở bước tiếp theo.
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={[styles.summaryCard, { borderColor: theme.border }]}>
          <ThemedText style={styles.summaryValue}>{ids.length}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary, marginTop: 2 }]}>
            Việc làm đã lưu trên thiết bị này
          </ThemedText>
        </ThemedView>

        <Pressable accessibilityRole="button" disabled style={[styles.loginButton, { backgroundColor: theme.primary, opacity: 0.55 }]}>
          <ThemedText style={styles.loginButtonText}>Đăng nhập (sắp có)</ThemedText>
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
  summaryCard: { padding: 18, borderRadius: 20, borderWidth: 1 },
  summaryValue: { fontSize: 26, fontWeight: '800' },
  loginButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
