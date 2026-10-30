import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi } from '@/features/auth';
import { validateEmail } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

export default function ForgotPasswordScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await authApi.forgotPassword(trimmedEmail);
      const messageText = typeof result === 'string' ? result : result.message;
      setSuccess(messageText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => safeBack('/login')}>
              <ArrowLeft size={20} color={theme.text} />
            </Pressable>
            <BrandLogo variant="navy" size="auth" style={styles.topLogo} />
            <View style={styles.topSpacer} />
          </View>

          <ThemedText style={styles.title}>Quên mật khẩu</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Nhập email để nhận liên kết đặt lại mật khẩu
          </ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Email</ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
            <Mail size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={handleSubmit}
              placeholder="name@company.com"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={email}
              maxLength={100}
            />
          </View>

          {error ? (
            <ThemedText style={[styles.message, { color: theme.destructive }]}>{error}</ThemedText>
          ) : null}
          {success ? (
            <ThemedText style={[styles.message, { color: theme.primary }]}>{success}</ThemedText>
          ) : null}
          {success ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push({ pathname: '/reset-password', params: { email } })}>
              <ThemedText style={[styles.messageLink, { color: theme.primary }]}>
                Có token từ email? Đặt lại mật khẩu →
              </ThemedText>
            </Pressable>
          ) : null}

          <Button
            pill={false}
            size="lg"
            disabled={submitting}
            onPress={handleSubmit}
            icon={
              submitting ? (
                <ActivityIndicator size="small" color={theme.primaryForeground} />
              ) : (
                <ArrowRight size={16} color={theme.primaryForeground} />
              )
            }
            style={styles.submit}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 24, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  topLogo: { flex: 1 },
  topSpacer: { width: 20 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 14, marginBottom: 12 },
  label: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
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
  message: { fontFamily: font('medium'), fontSize: 13, lineHeight: 20, marginTop: 10 },
  messageLink: { fontFamily: font('semibold'), fontSize: 13, marginTop: 6 },
  submit: { width: '100%', marginTop: 16, borderRadius: Radius.xl },
});
