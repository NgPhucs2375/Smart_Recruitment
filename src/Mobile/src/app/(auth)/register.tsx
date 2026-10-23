import { router } from 'expo-router';
import { BriefcaseBusiness, Building2, Mail, MapPin, Phone, UserRound, UserRoundCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { authApi, type RegisterRole } from '@/features/auth';
import {
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthPasswordField,
  AuthScreen,
} from '@/features/auth/components/auth-ui';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
} from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

const ROLE_OPTIONS: { value: RegisterRole; label: string; description: string; icon: typeof UserRound }[] = [
  {
    value: 'UNG_VIEN',
    label: 'Ứng viên',
    description: 'Tìm việc và tạo CV',
    icon: UserRoundCheck,
  },
  {
    value: 'NGUOI_DAI_DIEN',
    label: 'Nhà tuyển dụng',
    description: 'Đăng tin và quản lý ứng viên',
    icon: BriefcaseBusiness,
  },
];

export default function RegisterScreen() {
  const theme = useTheme();

  const [role, setRole] = useState<RegisterRole>('UNG_VIEN');
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenDoanhNghiep, setTenDoanhNghiep] = useState('');
  const [diaChiDoanhNghiep, setDiaChiDoanhNghiep] = useState('');
  const [chucVu, setChucVu] = useState('');
  const [maSoThue, setMaSoThue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEmployer = role === 'NGUOI_DAI_DIEN';

  const handleSubmit = async () => {
    const normalizedEmail = normalizeEmail(email);
    const validationError =
      (!hoTen.trim() ? 'Nhập họ và tên.' : null) ??
      validateEmail(normalizedEmail) ??
      validatePhone(soDienThoai) ??
      validatePassword(password) ??
      validatePasswordConfirmation(password, confirmPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEmployer) {
      if (!tenDoanhNghiep.trim()) {
        setError('Nhập tên doanh nghiệp.');
        return;
      }
      if (!diaChiDoanhNghiep.trim()) {
        setError('Nhập địa chỉ doanh nghiệp.');
        return;
      }
      if (!chucVu.trim()) {
        setError('Nhập chức vụ của bạn tại doanh nghiệp.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      await authApi.register({
        role,
        email: normalizedEmail,
        password,
        confirmPassword,
        hoTen: hoTen.trim(),
        soDienThoai: soDienThoai.trim(),
        tenDoanhNghiep: isEmployer ? tenDoanhNghiep.trim() : undefined,
        diaChiDoanhNghiep: isEmployer ? diaChiDoanhNghiep.trim() : undefined,
        chucVu: isEmployer ? chucVu.trim() : undefined,
        maSoThue: isEmployer ? maSoThue.trim() || undefined : undefined,
      });
      router.replace({ pathname: '/confirm-email', params: { email: normalizedEmail, sent: '1' } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Tạo tài khoản"
      subtitle="Chọn vai trò phù hợp để bắt đầu sử dụng HIREAI."
      contentStyle={styles.topContent}
      footer={
        <AuthFooterLink
          prompt="Đã có tài khoản?"
          action="Đăng nhập"
          disabled={submitting}
          onPress={() => router.replace('/login')}
        />
      }>
      <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>Vai trò</ThemedText>
      <View style={styles.roleRow}>
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = role === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: submitting }}
              disabled={submitting}
              onPress={() => setRole(option.value)}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? `${theme.primary}10` : theme.backgroundElement,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Icon size={18} color={selected ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.roleTitle, { color: selected ? theme.primary : theme.text }]}>
                {option.label}
              </ThemedText>
              <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
                {option.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <AuthField
        autoCapitalize="words"
        icon={<UserRound size={16} color="#9ca3af" />}
        label="Họ và tên"
        onChangeText={setHoTen}
        placeholder="Nguyễn Văn A"
        value={hoTen}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        icon={<Mail size={16} color="#9ca3af" />}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="name@example.com"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        autoComplete="tel"
        icon={<Phone size={16} color="#9ca3af" />}
        keyboardType="phone-pad"
        label="Số điện thoại"
        onChangeText={setSoDienThoai}
        placeholder="09xx xxx xxx"
        textContentType="telephoneNumber"
        value={soDienThoai}
      />

      {isEmployer ? (
        <>
          <AuthField
            autoCapitalize="words"
            icon={<Building2 size={16} color="#9ca3af" />}
            label="Tên doanh nghiệp"
            onChangeText={setTenDoanhNghiep}
            placeholder="Công ty TNHH ..."
            value={tenDoanhNghiep}
          />
          <AuthField
            autoCapitalize="sentences"
            icon={<MapPin size={16} color="#9ca3af" />}
            label="Địa chỉ doanh nghiệp"
            onChangeText={setDiaChiDoanhNghiep}
            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
            value={diaChiDoanhNghiep}
          />
          <AuthField
            autoCapitalize="words"
            icon={<BriefcaseBusiness size={16} color="#9ca3af" />}
            label="Chức vụ"
            onChangeText={setChucVu}
            placeholder="Giám đốc, Trưởng phòng nhân sự..."
            value={chucVu}
          />
          <AuthField
            autoCapitalize="none"
            label="Mã số thuế (không bắt buộc)"
            onChangeText={setMaSoThue}
            placeholder="Mã số thuế doanh nghiệp"
            value={maSoThue}
          />
        </>
      ) : null}

      <AuthPasswordField
        autoComplete="new-password"
        icon={<UserRound size={16} color="#9ca3af" />}
        label="Mật khẩu"
        onChangeText={setPassword}
        placeholder="Tối thiểu 6 ký tự"
        textContentType="newPassword"
        value={password}
      />
      <AuthPasswordField
        autoComplete="new-password"
        label="Nhập lại mật khẩu"
        onChangeText={setConfirmPassword}
        placeholder="Nhập lại mật khẩu"
        textContentType="newPassword"
        value={confirmPassword}
      />

      {error ? <AuthMessage message={error} variant="error" /> : null}

      <Button
        disabled={submitting}
        icon={
          submitting ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : undefined
        }
        onPress={handleSubmit}
        size="lg"
        style={styles.submit}>
        {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  topContent: { justifyContent: 'flex-start', paddingTop: 20 },
  sectionLabel: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  roleCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  roleTitle: { fontFamily: font('semibold'), fontSize: 13 },
  roleDescription: { fontFamily: font('regular'), fontSize: 11, lineHeight: 15 },
  submit: { width: '100%', marginTop: 18, borderRadius: Radius.xl },
});
