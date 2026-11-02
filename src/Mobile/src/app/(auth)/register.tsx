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
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi, type RegisterRole } from '@/features/auth';
import { validateEmail, validatePhone, validatePassword, validatePasswordConfirmation, validateTaxCode, validateText } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

type RoleOption = { value: RegisterRole; label: string };

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'UNG_VIEN', label: 'Ứng viên' },
  { value: 'NGUOI_DAI_DIEN', label: 'Nhà tuyển dụng' },
];

export default function RegisterScreen() {
  const theme = useTheme();

  const [role, setRole] = useState<RegisterRole>('UNG_VIEN');
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [chucVu, setChucVu] = useState('');
  const [tenDoanhNghiep, setTenDoanhNghiep] = useState('');
  const [diaChiDoanhNghiep, setDiaChiDoanhNghiep] = useState('');
  const [maSoThue, setMaSoThue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEmployer = role === 'NGUOI_DAI_DIEN';

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!hoTen.trim() || !soDienThoai.trim() || !trimmedEmail || !password || !confirmPassword) {
      setError('Điền đủ họ tên, số điện thoại, email và mật khẩu.');
      return;
    }
    const validation = validateEmail(trimmedEmail) ?? validatePhone(soDienThoai) ?? validatePassword(password) ??
      validatePasswordConfirmation(password, confirmPassword) ?? validateText(hoTen, 'Họ tên', 100, true) ??
      (isEmployer ? validateText(chucVu, 'Chức vụ', 100, true) : null) ??
      (isEmployer ? validateText(tenDoanhNghiep, 'Tên doanh nghiệp', 255, true) : null) ??
      (isEmployer ? validateText(diaChiDoanhNghiep, 'Địa chỉ doanh nghiệp', 255, true) : null) ??
      (isEmployer ? validateTaxCode(maSoThue) : null);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await authApi.register({
        role,
        email: trimmedEmail,
        password,
        confirmPassword,
        hoTen: hoTen.trim(),
        soDienThoai: soDienThoai.trim(),
        chucVu: isEmployer ? chucVu.trim() : undefined,
        tenDoanhNghiep: isEmployer ? tenDoanhNghiep.trim() : undefined,
        diaChiDoanhNghiep: isEmployer ? diaChiDoanhNghiep.trim() : undefined,
        maSoThue: isEmployer ? maSoThue.trim() || undefined : undefined,
      });
      const messageText = typeof result === 'string' ? result : result.message;
      setSuccess(`${messageText || 'Đăng ký thành công!'} Kiểm tra email để xác thực, sau đó đăng nhập.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
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

          <ThemedText style={styles.title}>Đăng ký tài khoản</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Chọn loại tài khoản để bắt đầu
          </ThemedText>

          <View style={[styles.roleRow, { borderColor: theme.border }]}>
            {ROLE_OPTIONS.map((option) => {
              const active = role === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  disabled={submitting}
                  onPress={() => setRole(option.value)}
                  style={[
                    styles.roleChip,
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}>
                  {option.value === 'NGUOI_DAI_DIEN' ? (
                    <Building2 size={14} color={active ? theme.primaryForeground : theme.textSecondary} />
                  ) : (
                    <UserRound size={14} color={active ? theme.primaryForeground : theme.textSecondary} />
                  )}
                  <ThemedText
                    style={[
                      styles.roleChipText,
                      { color: active ? theme.primaryForeground : theme.textSecondary },
                    ]}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Field label="Họ và tên" icon={<UserRound size={16} color={theme.textSecondary} />}>
            <TextInput
              editable={!submitting}
              onChangeText={setHoTen}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={hoTen}
              maxLength={100}
            />
          </Field>

          <Field label="Số điện thoại" icon={<Phone size={16} color={theme.textSecondary} />}>
            <TextInput
              editable={!submitting}
              keyboardType="phone-pad"
              onChangeText={setSoDienThoai}
              placeholder="09xx xxx xxx"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={soDienThoai}
              maxLength={20}
            />
          </Field>

          <Field label="Email" icon={<Mail size={16} color={theme.textSecondary} />}>
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
          </Field>

          <Field label="Mật khẩu" icon={<Lock size={16} color={theme.textSecondary} />}>
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
          </Field>

          <Field label="Xác nhận mật khẩu" icon={<Lock size={16} color={theme.textSecondary} />}>
            <TextInput
              autoCapitalize="none"
              editable={!submitting}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleSubmit}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              selectionColor={theme.primary}
              style={[styles.input, { color: theme.text }]}
              value={confirmPassword}
              maxLength={100}
            />
          </Field>

          {isEmployer ? (
            <View style={styles.employerBlock}>
              <ThemedText style={[styles.employerTitle, { color: theme.textSecondary }]}>
                Thông tin nhà tuyển dụng
              </ThemedText>
              <Field label="Chức vụ" icon={<BriefcaseBusiness size={16} color={theme.textSecondary} />}>
                <TextInput
                  editable={!submitting}
                  onChangeText={setChucVu}
                  placeholder="Chuyên viên tuyển dụng"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.primary}
                  style={[styles.input, { color: theme.text }]}
                  value={chucVu}
                  maxLength={100}
                />
              </Field>
              <Field label="Tên doanh nghiệp" icon={<Building2 size={16} color={theme.textSecondary} />}>
                <TextInput
                  editable={!submitting}
                  onChangeText={setTenDoanhNghiep}
                  placeholder="Công ty TNHH ABC"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.primary}
                  style={[styles.input, { color: theme.text }]}
                  value={tenDoanhNghiep}
                  maxLength={255}
                />
              </Field>
              <Field label="Địa chỉ doanh nghiệp" icon={<MapPin size={16} color={theme.textSecondary} />}>
                <TextInput
                  editable={!submitting}
                  onChangeText={setDiaChiDoanhNghiep}
                  placeholder="Quận 1, TP. Hồ Chí Minh"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.primary}
                  style={[styles.input, { color: theme.text }]}
                  value={diaChiDoanhNghiep}
                  maxLength={255}
                />
              </Field>
              <Field label="Mã số thuế (không bắt buộc)">
                <TextInput
                  editable={!submitting}
                  keyboardType="number-pad"
                  onChangeText={setMaSoThue}
                  placeholder="0123456789"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.primary}
                  style={[styles.input, { color: theme.text }]}
                  value={maSoThue}
                  maxLength={13}
                />
              </Field>
            </View>
          ) : null}

          {error ? (
            <ThemedText style={[styles.error, { color: theme.destructive }]}>{error}</ThemedText>
          ) : null}
          {success ? (
            <ThemedText style={[styles.error, { color: theme.primary }]}>
              {success}
              {'  '}
              <ThemedText
                onPress={() => router.replace('/login')}
                style={{ color: theme.primary, fontFamily: font('semibold') }}>
                Đăng nhập ngay
              </ThemedText>
            </ThemedText>
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
            {submitting ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
        {icon ? <>{icon}</> : null}
        {icon ? <View style={styles.inputIconSpacer} /> : null}
        {children}
      </View>
    </View>
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 4,
    marginBottom: 8,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleChipText: { fontFamily: font('semibold'), fontSize: 13 },
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
  inputIconSpacer: { marginRight: 10 },
  input: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  eyeButton: { position: 'absolute', right: 12, padding: 4 },
  employerBlock: { marginTop: 4 },
  employerTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  error: { fontFamily: font('medium'), fontSize: 13, lineHeight: 20, marginTop: 10 },
  submit: { width: '100%', marginTop: 16, marginBottom: 24, borderRadius: Radius.xl },
});
