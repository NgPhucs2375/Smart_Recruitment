import { router } from 'expo-router';
import { ChevronRight, Lock, LogOut, Mail, Monitor, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    void (async () => {
      setSigningOut(true);
      await signOut();
    })();
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headingBlock}>
          <ThemedText style={styles.title}>Cài đặt</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Quản lý tài khoản ứng viên của bạn.
          </ThemedText>
        </View>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          THÔNG TIN TÀI KHOẢN
        </ThemedText>
        <Card style={styles.groupCard}>
          <View style={[styles.row, { borderTopWidth: 0 }]}>
            <UserRound size={16} color={theme.textSecondary} />
            <View style={styles.rowCopy}>
              <ThemedText style={styles.rowTitle}>
                {user?.fullname || user?.userName || 'Người dùng'}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.row, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Mail size={16} color={theme.textSecondary} />
            <View style={styles.rowCopy}>
              <ThemedText style={[styles.rowCaption, { color: theme.textSecondary }]}>
                Email (chỉ đọc)
              </ThemedText>
              <ThemedText numberOfLines={1} style={styles.rowTitle}>
                {user?.email || 'Chưa có email'}
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          BẢO MẬT
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/change-password')}
          style={({ pressed }) => [
            styles.navRow,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <View style={[styles.navIcon, { backgroundColor: `${theme.primary}1A` }]}>
            <Lock size={18} color={theme.primary} />
          </View>
          <View style={styles.rowCopy}>
            <ThemedText style={styles.rowTitle}>Đổi mật khẩu</ThemedText>
            <ThemedText style={[styles.rowCaption, { color: theme.textSecondary }]}>
              Sau khi đổi, mọi phiên đăng nhập khác sẽ bị đăng xuất.
            </ThemedText>
          </View>
          <ChevronRight size={16} color={theme.textSecondary} />
        </Pressable>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          GIAO DIỆN
        </ThemedText>
        <Card style={styles.groupCard}>
          <View style={[styles.row, { borderTopWidth: 0 }]}>
            <Monitor size={16} color={theme.textSecondary} />
            <View style={styles.rowCopy}>
              <ThemedText style={styles.rowTitle}>Chế độ hiển thị</ThemedText>
              <ThemedText style={[styles.rowCaption, { color: theme.textSecondary }]}>
                Sáng / Tối theo hệ thống
              </ThemedText>
            </View>
          </View>
        </Card>

        <Button
          disabled={signingOut}
          icon={<LogOut size={14} color={theme.destructive} />}
          onPress={handleSignOut}
          style={styles.logoutButton}
          variant="destructive">
          {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  headingBlock: { gap: 4, marginBottom: 4 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.4 },
  groupCard: { padding: 16, gap: 12, borderRadius: Radius.xl },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: font('medium'), fontSize: 14, lineHeight: 20 },
  rowCaption: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: { marginTop: 16, borderRadius: Radius.xl },
});
