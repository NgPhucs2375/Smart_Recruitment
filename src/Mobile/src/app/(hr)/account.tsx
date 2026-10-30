import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { hrCompanyApi, hrProfileApi, type RecruiterProfile } from '@/features/hr/api/hr-api';
import type { CompanyMine } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';

const ROLE_LABELS: Record<string, string> = {
  NGUOI_DAI_DIEN: 'Người đại diện',
  NHAN_SU: 'Nhân sự',
};

const PHONE_PATTERN = /^\+?[0-9\s.-]{8,20}$/;

type Notice = { type: 'success' | 'error'; message: string } | null;

function reasonMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export default function HRAccountScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [company, setCompany] = useState<CompanyMine | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ hoTen: '', sdt: '', chucVu: '' });


  const load = useCallback(() => {
    return Promise.allSettled([hrProfileApi.getMine(), hrCompanyApi.getMine()]).then(
      ([profileResult, companyResult]) => {
        if (profileResult.status === 'fulfilled') {
          const nextProfile = profileResult.value;
          setProfile(nextProfile);
          setForm({
            hoTen: nextProfile?.hoTen ?? '',
            sdt: nextProfile?.sdt ?? '',
            chucVu: nextProfile?.chucVu ?? '',
          });
          setLoadError('');
        } else {
          setLoadError(reasonMessage(profileResult.reason, 'Không tải được hồ sơ nhà tuyển dụng.'));
        }
        if (companyResult.status === 'fulfilled') {
          setCompany(companyResult.value);
        }
        setCompanyLoading(false);
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError('');
    void load();
  };

  const validate = (): string | null => {
    if (!form.hoTen.trim()) return 'Họ tên không được để trống.';
    if (form.sdt.trim() && !PHONE_PATTERN.test(form.sdt.trim()))
      return 'Số điện thoại không hợp lệ.';
    return null;
  };

  const openEdit = () => {
    if (!profile) return;
    setNotice(null);
    setForm({ hoTen: profile.hoTen, sdt: profile.sdt, chucVu: profile.chucVu });
    setEditing(true);
  };

  const cancelEdit = () => {
    if (profile) setForm({ hoTen: profile.hoTen, sdt: profile.sdt, chucVu: profile.chucVu });
    setEditing(false);
    setNotice(null);
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      setNotice({ type: 'error', message: error });
      return;
    }
    const payload = {
      hoTen: form.hoTen.trim(),
      sdt: form.sdt.trim(),
      chucVu: form.chucVu.trim(),
    };

    void (async () => {
      setSaving(true);
      setNotice(null);
      try {
        const message = editing
          ? await hrProfileApi.updateMine(payload)
          : await hrProfileApi.createSelf(payload);
        setEditing(false);
        setCreating(false);
        setNotice({ type: 'success', message });
        await load();
      } catch (reason) {
        setNotice({ type: 'error', message: reasonMessage(reason, 'Không thể lưu hồ sơ.') });
      } finally {
        setSaving(false);
      }
    })();
  };

  const roleBadges = (user?.roles ?? [])
    .map((role) => ROLE_LABELS[role.toUpperCase()] ?? role)
    .filter(Boolean);

  const initials = (profile?.hoTen || user?.fullname || user?.userName || 'NTD')
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.title}>Tài khoản</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Quản lý hồ sơ cá nhân, doanh nghiệp và bảo mật.
        </ThemedText>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          THÔNG TIN TÀI KHOẢN
        </ThemedText>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <UserRound size={16} color={theme.textSecondary} />
            <ThemedText style={styles.infoValue} numberOfLines={2}>
              {user?.fullname || user?.userName || 'Nhà tuyển dụng'}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Mail size={16} color={theme.textSecondary} />
            <ThemedText style={styles.infoValue} numberOfLines={2}>{user?.email ?? ''}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ShieldCheck size={16} color={theme.textSecondary} />
            <View style={styles.badgeRow}>
              {roleBadges.length > 0 ? (
                roleBadges.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))
              ) : (
                <ThemedText style={styles.infoValue} numberOfLines={2}>Nhà tuyển dụng</ThemedText>
              )}
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          HỒ SƠ NHÀ TUYỂN DỤNG
        </ThemedText>

        {notice ? (
          <View
            style={[
              styles.notice,
              notice.type === 'error'
                ? { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` }
                : { borderColor: `${theme.primary}4D`, backgroundColor: `${theme.primary}0D` },
            ]}>
            <ThemedText
              style={[
                styles.noticeText,
                { color: notice.type === 'error' ? theme.destructive : theme.primary },
              ]}>
              {notice.message}
            </ThemedText>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.primary} size="large" />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Đang tải hồ sơ nhà tuyển dụng...
            </ThemedText>
          </View>
        ) : loadError ? (
          <View
            style={[
              styles.notice,
              { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` },
            ]}>
            <ThemedText style={[styles.noticeText, { color: theme.destructive }]}>
              {`Không tải được hồ sơ: ${loadError}`}
            </ThemedText>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={handleRetry}>
              <ThemedText style={[styles.retryText, { color: theme.destructive }]}>Thử lại</ThemedText>
            </Pressable>
          </View>
        ) : profile && !editing ? (
          <Card style={styles.profileCard}>
            <View style={styles.profileHead}>
              <View style={[styles.initialsBox, { backgroundColor: `${theme.primary}1A` }]}>
                <ThemedText style={[styles.initialsText, { color: theme.primary }]}>
                  {initials}
                </ThemedText>
              </View>
              <View style={styles.profileCopy}>
                <ThemedText style={styles.profileName}>{profile.hoTen || '—'}</ThemedText>
                <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>
                  {profile.chucVu || 'Chưa cập nhật chức vụ'}
                </ThemedText>
              </View>
              <Button
                icon={<Pencil size={14} color={theme.primaryForeground} />}
                onPress={openEdit}
                size="sm">
                Chỉnh sửa
              </Button>
            </View>
            <View style={styles.profileMeta}>
              {profile.sdt ? (
                <ThemedText style={[styles.profileMetaText, { color: theme.textSecondary }]}>
                  {profile.sdt}
                </ThemedText>
              ) : null}
              <ThemedText style={[styles.profileMetaText, { color: theme.textSecondary }]}>
                {user?.email ?? ''}
              </ThemedText>
              <ThemedText style={[styles.profileMetaText, { color: theme.textSecondary }]}>
                {company?.tenDoanhNghiep || `Doanh nghiệp #${profile.doanhNghiepId}`}
              </ThemedText>
            </View>
          </Card>
        ) : profile && editing ? (
          <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={styles.formTitle}>Chỉnh sửa hồ sơ</ThemedText>
            <Field label="HỌ TÊN" required>
              <TextInputBox
                editable={!saving}
                onChangeText={(text) => setForm((prev) => ({ ...prev, hoTen: text }))}
                placeholder="VD: Nguyễn Văn A"
                value={form.hoTen}
              />
            </Field>
            <Field label="CHỨC VỤ">
              <TextInputBox
                editable={!saving}
                onChangeText={(text) => setForm((prev) => ({ ...prev, chucVu: text }))}
                placeholder="VD: HR Manager"
                value={form.chucVu}
              />
            </Field>
            <Field label="SỐ ĐIỆN THOẠI">
              <TextInputBox
                editable={!saving}
                keyboardType="phone-pad"
                onChangeText={(text) => setForm((prev) => ({ ...prev, sdt: text }))}
                placeholder="VD: 0901234567"
                value={form.sdt}
              />
            </Field>
            <Field label="DOANH NGHIỆP" caption="Chỉnh sửa tại mục Doanh nghiệp">
              <View style={[styles.inputWrap, { backgroundColor: theme.muted, borderColor: theme.input }]}>
                <ThemedText style={[styles.inputReadonly, { color: theme.textSecondary }]}>
                  {company?.tenDoanhNghiep || `Doanh nghiệp #${profile.doanhNghiepId}`}
                </ThemedText>
              </View>
            </Field>
            <View style={styles.formActions}>
              <Button disabled={saving} onPress={cancelEdit} style={styles.formButton} variant="outline">
                Hủy
              </Button>
              <Button
                disabled={saving}
                icon={saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined}
                onPress={handleSubmit}
                style={styles.formButton}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </View>
          </View>
        ) : profile === null && company ? (
          creating ? (
            <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.createHead}>
                <View style={[styles.createIcon, { backgroundColor: `${theme.primary}1A` }]}>
                  <Plus size={18} color={theme.primary} />
                </View>
                <View style={styles.profileCopy}>
                  <ThemedText style={styles.formTitle}>Tạo hồ sơ nhà tuyển dụng</ThemedText>
                  <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>
                    {`Doanh nghiệp của bạn: ${company.tenDoanhNghiep || '—'}`}
                  </ThemedText>
                </View>
              </View>
              <Field label="HỌ TÊN" required>
                <TextInputBox
                  editable={!saving}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, hoTen: text }))}
                  placeholder="VD: Nguyễn Văn A"
                  value={form.hoTen}
                />
              </Field>
              <Field label="CHỨC VỤ">
                <TextInputBox
                  editable={!saving}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, chucVu: text }))}
                  placeholder="VD: Giám đốc nhân sự"
                  value={form.chucVu}
                />
              </Field>
              <Field label="SỐ ĐIỆN THOẠI">
                <TextInputBox
                  editable={!saving}
                  keyboardType="phone-pad"
                  onChangeText={(text) => setForm((prev) => ({ ...prev, sdt: text }))}
                  placeholder="VD: 0901234567"
                  value={form.sdt}
                />
              </Field>
              <View style={styles.formActions}>
                <Button
                  disabled={saving}
                  onPress={() => setCreating(false)}
                  style={styles.formButton}
                  variant="outline">
                  Hủy
                </Button>
                <Button
                  disabled={saving}
                  icon={saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined}
                  onPress={handleSubmit}
                  style={styles.formButton}>
                  {saving ? 'Đang tạo...' : 'Tạo hồ sơ'}
                </Button>
              </View>
            </View>
          ) : (
            <Card style={styles.infoCard}>
              <ThemedText style={styles.emptyTitle}>Chưa có hồ sơ</ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Tài khoản của bạn chưa gắn hồ sơ nhà tuyển dụng. Tạo ngay để hiển thị thông tin khi
                tuyển dụng.
              </ThemedText>
              <View style={styles.emptyActions}>
                <Button
                  icon={<Plus size={14} color={theme.primaryForeground} />}
                  onPress={() => {
                    setNotice(null);
                    setForm({ hoTen: '', sdt: '', chucVu: '' });
                    setCreating(true);
                  }}
                  size="sm">
                  Tạo hồ sơ
                </Button>
              </View>
            </Card>
          )
        ) : profile === null && !companyLoading ? (
          <Card style={styles.infoCard}>
            <ThemedText style={styles.emptyTitle}>Chưa có doanh nghiệp</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tạo thông tin doanh nghiệp trước khi tạo hồ sơ nhà tuyển dụng.
            </ThemedText>
            <View style={styles.emptyActions}>
              <Button
                icon={<Building2 size={14} color={theme.primaryForeground} />}
                onPress={() => router.push('/hr/company')}
                size="sm">
                Mở doanh nghiệp
              </Button>
            </View>
          </Card>
        ) : null}

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DOANH NGHIỆP
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/hr/company')}
          style={({ pressed }) => [
            styles.companyRow,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <View style={[styles.companyIcon, { backgroundColor: `${theme.primary}1A` }]}>
            <Building2 size={18} color={theme.primary} />
          </View>
          <View style={styles.profileCopy}>
            <ThemedText style={styles.companyName} numberOfLines={1}>
              {companyLoading
                ? 'Đang tải doanh nghiệp...'
                : company?.tenDoanhNghiep || 'Chưa có doanh nghiệp'}
            </ThemedText>
            <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>
              Xem và chỉnh sửa thông tin doanh nghiệp
            </ThemedText>
          </View>
          <ArrowRight size={16} color={theme.textSecondary} />
        </Pressable>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>CÀI ĐẶT</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/hr/settings')}
          style={({ pressed }) => [
            styles.companyRow,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <View style={[styles.companyIcon, { backgroundColor: `${theme.primary}1A` }]}>
            <Settings size={18} color={theme.primary} />
          </View>
          <View style={styles.profileCopy}>
            <ThemedText style={styles.companyName}>Cài đặt tài khoản</ThemedText>
            <ThemedText style={[styles.profileRole, { color: theme.textSecondary }]}>Bảo mật, giao diện và đăng xuất</ThemedText>
          </View>
          <ArrowRight size={16} color={theme.textSecondary} />
        </Pressable>

        <Button
          variant="outline"
          onPress={() => void signOut()}
          icon={<LogOut size={16} color={theme.destructive} />}
          style={styles.logoutButton}>
          <ThemedText style={[styles.logoutText, { color: theme.destructive }]}>Đăng xuất</ThemedText>
        </Button>
      </ScrollView>
    </View>
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
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>
        {label}
        {required ? <ThemedText style={{ color: '#dc2626' }}> *</ThemedText> : null}
      </ThemedText>
      {children}
      {caption ? <ThemedText style={styles.fieldCaption}>{caption}</ThemedText> : null}
    </View>
  );
}

function TextInputBox({
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  keyboardType?: 'phone-pad' | 'default';
}) {
  const theme = useTheme();
  return (
    <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.primary}
        style={[styles.input, { color: theme.text }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 38 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, marginTop: -6 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.4, marginTop: 8 },
  infoCard: { padding: 16, gap: 12, borderRadius: Radius.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { fontFamily: font('medium'), fontSize: 14, flexShrink: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  loadingBox: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  loadingText: { fontFamily: font('medium'), fontSize: 13 },
  notice: { borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  noticeText: { fontFamily: font('medium'), fontSize: 12, lineHeight: 18 },
  retryText: { fontFamily: font('semibold'), fontSize: 12 },
  profileCard: { padding: 16, gap: 14, borderRadius: Radius.xl },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  initialsBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontFamily: font('bold'), fontSize: 16 },
  profileCopy: { flex: 1, minWidth: 0, gap: 2 },
  profileName: { fontFamily: font('semibold'), fontSize: 16, lineHeight: 22 },
  profileRole: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17 },
  profileMeta: { gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000022', paddingTop: 10 },
  profileMetaText: { fontFamily: font('regular'), fontSize: 13, lineHeight: 18, flexShrink: 1 },
  formCard: { borderWidth: 1, borderRadius: Radius['2xl'], padding: 14, gap: 12 },
  formTitle: { fontFamily: font('semibold'), fontSize: 14 },
  createHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: font('semibold'), fontSize: 15 },
  emptyText: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
  emptyActions: { flexDirection: 'row', gap: 8 },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: { fontFamily: font('semibold'), fontSize: 14, lineHeight: 20, flexShrink: 1 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldCaption: { fontFamily: font('regular'), fontSize: 11 },
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
  inputReadonly: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  formButton: { borderRadius: Radius.xl },
  logoutButton: { marginTop: 8, borderRadius: Radius.xl, alignSelf: 'flex-start' },
  logoutText: { fontFamily: font('semibold'), fontSize: 14 },
});
