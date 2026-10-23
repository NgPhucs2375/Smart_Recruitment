import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck, MailWarning } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi } from '@/features/auth';
import {
  AuthFooterLink,
  AuthMessage,
  AuthScreen,
} from '@/features/auth/components/auth-ui';
import { normalizeEmail } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

type ConfirmState = 'pending' | 'loading' | 'success' | 'error';

export default function ConfirmEmailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ userId?: string; code?: string; email?: string }>();

  const [state, setState] = useState<ConfirmState>(() =>
    params.userId && params.code ? 'loading' : 'pending',
  );
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const confirmKey = useRef<string | null>(null);

  const email = normalizeEmail(params.email ?? '');
  const hasLink = Boolean(params.userId && params.code);

  useEffect(() => {
    if (!params.userId || !params.code) return;

    const key = `${params.userId}:${params.code}`;
    if (confirmKey.current === key) return;
    confirmKey.current = key;

    let active = true;
    authApi
      .confirmEmail(params.userId, params.code)
      .then((result) => {
        if (!active) return;
        setMessage(result.message);
        setState('success');
      })
      .catch((reason) => {
        if (!active) return;
        setMessage(reason instanceof Error ? reason.message : 'Không thể xác minh email.');
        setState('error');
      });

    return () => {
      active = false;
    };
  }, [params.code, params.userId]);

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    setResendMessage('');
    try {
      const result = await authApi.resendVerificationEmail(email);
      setResendMessage(result.message);
    } catch (reason) {
      setResendMessage(reason instanceof Error ? reason.message : 'Không thể gửi lại email xác minh.');
    } finally {
      setResending(false);
    }
  };

  const title =
    state === 'loading'
      ? 'Đang xác minh email'
      : state === 'success'
        ? 'Email đã xác minh'
        : state === 'error'
          ? 'Không thể xác minh'
          : 'Kiểm tra email';

  const subtitle =
    state === 'pending'
      ? email
        ? `Liên kết xác minh đã được gửi tới ${email}.`
        : 'Mở liên kết xác minh trong email để kích hoạt tài khoản.'
      : state === 'success'
        ? 'Tài khoản của bạn đã sẵn sàng để đăng nhập.'
        : state === 'error'
          ? 'Liên kết có thể đã hết hạn hoặc đã được sử dụng.'
          : undefined;

  return (
    <AuthScreen
      title={title}
      subtitle={subtitle}
      footer={
        <AuthFooterLink
          prompt="Quay lại"
          action="Đăng nhập"
          onPress={() => router.replace('/login')}
        />
      }>
      {state === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
            Vui lòng chờ trong giây lát...
          </ThemedText>
        </View>
      ) : null}

      {state === 'success' ? (
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
            <MailCheck size={28} color={theme.primary} />
          </View>
          <AuthMessage message={message} variant="success" />
          <Button onPress={() => router.replace('/login')} size="lg" style={styles.action}>
            Đăng nhập
          </Button>
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.destructive}14` }]}>
            <MailWarning size={28} color={theme.destructive} />
          </View>
          <AuthMessage message={message} variant="error" />
          <Button onPress={() => router.replace('/login')} size="lg" style={styles.action}>
            Về trang đăng nhập
          </Button>
        </View>
      ) : null}

      {state === 'pending' ? (
        <View style={styles.resultBlock}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
            <MailCheck size={28} color={theme.primary} />
          </View>
          {hasLink ? null : (
            <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
              Kiểm tra cả hộp thư rác nếu bạn chưa thấy email.
            </ThemedText>
          )}

          {email ? (
            <Button
              variant="outline"
              disabled={resending}
              icon={resending ? <ActivityIndicator size="small" color={theme.text} /> : undefined}
              onPress={handleResend}
              size="lg"
              style={styles.action}>
              {resending ? 'Đang gửi lại...' : 'Gửi lại email xác minh'}
            </Button>
          ) : null}

          {resendMessage ? <AuthMessage message={resendMessage} variant="info" /> : null}
        </View>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  resultBlock: { alignItems: 'center', gap: 12, paddingTop: 4 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  helper: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  action: { width: '100%', marginTop: 8, borderRadius: Radius.xl },
});
