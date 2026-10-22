import { ScrollView, StyleSheet, View } from 'react-native';
import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

const ROLE_LABELS: Record<string, string> = {
  NGUOI_DAI_DIEN: 'Người đại diện',
  NHAN_SU: 'Nhân sự',
};

export default function HRAccountScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const roleBadges = (user?.roles ?? [])
    .map((role) => ROLE_LABELS[role.toUpperCase()] ?? role)
    .filter(Boolean);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>Tài khoản</ThemedText>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <UserRound size={16} color={theme.textSecondary} />
            <ThemedText style={styles.infoValue} numberOfLines={2}>
              {user?.fullname || user?.userName || 'Nhà tuyển dụng'}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Mail size={16} color={theme.textSecondary} />
            <ThemedText style={styles.infoValue} numberOfLines={2}>{user?.email ?? ''}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ShieldCheck size={16} color={theme.textSecondary} />
            <View style={styles.badgeRow}>
              {roleBadges.length > 0 ? (
                roleBadges.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))
              ) : (
                <ThemedText style={styles.infoValue} numberOfLines={2}>Nhà tuyển dụng</ThemedText>
              )}
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.sectionNote, { color: theme.textSecondary }]}>
          Sắp có: Cá nhân, Công ty, Đổi mật khẩu, Quản lý nhân sự (NDD).
        </ThemedText>

        <Button
          variant="outline"
          onPress={() => void signOut()}
          icon={<LogOut size={16} color={theme.destructive} />}
          style={styles.logoutButton}>
          <ThemedText style={[styles.logoutText, { color: theme.destructive }]}>Đăng xuất</ThemedText>
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  infoCard: { padding: 16, gap: 12, borderRadius: Radius.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { fontFamily: font('medium'), fontSize: 14, flexShrink: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  sectionNote: { fontFamily: font('regular'), fontSize: 13, lineHeight: 20 },
  logoutButton: { marginTop: 8, borderRadius: Radius.xl, alignSelf: 'flex-start' },
  logoutText: { fontFamily: font('semibold'), fontSize: 14 },
});
