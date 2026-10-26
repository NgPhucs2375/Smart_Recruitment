import { router } from 'expo-router';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import {
  AuthMessage,
  AuthPasswordField,
} from '@/features/auth/components/auth-ui';
import { validatePassword, validatePasswordConfirmation } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validationError =
      (!currentPassword ? 'Nhập mật khẩu hiện tại.' : null) ??
      validatePassword(newPassword) ??
      validatePasswordConfirmation(newPassword, confirmPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const message = await changePassword(currentPassword, newPassword);
      Alert.alert('Đổi mật khẩu thành công', message, [
        { text: 'Đăng nhập lại', onPress: () => router.replace('/login') },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          disabled={submitting}
          hitSlop={8}
          onPress={() => safeBack('/profile')}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Đổi mật khẩu</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
            <KeyRound size={28} color={theme.primary} />
          </View>

          <View style={styles.headingBlock}>
            <ThemedText style={styles.title}>Cập nhật mật khẩu</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Dùng mật khẩu mạnh, không trùng với mật khẩu đang dùng ở nơi khác.
            </ThemedText>
          </View>

          <AuthPasswordField
            autoComplete="current-password"
            icon={<Lock size={16} color="#9ca3af" />}
            label="Mật khẩu hiện tại"
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            textContentType="password"
            value={currentPassword}
          />
          <AuthPasswordField
            autoComplete="new-password"
            icon={<Lock size={16} color="#9ca3af" />}
            label="Mật khẩu mới"
            onChangeText={setNewPassword}
            placeholder="Tối thiểu 6 ký tự"
            textContentType="newPassword"
            value={newPassword}
          />
          <AuthPasswordField
            autoComplete="new-password"
            icon={<Lock size={16} color="#9ca3af" />}
            label="Nhập lại mật khẩu mới"
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleSubmit}
            placeholder="Nhập lại mật khẩu mới"
            returnKeyType="done"
            textContentType="newPassword"
            value={confirmPassword}
          />

          {error ? <AuthMessage message={error} variant="error" /> : null}

          <View style={[styles.notice, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <ShieldCheck size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
              Sau khi đổi mật khẩu, tất cả phiên đăng nhập trên các thiết bị sẽ bị đăng xuất.
            </ThemedText>
          </View>

          <Button
            disabled={submitting}
            icon={
              submitting ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : undefined
            }
            onPress={handleSubmit}
            size="lg"
            style={styles.action}>
            {submitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font('semibold'), fontSize: 16 },
  headerSpacer: { width: 36 },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36, gap: 4 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headingBlock: { alignItems: 'center', gap: 6, marginBottom: 14 },
  title: { fontFamily: font('semibold'), fontSize: 22, letterSpacing: -0.3 },
  subtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  noticeText: { flex: 1, fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
  action: { width: '100%', marginTop: 16, borderRadius: Radius.xl },
});
