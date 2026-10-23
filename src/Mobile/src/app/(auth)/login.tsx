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
import { ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi, useAuth } from '@/features/auth';
import { AuthFooterLink } from '@/features/auth/components/auth-ui';
import { SocialLoginButtons } from '@/features/auth/components/social-login';
import { normalizeEmail, validateEmail } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, completeSignIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = normalizeEmail(email);
  const needsVerification = /xác minh|verify|verified/i.test(error);

  const handleSubmit = async () => {
    const validationError = validateEmail(normalizedEmail);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!password) {
      setError('Nhập mật khẩu để tiếp tục.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await signIn(normalizedEmail, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleIdToken = async (idToken: string) => {
    setError('');
    try {
      await completeSignIn(await authApi.googleLogin(idToken));
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  };

  const handleGithubCode = async (code: string, redirectUri: string) => {
    setError('');
    try {
      await completeSignIn(await authApi.githubLogin(code, redirectUri));
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập GitHub thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandLogo variant="navy" size="auth" style={styles.logo} />

          <View style={styles.headingBlock}>
            <View style={[styles.portalBadge, { backgroundColor: theme.muted, borderColor: theme.border }]}>
              <UserRound size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.portalBadgeText, { color: theme.textSecondary }]}>
                Cổng ứng viên
              </ThemedText>
            </View>
            <ThemedText style={styles.title}>Đăng nhập ứng viên</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Dùng chung hệ thống xác thực HIREAI
            </ThemedText>
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Email công việc hoặc cá nhân
          </ThemedText>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.backgroundElement, borderColor: theme.input },
            ]}>
            <Mail size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@company.com"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={email}
            />
          </View>

          <View style={styles.passwordLabelRow}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Mật khẩu
            </ThemedText>
            <Pressable
              accessibilityRole="link"
              disabled={submitting}
              hitSlop={8}
              onPress={() => router.push('/forgot-password')}>
              <ThemedText style={[styles.linkText, { color: theme.primary }]}>
                Quên mật khẩu?
              </ThemedText>
            </Pressable>
          </View>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.backgroundElement, borderColor: theme.input },
            ]}>
            <Lock size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              editable={!submitting}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              selectionColor={theme.primary}
              style={[styles.input, styles.inputWithAction, { color: theme.text }]}
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              accessibilityState={{ selected: showPassword }}
              hitSlop={8}
              disabled={submitting}
              onPress={() => setShowPassword((value) => !value)}
              style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff size={16} color="#9ca3af" />
              ) : (
                <Eye size={16} color="#9ca3af" />
              )}
            </Pressable>
          </View>

          {error ? (
            <ThemedText style={[styles.error, { color: theme.destructive }]}>{error}</ThemedText>
          ) : null}

          {needsVerification ? (
            <View style={styles.verifyRow}>
              <AuthFooterLink
                prompt="Email chưa được xác minh?"
                action="Gửi lại liên kết"
                disabled={submitting}
                onPress={() =>
                  router.push({ pathname: '/confirm-email', params: { email: normalizedEmail } })
                }
              />
            </View>
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
            {submitting ? 'Đang xác thực...' : 'Tiếp tục với Email & mật khẩu'}
          </Button>

          <SocialLoginButtons
            disabled={submitting}
            onGoogleIdToken={handleGoogleIdToken}
            onGithubCode={handleGithubCode}
            onError={setError}
          />

          <View style={styles.registerRow}>
            <AuthFooterLink
              prompt="Chưa có tài khoản?"
              action="Đăng ký ngay"
              disabled={submitting}
              onPress={() => router.push('/register')}
            />
          </View>

          <View style={[styles.hint, { borderColor: theme.border }]}>
            <ThemedText style={[styles.hintTitle, { color: theme.textSecondary }]}>
              Tài khoản demo
            </ThemedText>
            <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
              basicuser@gmail.com · 123Pa$$word!
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 4,
  },
  logo: { alignSelf: 'center', marginBottom: 28 },
  headingBlock: { alignItems: 'center', gap: 6, marginBottom: 24 },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  portalBadgeText: {
    fontFamily: font('semibold'),
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 14 },
  label: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: { fontFamily: font('regular'), fontSize: 12, marginTop: 10 },
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
  inputWithAction: { paddingRight: 8 },
  eyeButton: { padding: 4 },
  error: { fontFamily: font('medium'), fontSize: 13, lineHeight: 18, marginTop: 10 },
  verifyRow: { marginTop: 8, alignItems: 'center' },
  submit: { width: '100%', marginTop: 16, borderRadius: Radius.xl },
  registerRow: { marginTop: 14, alignItems: 'center' },
  hint: { marginTop: 28, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 2 },
  hintTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hintText: { fontFamily: font('regular'), fontSize: 13 },
});
