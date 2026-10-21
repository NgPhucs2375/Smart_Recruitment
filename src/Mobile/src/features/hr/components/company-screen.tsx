import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Building2, Lock, Save } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { hrCompanyApi } from '@/features/hr/api/hr-api';
import { FormField, FormSection } from '@/features/hr/components/form-field';
import {
  HrErrorState,
  HrLoadingState,
  HrScreenShell,
  HrTopBar,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { useHrRole } from '@/features/hr/hooks/use-hr-role';
import type { CompanyMine } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';

const EMPTY: CompanyMine = {
  id: 0,
  tenDoanhNghiep: '',
  moTa: '',
  website: '',
  diaChi: '',
  logoUrl: '',
  maSoThue: '',
  linhVucHoatDong: '',
  quyMoNhanSu: '',
};

export function CompanyScreen() {
  const theme = useTheme();
  const { isNdd } = useHrRole();

  const [company, setCompany] = useState<CompanyMine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await hrCompanyApi.getMine();
      if (!mountedRef.current) return;
      setCompany(result ?? EMPTY);
      if (!result) setError('Chưa tìm thấy hồ sơ doanh nghiệp của bạn.');
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không tải được hồ sơ doanh nghiệp.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const patch = (partial: Partial<CompanyMine>) =>
    setCompany((current) => (current ? { ...current, ...partial } : current));

  const handleSave = async () => {
    if (!company || saving || !isNdd) return;
    if (!company.tenDoanhNghiep.trim()) {
      setFieldError('tenDoanhNghiep');
      setError('Tên doanh nghiệp không được để trống.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setNotice('');
      setFieldError(null);
      const message = await hrCompanyApi.update(company);
      if (!mountedRef.current) return;
      setNotice(message || 'Đã cập nhật hồ sơ doanh nghiệp.');
      await load();
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật.');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <HrScreenShell>
      <HrTopBar
        title="Hồ sơ doanh nghiệp"
        right={
          isNdd && company ? (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Lưu hồ sơ"
              disabled={saving}
              onPress={() => void handleSave()}
              icon={<Save size={17} color={theme.primary} />}
            />
          ) : null
        }
      />
      {loading ? (
        <HrLoadingState label="Đang tải hồ sơ…" />
      ) : !company ? (
        <HrErrorState message={error || 'Không tải được hồ sơ.'} onRetry={() => void load()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headBlock}>
            <View style={[styles.headIcon, { backgroundColor: `${theme.primary}14` }]}>
              <Building2 size={18} color={theme.primary} />
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.pageTitle}>{company.tenDoanhNghiep || 'Doanh nghiệp của bạn'}</ThemedText>
              <ThemedText style={[styles.pageDesc, { color: theme.textSecondary }]} type="small">
                {isNdd
                  ? 'Cập nhật thông tin hiển thị trên trang giới thiệu doanh nghiệp.'
                  : 'Chỉ Người đại diện mới chỉnh sửa hồ sơ — bạn đang xem ở chế độ chỉ đọc.'}
              </ThemedText>
            </View>
          </View>

          {!isNdd ? (
            <View style={[styles.lockBar, { backgroundColor: theme.backgroundSelected }]}>
              <Lock size={13} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary }} type="code">
                Chế độ chỉ đọc (vai trò Nhân sự)
              </ThemedText>
            </View>
          ) : null}

          {notice ? <NoticeBar kind="success" message={notice} /> : null}
          {error ? <NoticeBar kind="error" message={error} /> : null}

          <FormSection title="Thông tin doanh nghiệp">
            <FormField
              label="Tên doanh nghiệp"
              required
              value={company.tenDoanhNghiep}
              onChangeText={(value) => patch({ tenDoanhNghiep: value })}
              placeholder="Công ty TNHH ABC"
              editable={isNdd}
              invalid={fieldError === 'tenDoanhNghiep'}
            />
            <FormField
              label="Mã số thuế"
              value={company.maSoThue}
              onChangeText={(value) => patch({ maSoThue: value })}
              placeholder="0123456789"
              keyboardType="number-pad"
              editable={isNdd}
            />
            <FormField
              label="Lĩnh vực hoạt động"
              value={company.linhVucHoatDong}
              onChangeText={(value) => patch({ linhVucHoatDong: value })}
              placeholder="Công nghệ thông tin, Thương mại điện tử..."
              editable={isNdd}
            />
            <FormField
              label="Quy mô nhân sự"
              value={company.quyMoNhanSu}
              onChangeText={(value) => patch({ quyMoNhanSu: value })}
              placeholder="11-50 nhân viên"
              editable={isNdd}
            />
          </FormSection>

          <FormSection title="Liên hệ">
            <FormField
              label="Website"
              value={company.website}
              onChangeText={(value) => patch({ website: value })}
              placeholder="https://congty.vn"
              autoCapitalize="none"
              keyboardType="url"
              editable={isNdd}
            />
            <FormField
              label="Địa chỉ"
              multiline
              value={company.diaChi}
              onChangeText={(value) => patch({ diaChi: value })}
              placeholder="Số 1, Đường ABC, Quận 1, TP. Hồ Chí Minh"
              editable={isNdd}
            />
            <FormField
              label="Logo (URL)"
              value={company.logoUrl}
              onChangeText={(value) => patch({ logoUrl: value })}
              placeholder="https://..."
              autoCapitalize="none"
              editable={isNdd}
            />
          </FormSection>

          <FormSection title="Giới thiệu">
            <FormField
              label="Mô tả"
              multiline
              value={company.moTa}
              onChangeText={(value) => patch({ moTa: value })}
              placeholder="Giới thiệu về doanh nghiệp, văn hóa, thành tựu..."
              editable={isNdd}
            />
          </FormSection>

          {isNdd ? (
            <View style={styles.actions}>
              <Button
                pill
                disabled={saving}
                onPress={() => void handleSave()}
                icon={saving ? undefined : <Save size={15} color={theme.primaryForeground} />}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button variant="outline" pill onPress={() => router.push('/(hr)')}>
                Về tổng quan
              </Button>
            </View>
          ) : null}
        </ScrollView>
      )}
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 48 },
  headBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: font('semibold'), fontSize: 17, letterSpacing: -0.3 },
  pageDesc: { fontSize: 12, lineHeight: 17 },
  lockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
