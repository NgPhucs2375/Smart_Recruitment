import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import {
  AlertCircle,
  AtSign,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { profileApi } from '@/features/profile/api/profile-api';
import { ProfileAvatarPicker } from '@/features/profile/components/profile-avatar-picker';
import {
  ProfileChoiceChips,
  ProfileField,
  ProfileSwitchRow,
} from '@/features/profile/components/profile-field';
import {
  formatVndInput,
  isFutureIsoDate,
  isoToVnDate,
  parseVndInput,
  vnToIsoDate,
} from '@/features/profile/format';
import type { AvatarUpload, CandidateProfile, CandidateProfileInput } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

type FormState = {
  fullName: string;
  phone: string;
  birthDate: string;
  gender: string;
  location: string;
  title: string;
  bio: string;
  expectedSalary: string;
  openToWork: boolean;
};

type FieldErrors = Partial<
  Record<'fullName' | 'phone' | 'birthDate' | 'location' | 'title' | 'expectedSalary' | 'avatar', string>
>;

const GENDER_OPTIONS = [
  { label: 'Nam', value: 'Nam' },
  { label: 'Nữ', value: 'Nữ' },
  { label: 'Khác', value: 'Khác' },
];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function emptyForm(name: string): FormState {
  return {
    fullName: name,
    phone: '',
    birthDate: '',
    gender: 'Nam',
    location: '',
    title: '',
    bio: '',
    expectedSalary: '',
    openToWork: true,
  };
}

function formFromProfile(profile: CandidateProfile, fallbackName: string): FormState {
  return {
    fullName: profile.fullName || fallbackName,
    phone: profile.phone,
    birthDate: isoToVnDate(profile.birthDate),
    gender: profile.gender || 'Nam',
    location: profile.location,
    title: profile.title,
    bio: profile.bio,
    expectedSalary: profile.expectedSalary ? formatVndInput(String(profile.expectedSalary)) : '',
    openToWork: profile.openToWork,
  };
}

function toInput(form: FormState): CandidateProfileInput {
  return {
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    birthDate: vnToIsoDate(form.birthDate),
    gender: form.gender,
    location: form.location.trim(),
    title: form.title.trim(),
    bio: form.bio.trim(),
    expectedSalary: parseVndInput(form.expectedSalary),
    openToWork: form.openToWork,
  };
}

function initialsFor(name: string): string {
  if (!name.trim()) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

function dateFromVn(value: string): Date {
  const iso = vnToIsoDate(value);
  if (iso) return new Date(`${iso}T12:00:00`);
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  const fullName = form.fullName.trim();

  if (!fullName) errors.fullName = 'Vui lòng nhập họ và tên.';
  else if (fullName.length > 200) errors.fullName = 'Họ và tên tối đa 200 ký tự.';

  if (form.phone.trim() && !/^[0-9+().\s-]{8,20}$/.test(form.phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ.';
  }

  if (form.birthDate.trim()) {
    const iso = vnToIsoDate(form.birthDate);
    if (!iso) errors.birthDate = 'Ngày sinh không hợp lệ (dd/mm/yyyy).';
    else if (isFutureIsoDate(iso)) errors.birthDate = 'Ngày sinh không được ở tương lai.';
  }

  if (form.location.trim().length > 500) errors.location = 'Địa chỉ tối đa 500 ký tự.';
  if (form.title.trim().length > 200) errors.title = 'Vị trí ứng tuyển tối đa 200 ký tự.';

  const salaryDigits = form.expectedSalary.replace(/\D/g, '');
  if (salaryDigits.length > 12) errors.expectedSalary = 'Mức lương quá lớn.';

  return errors;
}

function normalizeMimeType(value: string | null | undefined, fileName: string): string {
  const mime = (value || '').toLowerCase();
  if (mime === 'image/jpg' || mime === 'image/pjpeg') return 'image/jpeg';
  if (mime) return mime;

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export default function ProfileEditScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const fallbackName = user?.fullname || user?.userName || user?.email || 'Người dùng';
  const fallbackEmail = user?.email ?? '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [existingAvatar, setExistingAvatar] = useState<string | undefined>();
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarUpload | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(fallbackName));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [birthDatePickerVisible, setBirthDatePickerVisible] = useState(false);
  const [removeAvatarVisible, setRemoveAvatarVisible] = useState(false);

  const fallback = useMemo(
    () => ({ name: fallbackName, email: fallbackEmail }),
    [fallbackEmail, fallbackName],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setSubmitError('');
    try {
      const result = await profileApi.getMine(fallback);
      const profile = result.profile;
      if (profile) {
        setProfileId(profile.id ?? null);
        setExistingAvatar(profile.avatarUrl);
        setForm(formFromProfile(profile, fallbackName));
      } else {
        setProfileId(null);
        setExistingAvatar(undefined);
        setForm(emptyForm(fallbackName));
      }
      setSelectedAvatar(null);
      setAvatarRemoved(false);
      setErrors({});
    } catch (reason) {
      setLoadError(
        reason instanceof Error ? reason.message : 'Không tải được hồ sơ. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, [fallback, fallbackName]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const previewUri = selectedAvatar?.uri ?? (avatarRemoved ? undefined : existingAvatar);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError('');
  };

  const handlePickAvatar = async () => {
    setErrors((current) => ({ ...current, avatar: undefined }));
    setSubmitError('');
    setPickerBusy(true);
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setErrors((current) => ({
            ...current,
            avatar: 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.',
          }));
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || `avatar-${Date.now()}`;
      const mimeType = normalizeMimeType(asset.mimeType, fileName);

      if (!ALLOWED_AVATAR_TYPES.has(mimeType)) {
        setErrors((current) => ({
          ...current,
          avatar: 'Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.',
        }));
        return;
      }

      if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE) {
        setErrors((current) => ({ ...current, avatar: 'Ảnh đại diện không được vượt quá 5MB.' }));
        return;
      }

      const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
      setSelectedAvatar({
        uri: asset.uri,
        name: /\.[a-z0-9]+$/i.test(fileName) ? fileName : `${fileName}.${extension}`,
        mimeType,
        file: asset.file,
      });
      setAvatarRemoved(false);
    } catch (reason) {
      setErrors((current) => ({
        ...current,
        avatar:
          reason instanceof Error ? reason.message : 'Không chọn được ảnh. Vui lòng thử lại.',
      }));
    } finally {
      setPickerBusy(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (selectedAvatar) {
      setSelectedAvatar(null);
      return;
    }
    if (existingAvatar) setRemoveAvatarVisible(true);
  };

  const confirmRemoveAvatar = () => {
    setAvatarRemoved(true);
    setSelectedAvatar(null);
    setRemoveAvatarVisible(false);
  };

  const handleSave = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    let savedProfileId = profileId;
    let profileSaved = false;
    try {
      const input = toInput(form);
      if (savedProfileId) {
        await profileApi.update(savedProfileId, input);
      } else {
        savedProfileId = await profileApi.create(input, fallback);
        setProfileId(savedProfileId);
      }
      profileSaved = true;

      if (selectedAvatar) {
        await profileApi.uploadAvatar(savedProfileId, selectedAvatar);
        setSelectedAvatar(null);
        setAvatarRemoved(false);
      } else if (avatarRemoved && existingAvatar) {
        await profileApi.deleteAvatar(savedProfileId);
        setExistingAvatar(undefined);
        setAvatarRemoved(false);
      }

      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (reason) {
      if (profileSaved && savedProfileId) {
        await profileApi
          .getMine(fallback)
          .then((fresh) => {
            if (!fresh.profile) return;
            setProfileId(fresh.profile.id ?? savedProfileId);
            setExistingAvatar(fresh.profile.avatarUrl);
          })
          .catch(() => undefined);
      }
      const message =
        reason instanceof Error ? reason.message : 'Không lưu được hồ sơ. Vui lòng thử lại.';
      setSubmitError(
        profileSaved
          ? `${message} Thông tin hồ sơ đã được lưu, bạn có thể thử lại ảnh đại diện.`
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (saving) return;
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  const handleBirthDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setBirthDatePickerVisible(false);
    if (event.type !== 'set' || !date) return;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    patch('birthDate', `${day}/${month}/${date.getFullYear()}`);
  };

  const title = loading ? 'Hồ sơ ứng viên' : profileId ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ ứng viên';

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StackHeader title={title} onBack={handleBack} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.centerText, { color: theme.textSecondary }]}>
            Đang tải hồ sơ...
          </ThemedText>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <AlertCircle size={30} color={theme.destructive} />
          <ThemedText style={[styles.errorTitle, { color: theme.text }]}>
            Không tải được hồ sơ
          </ThemedText>
          <ThemedText style={[styles.centerText, { color: theme.textSecondary }]}>
            {loadError}
          </ThemedText>
          <Button onPress={() => void loadProfile()} size="sm" style={styles.retryButton}>
            Thử lại
          </Button>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ProfileAvatarPicker
              busy={pickerBusy || saving}
              initials={initialsFor(form.fullName)}
              onPick={() => void handlePickAvatar()}
              onRemove={handleRemoveAvatar}
              previewUri={previewUri}
            />
            {errors.avatar ? (
              <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>
                {errors.avatar}
              </ThemedText>
            ) : null}

            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              THÔNG TIN CÁ NHÂN
            </ThemedText>

            <ProfileField
              autoCapitalize="words"
              icon={<UserRound size={16} color={theme.primary} />}
              label="Họ và tên"
              maxLength={200}
              onChangeText={(value) => patch('fullName', value)}
              placeholder="Nguyễn Văn A"
              required
              value={form.fullName}
              error={errors.fullName}
            />
            <ProfileField
              autoCapitalize="none"
              icon={<AtSign size={16} color={theme.primary} />}
              label="Email"
              editable={false}
              value={fallbackEmail || 'Chưa có email'}
            />
            <ProfileField
              autoComplete="tel"
              icon={<Phone size={16} color={theme.primary} />}
              keyboardType="phone-pad"
              label="Số điện thoại"
              maxLength={20}
              onChangeText={(value) => patch('phone', value)}
              placeholder="0912345678"
              value={form.phone}
              error={errors.phone}
            />
            <View>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Ngày sinh
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn ngày sinh"
                onPress={() => setBirthDatePickerVisible(true)}
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: errors.birthDate ? theme.destructive : theme.input,
                  },
                ]}>
                <CalendarDays size={16} color={theme.primary} />
                <ThemedText
                  style={[
                    styles.dateInputText,
                    { color: form.birthDate ? theme.text : theme.textSecondary },
                  ]}>
                  {form.birthDate || 'Chọn ngày sinh'}
                </ThemedText>
              </Pressable>
              {birthDatePickerVisible ? (
                <DateTimePicker
                  value={dateFromVn(form.birthDate)}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleBirthDateChange}
                />
              ) : null}
              {errors.birthDate ? (
                <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>
                  {errors.birthDate}
                </ThemedText>
              ) : null}
            </View>
            <ProfileChoiceChips
              label="Giới tính"
              onChange={(value) => patch('gender', value)}
              options={GENDER_OPTIONS}
              value={form.gender}
            />
            <ProfileField
              autoCapitalize="sentences"
              icon={<MapPin size={16} color={theme.primary} />}
              label="Địa chỉ"
              maxLength={500}
              onChangeText={(value) => patch('location', value)}
              placeholder="TP. Hồ Chí Minh"
              value={form.location}
              error={errors.location}
            />

            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              ĐỊNH HƯỚNG NGHỀ NGHIỆP
            </ThemedText>

            <ProfileField
              autoCapitalize="sentences"
              icon={<Briefcase size={16} color={theme.primary} />}
              label="Vị trí ứng tuyển"
              maxLength={200}
              onChangeText={(value) => patch('title', value)}
              placeholder="Frontend Developer"
              value={form.title}
              error={errors.title}
            />
            <ProfileField
              icon={<CircleDollarSign size={16} color={theme.primary} />}
              keyboardType="number-pad"
              label="Mức lương mong muốn"
              maxLength={12}
              onBlur={() => patch('expectedSalary', formatVndInput(form.expectedSalary))}
              onChangeText={(value) => patch('expectedSalary', value.replace(/\D/g, ''))}
              placeholder="15.000.000"
              suffix="VNĐ"
              value={form.expectedSalary}
              error={errors.expectedSalary}
            />
            <ProfileField
              autoCapitalize="sentences"
              label="Giới thiệu bản thân"
              multiline
              onChangeText={(value) => patch('bio', value)}
              placeholder="Mô tả ngắn về kinh nghiệm, thế mạnh và mục tiêu nghề nghiệp của bạn."
              value={form.bio}
            />

            <ProfileSwitchRow
              description="Cho nhà tuyển dụng biết bạn đang sẵn sàng cho cơ hội mới."
              onValueChange={(value) => patch('openToWork', value)}
              title="Đang tìm việc"
              value={form.openToWork}
            />

            {submitError ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: `${theme.destructive}14`, borderColor: theme.destructive },
                ]}>
                <AlertCircle size={16} color={theme.destructive} />
                <ThemedText style={[styles.errorBannerText, { color: theme.destructive }]}>
                  {submitError}
                </ThemedText>
              </View>
            ) : null}

            <Button
              disabled={saving || pickerBusy}
              icon={
                saving ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : undefined
              }
              onPress={() => void handleSave()}
              size="lg"
              style={styles.saveButton}>
              {saving ? 'Đang lưu...' : profileId ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
            </Button>
            <ThemedText style={[styles.footerNote, { color: theme.textSecondary }]}>
              Thông tin hồ sơ được dùng để gợi ý việc làm phù hợp và hỗ trợ nhà tuyển dụng liên hệ với
              bạn.
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ConfirmDialog
        busy={saving}
        confirmLabel="Xoá ảnh"
        destructive
        message="Ảnh đại diện hiện tại sẽ bị xoá khỏi hồ sơ. Bạn có thể chọn ảnh mới sau."
        onCancel={() => setRemoveAvatarVisible(false)}
        onConfirm={confirmRemoveAvatar}
        title="Xoá ảnh đại diện?"
        visible={removeAvatarVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  centerText: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  errorTitle: { fontFamily: font('semibold'), fontSize: 16 },
  retryButton: { marginTop: 6 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, gap: 14 },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    letterSpacing: 1.6,
    marginTop: 12,
  },
  fieldLabel: {
    fontFamily: font('medium'),
    fontSize: 12,
    marginBottom: 7,
  },
  dateInput: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  dateInputText: { fontFamily: font('regular'), fontSize: 14 },
  fieldError: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17, marginTop: -8 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 12,
  },
  errorBannerText: { flex: 1, fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
  saveButton: { width: '100%', marginTop: 8, borderRadius: Radius.xl },
  footerNote: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
