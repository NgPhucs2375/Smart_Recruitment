import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  DollarSign,
  ImagePlus,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { profileApi } from '@/features/profile/api/profile-api';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

// —— Helpers định dạng (clone từ web lib/format-vnd + tao-cv/cv-data) ——

/** "15000000" -> "15.000.000" (dấu "." phân cách nghìn). */
function formatVndInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return '';
  const normalized = digits.replace(/^0+$/, '0');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "15.000.000" -> 15000000. Rỗng/sai -> 0. */
function parseVndInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/** Mask ngày dd/mm/yyyy khi gõ (giống maskDateVn của web). */
function maskDateVn(raw: string): string {
  if (raw.includes('/')) {
    const caps = [2, 2, 4];
    const parts = raw.split('/').slice(0, 3);
    const out: string[] = [];
    let carry = '';
    for (let i = 0; i < parts.length; i += 1) {
      const seg = (carry + parts[i]).replace(/\D/g, '');
      carry = '';
      if (seg.length > caps[i]) {
        out.push(seg.slice(0, caps[i]));
        carry = seg.slice(caps[i]);
      } else {
        out.push(seg);
      }
    }
    if (carry && out.length < 3) out.push(carry.slice(0, 4));
    return out.slice(0, 3).join('/');
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits === '') return '';
  const d = digits.slice(0, 2);
  if (digits.length <= 2) return d;
  const m = digits.slice(2, 4);
  if (digits.length <= 4) return `${d}/${m}`;
  return `${d}/${m}/${digits.slice(4, 8)}`;
}

/** "31/12/2024" -> "2024-12-31", sai -> "". */
function vnToIsoDate(v: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((v || '').trim());
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) {
    return '';
  }
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** ISO "2024-12-31..." -> "31/12/2024". */
function isoToVnDate(v: string | null | undefined): string {
  const iso = typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : '';
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'] as const;

export default function ProfileEditScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const fallbackName = user?.fullname || user?.userName || '';
  const fallbackEmail = user?.email || '';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<'api' | 'demo'>('api');

  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState('Nam');
  const [diaChi, setDiaChi] = useState('');
  const [viTri, setViTri] = useState('');
  const [mucLuong, setMucLuong] = useState('');
  const [isTimViec, setIsTimViec] = useState(true);
  const [gioiThieu, setGioiThieu] = useState('');

  const populate = useCallback((profile: CandidateProfile) => {
    setProfileId(profile.id);
    setHasProfile(Boolean(profile.id));
    setAvatarUrl(profile.avatarUrl);
    setHoTen(profile.fullName || '');
    setSdt(profile.phone || '');
    setNgaySinh(isoToVnDate(profile.birthDate));
    setGioiTinh(profile.gender || 'Nam');
    setDiaChi(profile.location || '');
    setViTri(profile.title || '');
    setMucLuong(profile.expectedSalary > 0 ? formatVndInput(String(profile.expectedSalary)) : '');
    setIsTimViec(profile.openToWork !== false);
    setGioiThieu(profile.bio || '');
  }, []);

  // setState nằm trong callback .then/.catch (không chạy đồng bộ trong effect)
  // — tránh react-hooks/set-state-in-effect.
  const loadProfile = useCallback(() => {
    return profileApi
      .getMine({ name: fallbackName, email: fallbackEmail })
      .then((result) => {
        setSource(result.source);
        const profile =
          result.profile ??
          ({
            fullName: fallbackName,
            email: fallbackEmail,
            phone: '',
            location: '',
            title: '',
            bio: '',
            expectedSalary: 0,
            birthDate: '',
            gender: '',
            openToWork: true,
          } satisfies CandidateProfile);
        populate({
          ...profile,
          fullName: profile.fullName || fallbackName,
          email: profile.email || fallbackEmail,
        });
        setLoadError('');
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Không tải được hồ sơ.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fallbackEmail, fallbackName, populate]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError('');
    void loadProfile();
  };

  const dateInvalid = ngaySinh.trim() !== '' && vnToIsoDate(ngaySinh) === '';

  const handleSave = () => {
    if (!hoTen.trim()) {
      setFormError('Vui lòng nhập họ tên.');
      return;
    }
    if (dateInvalid) {
      setFormError('Ngày sinh không hợp lệ (dd/mm/yyyy).');
      return;
    }

    void (async () => {
      setSaving(true);
      setFormError('');
      try {
        const iso = vnToIsoDate(ngaySinh);
        const payload = {
          hoTen: hoTen.trim(),
          sdt: sdt.trim(),
          ngaySinh: iso ? new Date(iso).toISOString() : null,
          gioiTinh,
          diaChi: diaChi.trim(),
          gioiThieu: gioiThieu.trim(),
          viTriUngTuyen: viTri.trim(),
          mucLuongMongMuon: parseVndInput(mucLuong),
          isTimViec,
        };

        if (profileId && hasProfile) {
          await profileApi.update(profileId, payload);
        } else {
          await profileApi.create(payload);
        }

        Alert.alert(
          'Thành công',
          hasProfile ? 'Cập nhật hồ sơ thành công!' : 'Tạo hồ sơ ứng viên thành công!',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu hồ sơ.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const initials = hoTen
    ? hoTen
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'UV';

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          disabled={saving}
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.topBarTitle}>Chỉnh sửa hồ sơ</ThemedText>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {source === 'demo' ? (
            <Badge variant="secondary" textStyle={styles.demoBadge}>
              DỮ LIỆU MINH HỌA
            </Badge>
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                Đang tải thông tin hồ sơ...
              </ThemedText>
            </View>
          ) : loadError ? (
            // Lỗi tải hồ sơ: KHÔNG mở form trống để tránh lưu nhầm hồ sơ mới — đúng web ho-so-view.
            <View
              style={[
                styles.errorBanner,
                { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` },
              ]}>
              <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
                {`Không tải được hồ sơ: ${loadError}`}
              </ThemedText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={handleRetry}>
                <ThemedText style={[styles.errorRetry, { color: theme.destructive }]}>
                  Thử lại
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              {formError ? (
                <View
                  style={[
                    styles.errorBanner,
                    { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` },
                  ]}>
                  <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
                    {formError}
                  </ThemedText>
                </View>
              ) : null}

              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                1. THÔNG TIN CÁ NHÂN
              </ThemedText>

              <View
                style={[
                  styles.avatarBlock,
                  { backgroundColor: theme.muted, borderColor: theme.border },
                ]}>
                <View style={[styles.avatarCircle, { backgroundColor: `${theme.primary}1A` }]}>
                  {avatarUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      transition={180}
                    />
                  ) : (
                    <ThemedText style={[styles.avatarInitials, { color: theme.primary }]}>
                      {initials}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.avatarCopy}>
                  <ThemedText style={[styles.avatarLabel, { color: theme.text }]}>
                    Ảnh đại diện
                  </ThemedText>
                  <View style={styles.avatarNoteRow}>
                    <ImagePlus size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.avatarNote, { color: theme.textSecondary }]}>
                      Tải ảnh đại diện trên web
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Field label="HỌ VÀ TÊN" required>
                <View style={[styles.inputWrap, inputWrapStyle(theme)]}>
                  <User size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    onChangeText={setHoTen}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={hoTen}
                  />
                </View>
              </Field>

              <Field label="EMAIL" caption="Không thể thay đổi trên ứng dụng">
                <View
                  style={[
                    styles.inputWrap,
                    { ...inputWrapStyle(theme), backgroundColor: theme.muted },
                  ]}>
                  <ThemedText style={[styles.readonlyValue, { color: theme.textSecondary }]}>
                    {fallbackEmail || 'Chưa có email'}
                  </ThemedText>
                </View>
              </Field>

              <Field label="SỐ ĐIỆN THOẠI">
                <View style={[styles.inputWrap, inputWrapStyle(theme)]}>
                  <Phone size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    keyboardType="phone-pad"
                    onChangeText={setSdt}
                    placeholder="0912345678"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={sdt}
                  />
                </View>
              </Field>

              <Field label="NGÀY SINH">
                <View
                  style={[
                    styles.inputWrap,
                    { ...inputWrapStyle(theme), borderColor: dateInvalid ? theme.destructive : theme.input },
                  ]}>
                  <Calendar size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    keyboardType="number-pad"
                    onChangeText={(text) => setNgaySinh(maskDateVn(text))}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={ngaySinh}
                  />
                </View>
                {dateInvalid ? (
                  <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>
                    Ngày không hợp lệ (dd/mm/yyyy)
                  </ThemedText>
                ) : null}
              </Field>

              <Field label="GIỚI TÍNH">
                <View style={styles.chipRow}>
                  {GENDER_OPTIONS.map((option) => {
                    const active = gioiTinh === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        disabled={saving}
                        onPress={() => setGioiTinh(option)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? theme.primary : theme.muted,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}>
                        <ThemedText
                          style={[
                            styles.chipText,
                            { color: active ? theme.primaryForeground : theme.textSecondary },
                          ]}>
                          {option}
                        </ThemedText>
                        </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="ĐỊA CHỈ HIỆN TẠI">
                <View style={[styles.inputWrap, inputWrapStyle(theme)]}>
                  <MapPin size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    onChangeText={setDiaChi}
                    placeholder="Quận 1, TP. Hồ Chí Minh"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={diaChi}
                  />
                </View>
              </Field>

              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                2. ĐỊNH HƯỚNG NGHỀ NGHIỆP &amp; MONG MUỐN
              </ThemedText>

              <Field label="VỊ TRÍ MONG MUỐNG / CHỨC DANH">
                <View style={[styles.inputWrap, inputWrapStyle(theme)]}>
                  <Briefcase size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    onChangeText={setViTri}
                    placeholder="Fullstack .NET Developer"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={viTri}
                  />
                </View>
              </Field>

              <Field label="MỨC LƯƠNG MONG MUỐN (VNĐ)">
                <View style={[styles.inputWrap, inputWrapStyle(theme)]}>
                  <DollarSign size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    editable={!saving}
                    keyboardType="number-pad"
                    onChangeText={(text) => setMucLuong(formatVndInput(text))}
                    placeholder="15.000.000"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={mucLuong}
                  />
                </View>
              </Field>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTimViec }}
                disabled={saving}
                onPress={() => setIsTimViec((value) => !value)}
                style={[
                  styles.toggleRow,
                  { borderColor: theme.border, backgroundColor: theme.muted },
                ]}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isTimViec ? theme.primary : theme.backgroundElement,
                      borderColor: isTimViec ? theme.primary : theme.input,
                    },
                  ]}>
                  {isTimViec ? <Check size={12} color={theme.primaryForeground} /> : null}
                </View>
                <ThemedText style={[styles.toggleText, { color: theme.text }]}>
                  Bật trạng thái sẵn sàng tìm việc (Cho phép Nhà tuyển dụng tìm thấy hồ sơ)
                </ThemedText>
              </Pressable>

              <Field label="GIỚI THIỆU BẢN THÂN & MỤC TIÊU NGHỀ NGHIỆP">
                <TextInput
                  editable={!saving}
                  multiline
                  onChangeText={setGioiThieu}
                  placeholder="Tóm tắt kinh nghiệm làm việc, kỹ năng nổi bật và định hướng phát triển sự nghiệp..."
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.primary}
                  style={[
                    styles.textarea,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.input,
                      color: theme.text,
                    },
                  ]}
                  textAlignVertical="top"
                  value={gioiThieu}
                />
              </Field>

              <View style={[styles.actions, { borderTopColor: `${theme.border}80` }]}>
                <Button
                  disabled={saving}
                  onPress={() => router.back()}
                  style={styles.cancelButton}
                  variant="outline">
                  Hủy bỏ
                </Button>
                <Button
                  disabled={saving || loading}
                  icon={
                    saving ? (
                      <ActivityIndicator size="small" color={theme.primaryForeground} />
                    ) : (
                      <Save size={16} color={theme.primaryForeground} />
                    )
                  }
                  onPress={handleSave}
                  style={styles.saveButton}>
                  {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  caption,
  required,
  children,
}: {
  label: string;
  caption?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>
        {label}
        {required ? (
          <ThemedText style={{ color: theme.destructive }}> *</ThemedText>
        ) : null}
      </ThemedText>
      {children}
      {caption ? (
        <ThemedText style={styles.fieldCaption}>{caption}</ThemedText>
      ) : null}
    </View>
  );
}

function inputWrapStyle(theme: { input: string; backgroundElement: string }) {
  return {
    backgroundColor: theme.backgroundElement,
    borderColor: theme.input,
  };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontFamily: font('semibold'), fontSize: 16 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  demoBadge: { fontFamily: font('semibold'), fontSize: 10, letterSpacing: 0.5 },
  loadingBox: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  loadingText: { fontFamily: font('medium'), fontSize: 13 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { fontFamily: font('medium'), fontSize: 13, lineHeight: 18, flex: 1 },
  errorRetry: { fontFamily: font('semibold'), fontSize: 12 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.2, marginTop: 6 },
  avatarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { fontFamily: font('bold'), fontSize: 20 },
  avatarImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  avatarCopy: { flex: 1, gap: 4 },
  avatarLabel: { fontFamily: font('medium'), fontSize: 13 },
  avatarNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarNote: { fontFamily: font('regular'), fontSize: 12, flex: 1 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldCaption: { fontFamily: font('regular'), fontSize: 11 },
  fieldError: { fontFamily: font('medium'), fontSize: 11 },
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
  readonlyValue: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  textarea: {
    minHeight: 110,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontFamily: font('medium'), fontSize: 13 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { flex: 1, fontFamily: font('medium'), fontSize: 12, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    marginTop: 8,
  },
  cancelButton: { borderRadius: Radius.xl },
  saveButton: { borderRadius: Radius.xl },
});
