import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  showLogo?: boolean;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  contentStyle,
  showLogo = true,
}: AuthScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {showLogo ? <BrandLogo variant="navy" size="auth" style={styles.logo} /> : null}

          <View style={styles.headingBlock}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {subtitle ? (
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>

          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  action?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AuthField({
  label,
  icon,
  error,
  action,
  containerStyle,
  style,
  ...inputProps
}: AuthFieldProps) {
  const theme = useTheme();

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.destructive : theme.input },
          containerStyle,
        ]}>
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          autoCorrect={false}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[styles.input, action ? styles.inputWithAction : null, { color: theme.text }, style]}
          {...inputProps}
        />
        {action}
      </View>
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

type AuthPasswordFieldProps = Omit<AuthFieldProps, 'action' | 'secureTextEntry'>;

export function AuthPasswordField(props: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      {...props}
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry={!visible}
      action={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          hitSlop={8}
          onPress={() => setVisible((value) => !value)}
          style={styles.eyeButton}>
          {visible ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
        </Pressable>
      }
    />
  );
}

type AuthMessageProps = {
  message: string;
  variant?: 'error' | 'info' | 'success';
};

export function AuthMessage({ message, variant = 'info' }: AuthMessageProps) {
  const theme = useTheme();
  const color =
    variant === 'error' ? theme.destructive : variant === 'success' ? theme.primary : theme.textSecondary;
  const backgroundColor = variant === 'error' ? `${theme.destructive}14` : `${theme.primary}10`;

  return (
    <View style={[styles.message, { backgroundColor, borderColor: color }]}>
      <ThemedText style={[styles.messageText, { color }]}>{message}</ThemedText>
    </View>
  );
}

type AuthFooterLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AuthFooterLink({ prompt, action, onPress, disabled }: AuthFooterLinkProps) {
  const theme = useTheme();

  return (
    <View style={styles.footerLinkRow}>
      <ThemedText style={[styles.footerPrompt, { color: theme.textSecondary }]}>{prompt}</ThemedText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
        <ThemedText style={[styles.footerAction, { color: theme.primary }]}>{action}</ThemedText>
      </Pressable>
    </View>
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
  headingBlock: { alignItems: 'center', gap: 6, marginBottom: 22 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 14, lineHeight: 20, textAlign: 'center' },
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
  inputWithAction: { paddingRight: 8 },
  eyeButton: { padding: 4 },
  fieldError: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17, marginTop: 5 },
  message: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  messageText: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
  footer: { marginTop: 22, alignItems: 'center', gap: 8 },
  footerLinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  footerPrompt: { fontFamily: font('regular'), fontSize: 13 },
  footerAction: { fontFamily: font('semibold'), fontSize: 13 },
});
