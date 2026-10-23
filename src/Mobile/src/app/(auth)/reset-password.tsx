import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, Link2Off, Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';
import { authApi } from '@/features/auth';
import {
  AuthFooterLink,
  AuthMessage,
  AuthPasswordField,
  AuthScreen,
} from '@/features/auth/components/auth-ui';
import {
  normalizeEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const email = normalizeEmail(params.email ?? '');
  const token = params.token ?? '';
  const hasLink = Boolean(email && token);

  const handleSubmit = async () => {
    const validationError =
      validatePassword(password) ?? validatePasswordConfirmation(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await authApi.resetPassword(email, password, token);
      setDoneMessage(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasLink) {
    return (
      <AuthScreen
        title="Liên kết không hợp lệ"
        subtitle="Liên kết đặt lại mật khẩu thiếu thông tin hoặc đã hết hạn."
        footer={
          <AuthFooterLink
            prompt="Quay lại"
            action="Đăng nhập"
            onPress={() => router.replace('/login')}
          />
        }>
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.destructive}14` }]}>
            <Link2Off size={28} color={theme.destructive} />
          </View>
          <Button
            onPress={() => router.replace('/forgot-password')}
            size="lg"
            style={styles.action}>
            Yêu cầu liên kết mới
          </Button>
        </View>
      </AuthScreen>
    );
  }

  if (doneMessage) {
    return (
      <AuthScreen
        title="Đã đặt lại mật khẩu"
        subtitle="Mật khẩu mới đã được lưu. Đăng nhập lại để tiếp tục."
        footer={
          <AuthFooterLink
            prompt="Cần hỗ trợ?"
            action="Gửi lại liên kết"
            onPress={() => router.replace('/forgot-password')}
          />
        }>
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
            <ShieldCheck size={28} color={theme.primary} />
          </View>
          <AuthMessage message={doneMessage} variant="success" />
          <Button onPress={() => router.replace('/login')} size="lg" style={styles.action}>
            Đăng nhập
          </Button>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Đặt lại mật khẩu"
      subtitle={`Tạo mật khẩu mới cho ${email}.`}
      footer={
        <AuthFooterLink
          prompt="Liên kết đã hết hạn?"
          action="Yêu cầu liên kết mới"
          disabled={submitting}
          onPress={() => router.replace('/forgot-password')}
        />
      }>
      <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14`, alignSelf: 'center' }]}>
        <KeyRound size={28} color={theme.primary} />
      </View>

      <AuthPasswordField
        autoComplete="new-password"
        icon={<Lock size={16} color="#9ca3af" />}
        label="Mật khẩu mới"
        onChangeText={setPassword}
        placeholder="Tối thiểu 6 ký tự"
        textContentType="newPassword"
        value={password}
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

      <Button
        disabled={submitting}
        icon={submitting ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined}
        onPress={handleSubmit}
        size="lg"
        style={styles.action}>
        {submitting ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  resultBlock: { alignItems: 'center', gap: 12, paddingTop: 4 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  action: { width: '100%', marginTop: 8, borderRadius: Radius.xl },
});
