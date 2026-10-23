import { router } from 'expo-router';
import { MailCheck, MailQuestion } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi } from '@/features/auth';
import {
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthScreen,
} from '@/features/auth/components/auth-ui';
import { normalizeEmail, validateEmail } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = normalizeEmail(email);
    const validationError = validateEmail(normalizedEmail);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await authApi.forgotPassword(normalizedEmail);
      setSentTo(normalizedEmail);
      setMessage(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthScreen
        title="Kiểm tra email"
        subtitle={`Nếu ${sentTo} đã đăng ký, liên kết đặt lại mật khẩu sẽ sớm được gửi tới hộp thư.`}
        footer={
          <AuthFooterLink
            prompt="Nhớ mật khẩu?"
            action="Đăng nhập"
            onPress={() => router.replace('/login')}
          />
        }>
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
            <MailCheck size={28} color={theme.primary} />
          </View>
          <AuthMessage message={message} variant="success" />
          {error ? <AuthMessage message={error} variant="error" /> : null}
          <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
            Không thấy email? Kiểm tra hộp thư rác hoặc gửi lại sau ít phút.
          </ThemedText>
          <Button
            variant="outline"
            disabled={submitting}
            icon={submitting ? <ActivityIndicator size="small" color={theme.text} /> : undefined}
            onPress={handleSubmit}
            size="lg"
            style={styles.action}>
            {submitting ? 'Đang gửi lại...' : 'Gửi lại liên kết'}
          </Button>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Quên mật khẩu?"
      subtitle="Nhập email đã đăng ký. HIREAI sẽ gửi liên kết để bạn đặt lại mật khẩu."
      footer={
        <View style={styles.footerLinks}>
          <AuthFooterLink
            prompt="Nhớ mật khẩu?"
            action="Đăng nhập"
            disabled={submitting}
            onPress={() => router.replace('/login')}
          />
          <AuthFooterLink
            prompt="Chưa có tài khoản?"
            action="Đăng ký"
            disabled={submitting}
            onPress={() => router.replace('/register')}
          />
        </View>
      }>
      <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14`, alignSelf: 'center' }]}>
        <MailQuestion size={28} color={theme.primary} />
      </View>

      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        onSubmitEditing={handleSubmit}
        placeholder="name@example.com"
        returnKeyType="send"
        textContentType="emailAddress"
        value={email}
      />

      {error ? <AuthMessage message={error} variant="error" /> : null}

      <Button
        disabled={submitting}
        icon={submitting ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined}
        onPress={handleSubmit}
        size="lg"
        style={styles.action}>
        {submitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
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
  helper: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  action: { width: '100%', marginTop: 8, borderRadius: Radius.xl },
  footerLinks: { alignItems: 'center', gap: 8 },
});
