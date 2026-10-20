import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Nhập email và mật khẩu để tiếp tục.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await signIn(trimmedEmail, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Đăng nhập</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Dùng tài khoản Smart Recruitment để xem việc làm và quản lý hồ sơ.
          </ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Email</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="ban@example.com"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.primary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
            ]}
            value={email}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Mật khẩu</ThemedText>
          <TextInput
            autoCapitalize="none"
            editable={!submitting}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            placeholder="••••••••"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            selectionColor={theme.primary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
            ]}
            value={password}
          />

          {error ? <ThemedText style={[styles.error, { color: '#C0392B' }]}>{error}</ThemedText> : null}

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: theme.primary, opacity: submitting ? 0.7 : pressed ? 0.85 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitText}>Đăng nhập</ThemedText>
            )}
          </Pressable>

          <View style={[styles.hint, { borderColor: theme.border }]}>
            <ThemedText style={[styles.hintTitle, { color: theme.textSecondary }]}>Tài khoản demo</ThemedText>
            <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
              basicuser@gmail.com · 123Pa$$word!
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  error: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  submit: {
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  hint: { marginTop: 24, borderTopWidth: 1, paddingTop: 14, gap: 2 },
  hintTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  hintText: { fontSize: 13 },
});
