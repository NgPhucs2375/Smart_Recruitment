import { router, useLocalSearchParams } from 'expo-router';
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
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi } from '@/features/auth';
import { validateEmail, validatePassword, validatePasswordConfirmation } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    if (!trimmedEmail || !trimmedToken || !password || !confirmPassword) {
      setError('Điền đủ email, token và mật khẩu mới.');
      return;
    }
    const validation = validateEmail(trimmedEmail) ?? validatePassword(password) ?? validatePasswordConfirmation(password, confirmPassword);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await authApi.resetPassword(trimmedEmail, password, trimmedToken);
      setSuccess(result.message || 'Đặt lại mật khẩu thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
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
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => safeBack('/forgot-password')}>
              <ArrowLeft size={20} color={theme.text} />
            </Pressable>
            <BrandLogo variant="navy" size="auth" style={styles.topLogo} />
            <View style={styles.topSpacer} />
          </View>

          <ThemedText style={styles.title}>Đặt lại mật khẩu</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Dán token từ email đặt lại mật khẩu
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
              placeholder="name@company.com"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={email}
              maxLength={100}
            />
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Token từ email</ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
            <KeyRound size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              onChangeText={setToken}
              placeholder="Dán token hoặc đường link đặt lại"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={token}
              maxLength={512}
            />
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Mật khẩu mới</ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
            <Lock size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              editable={!submitting}
              onChangeText={setPassword}
              placeholder="Tối thiểu 6 ký tự"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              selectionColor={theme.primary}
              style={[styles.input, { paddingRight: 36, color: theme.text }]}
              value={password}
              maxLength={100}
            />
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              disabled={submitting}
              onPress={() => setShowPassword((value) => !value)}
              style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff size={16} color={theme.textSecondary} />
              ) : (
                <Eye size={16} color={theme.textSecondary} />
              )}
            </Pressable>
          </View>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Xác nhận mật khẩu mới
          </ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
            <Lock size={16} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              editable={!submitting}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleSubmit}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={confirmPassword}
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
            <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/login')}>
              <ThemedText style={[styles.messageLink, { color: theme.primary }]}>
                Quay lại đăng nhập →
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
            {submitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
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
  eyeButton: { position: 'absolute', right: 12, padding: 4 },
  message: { fontFamily: font('medium'), fontSize: 13, lineHeight: 20, marginTop: 10 },
  messageLink: { fontFamily: font('semibold'), fontSize: 13, marginTop: 6 },
  submit: { width: '100%', marginTop: 16, borderRadius: Radius.xl },
});
