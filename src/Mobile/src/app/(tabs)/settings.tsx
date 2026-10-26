import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Monitor,
  UserRound,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { authApi } from '@/features/auth/api/auth-api';
import { useTheme } from '@/hooks/use-theme';

type Notice = { type: 'success' | 'error'; message: string } | null;

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword) {
      setNotice({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (newPassword.length < 6) {
      setNotice({ type: 'error', message: 'Mật khẩu mới phải tối thiểu 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Mật khẩu mới không khớp.' });
      return;
    }

    void (async () => {
      setSubmitting(true);
      setNotice(null);
      try {
        const message = await authApi.changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setNotice({ type: 'success', message: message || 'Đổi mật khẩu thành công.' });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : 'Không thể đổi mật khẩu.',
        });
      } finally {
        setSubmitting(false);
      }
    })();
  };

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
        <Card style={styles.groupCard}>
          <View style={styles.passwordHeader}>
            <ThemedText style={styles.rowTitle}>Đổi mật khẩu</ThemedText>
            <ThemedText style={[styles.rowCaption, { color: theme.textSecondary }]}>
              Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.
            </ThemedText>
          </View>

          {notice ? (
            <View
              style={[
                styles.notice,
                notice.type === 'error'
                  ? { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` }
                  : { borderColor: `${theme.primary}4D`, backgroundColor: `${theme.primary}0D` },
              ]}>
              <ThemedText
                style={[
                  styles.noticeText,
                  { color: notice.type === 'error' ? theme.destructive : theme.primary },
                ]}>
                {notice.message}
              </ThemedText>
            </View>
          ) : null}

          <PasswordInput
            editable={!submitting}
            onChangeText={setCurrentPassword}
            placeholder="Mật khẩu hiện tại"
            secureTextEntry={!showPasswords}
            value={currentPassword}
          />
          <PasswordInput
            editable={!submitting}
            onChangeText={setNewPassword}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            secureTextEntry={!showPasswords}
            value={newPassword}
          />
          <PasswordInput
            editable={!submitting}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleChangePassword}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry={!showPasswords}
            value={confirmPassword}
          />

          <View style={styles.passwordActions}>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              hitSlop={8}
              onPress={() => setShowPasswords((value) => !value)}
              style={styles.showToggle}>
              {showPasswords ? (
                <EyeOff size={14} color={theme.textSecondary} />
              ) : (
                <Eye size={14} color={theme.textSecondary} />
              )}
              <ThemedText style={[styles.showToggleText, { color: theme.textSecondary }]}>
                {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </ThemedText>
            </Pressable>
            <Button
              disabled={submitting}
              icon={
                submitting ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <Lock size={14} color={theme.primaryForeground} />
                )
              }
              onPress={handleChangePassword}
              size="sm"
              style={styles.submitButton}>
              {submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </View>
        </Card>

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

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry: boolean;
  editable: boolean;
  onSubmitEditing?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.inputWrap,
        { backgroundColor: theme.backgroundElement, borderColor: theme.input },
      ]}>
      <Lock size={16} color="#9ca3af" style={styles.inputIcon} />
      <TextInput
        autoCapitalize="none"
        editable={editable}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        selectionColor={theme.primary}
        style={[styles.input, { color: theme.text }]}
        value={value}
      />
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
  passwordHeader: { gap: 2 },
  notice: { borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 10 },
  noticeText: { fontFamily: font('medium'), fontSize: 12, lineHeight: 18 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  showToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  showToggleText: { fontFamily: font('medium'), fontSize: 12 },
  submitButton: { borderRadius: Radius.lg },
  logoutButton: { marginTop: 16, borderRadius: Radius.xl },
});
