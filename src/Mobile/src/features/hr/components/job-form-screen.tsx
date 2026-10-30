import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Plus, Send, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';
import { hrApi } from '@/features/hr/api/hr-api';
import {
  FormField,
  FormSection,
  FormSelect,
  MoneyField,
} from '@/features/hr/components/form-field';
import {
  HrLoadingState,
  HrTopBar,
  HrScreenShell,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { JOB_TRIGGER, SKILL_LEVELS, WORK_MODES } from '@/features/hr/constants';
import type { FilterOption, HrJob, JobFormInput } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';
import { safeBack } from '@/utils/navigation';

type FormState = JobFormInput;

const EMPTY_FORM: FormState = {
  danhMucNgheId: 0,
  tieuDe: '',
  moTaCongViec: '',
  kinhNghiemYeuCau: '',
  yeuCauCongViec: '',
  quyenLoi: '',
  diaDiemLamViec: '',
  phuongThucLamViec: 0,
  luongToiThieu: 0,
  luongToiDa: 0,
  ngayHetHan: '',
  kyNangs: [],
};

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function deadlineDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function JobFormScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; copy?: string }>();
  const jobId = Number(params.id) || 0;
  const isCopy = params.copy === '1';
  const isEdit = jobId > 0 && !isCopy;

  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [editing, setEditing] = useState<HrJob | null>(null);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [skills, setSkills] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(jobId > 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const patch = (partial: Partial<FormState>) => setForm((current) => ({ ...current, ...partial }));

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [categoryList, skillList] = await Promise.all([
          hrApi.listCategories().catch(() => [] as FilterOption[]),
          hrApi.listSkills().catch(() => [] as FilterOption[]),
        ]);
        if (!active) return;
        setCategories(categoryList);
        setSkills(skillList);
      } catch {
        /* Không chặn luồng chính. */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (jobId <= 0) return;
    let active = true;
    void (async () => {
      try {
        const job = await hrApi.getJob(jobId);
        if (!active) return;
        if (!job) {
          setError('Không tìm thấy tin tuyển dụng.');
          return;
        }
        const base: FormState = {
          danhMucNgheId: job.danhMucNgheId,
          tieuDe: job.tieuDe,
          moTaCongViec: job.moTaCongViec,
          kinhNghiemYeuCau: job.kinhNghiemYeuCau,
          yeuCauCongViec: job.yeuCauCongViec,
          quyenLoi: job.quyenLoi,
          diaDiemLamViec: job.diaDiemLamViec,
          phuongThucLamViec: job.phuongThucLamViec,
          luongToiThieu: job.luongToiThieu,
          luongToiDa: job.luongToiDa,
          ngayHetHan: deadlineDate(job.ngayHetHan),
          kyNangs: job.kyNangs,
        };
        setForm(
          isCopy
            ? {
                ...base,
                tieuDe: `${job.tieuDe} (bản sao)`.slice(0, 255),
                ngayHetHan: '',
              }
            : base,
        );
        if (!isCopy) setEditing(job);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Không tải được tin tuyển dụng.');
      } finally {
        if (active && mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isCopy, jobId]);

  const validate = useCallback(
    (submit: boolean): { field: string | null; message: string } => {
      if (!form.tieuDe.trim()) return { field: 'tieuDe', message: 'Tiêu đề không được để trống' };
      if (form.danhMucNgheId <= 0) return { field: 'danhMucNgheId', message: 'Vui lòng chọn danh mục nghề' };
      if (submit && !form.moTaCongViec.trim())
        return { field: 'moTaCongViec', message: 'Cần mô tả công việc trước khi gửi duyệt' };
      if (submit && !form.yeuCauCongViec.trim())
        return { field: 'yeuCauCongViec', message: 'Cần yêu cầu công việc trước khi gửi duyệt' };
      if (submit && !form.diaDiemLamViec.trim())
        return { field: 'diaDiemLamViec', message: 'Cần địa điểm trước khi gửi duyệt' };
      if (form.tieuDe.length > 255 || form.diaDiemLamViec.length > 255)
        return { field: 'tieuDe', message: 'Tiêu đề và địa điểm tối đa 255 ký tự' };
      if (form.moTaCongViec.length > 5000 || form.yeuCauCongViec.length > 5000)
        return { field: 'moTaCongViec', message: 'Mô tả và yêu cầu công việc tối đa 5000 ký tự' };
      if (form.kinhNghiemYeuCau.length > 2000 || form.quyenLoi.length > 2000)
        return { field: 'kinhNghiemYeuCau', message: 'Kinh nghiệm và quyền lợi tối đa 2000 ký tự' };
      if (
        submit &&
        form.ngayHetHan &&
        !/^\d{4}-\d{2}-\d{2}$/.test(form.ngayHetHan)
      ) {
        return { field: 'ngayHetHan', message: 'Ngày hết hạn phải có định dạng YYYY-MM-DD' };
      }
      if (
        submit &&
        form.ngayHetHan &&
        form.ngayHetHan < todayIso()
      ) {
        return { field: 'ngayHetHan', message: 'Ngày hết hạn phải từ hôm nay trở đi' };
      }
      if (form.luongToiThieu < 0 || form.luongToiDa < 0)
        return { field: 'luong', message: 'Lương phải >= 0' };
      if (form.luongToiDa < form.luongToiThieu)
        return { field: 'luong', message: 'Lương tối đa phải >= lương tối thiểu' };
      return { field: null, message: '' };
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (submit: boolean) => {
      if (saving) return;
      const validation = validate(submit);
      if (validation.field) {
        setFieldError(validation.field);
        setError(validation.message);
        return;
      }
      try {
        setSaving(true);
        setError('');
        setFieldError(null);
        setNotice('');

        let savedId = jobId;
        let savedVersion: string | null = editing?.lastModified ?? null;
        let message: string;

        if (isEdit) {
          message = await hrApi.updateJob(jobId, form, editing?.lastModified ?? null);
        } else {
          savedId = await hrApi.createJob(form);
          if (savedId > 0) {
            const fresh = await hrApi.getJob(savedId).catch(() => null);
            savedVersion = fresh?.lastModified ?? null;
            setEditing(fresh);
          }
          message = 'Đã lưu tin tuyển dụng.';
        }

        if (submit && savedId > 0) {
          const fresh = await hrApi.getJob(savedId).catch(() => null);
          savedVersion = fresh?.lastModified ?? savedVersion;
          message = await hrApi.fireJob(savedId, JOB_TRIGGER.GuiDuyet, 'Gửi duyệt từ form đăng tin', savedVersion);
        }

        if (!mountedRef.current) return;
        setNotice(message || (submit ? 'Đã gửi duyệt.' : 'Đã lưu nháp.'));
        setSaving(false);
        // Trở về danh sách sau khi lưu (danh sách tự tải lại khi focus).
        safeBack('/dashboard');
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Không thể lưu');
        setSaving(false);
      }
    },
    [editing, form, isEdit, jobId, saving, validate],
  );

  const categoryOptions = categories.map((row) => ({ value: String(row.id), label: row.name }));
  const selectedSkillIds = new Set(form.kyNangs.map((skill) => skill.kyNangId));
  const skillOptions = [{ value: '', label: '— Chọn kỹ năng —' }].concat(
    skills
      .filter((row) => !selectedSkillIds.has(row.id))
      .map((row) => ({ value: String(row.id), label: row.name })),
  );

  return (
    <HrScreenShell>
      <HrTopBar title={isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Tạo tin tuyển dụng'} />
      {loading ? (
        <HrLoadingState label="Đang tải biểu mẫu…" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.formTitle} type="smallBold">
            {isEdit ? 'Chỉnh sửa tin tuyển dụng' : isCopy ? 'Sao chép tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}
          </ThemedText>
          <ThemedText style={[styles.formDesc, { color: theme.textSecondary }]} type="code">
            Tin Nhân sự cần Người đại diện đồng ý trước khi hệ thống lọc. Tin Người đại diện đi thẳng
            đến bộ lọc. OK thì công khai; vi phạm/nghi vấn thì Admin quyết định.
          </ThemedText>

          {notice ? <NoticeBar kind="success" message={notice} /> : null}
          {error ? <NoticeBar kind="error" message={error} /> : null}

          <FormSection title="Thông tin chính">
            <FormField
              label="Tiêu đề"
              required
              value={form.tieuDe}
              maxLength={255}
              onChangeText={(value) => patch({ tieuDe: value })}
              placeholder="VD: Senior Frontend Developer"
              invalid={fieldError === 'tieuDe'}
            />
            <FormSelect
              label="Danh mục nghề"
              required
              value={String(form.danhMucNgheId)}
              placeholder="-- Chọn danh mục nghề --"
              options={categoryOptions}
              onSelect={(value) => patch({ danhMucNgheId: Number(value) })}
              invalid={fieldError === 'danhMucNgheId'}
            />
            <FormField
              label="Địa điểm làm việc"
              required
              value={form.diaDiemLamViec}
              maxLength={255}
              onChangeText={(value) => patch({ diaDiemLamViec: value })}
              placeholder="VD: Hà Nội, TP. Hồ Chí Minh"
              invalid={fieldError === 'diaDiemLamViec'}
            />
            <FormSelect
              label="Phương thức làm việc"
              value={String(form.phuongThucLamViec)}
              placeholder="Onsite"
              options={WORK_MODES.map((mode) => ({ value: String(mode.value), label: mode.label }))}
              onSelect={(value) => patch({ phuongThucLamViec: Number(value) })}
            />
            <FormField
              label="Ngày hết hạn"
              value={form.ngayHetHan}
              onChangeText={(value) => patch({ ngayHetHan: value })}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              invalid={fieldError === 'ngayHetHan'}
              errorText={
                fieldError === 'ngayHetHan' ? 'Ngày hết hạn phải từ hôm nay trở đi' : undefined
              }
            />
            <View style={styles.moneyRow}>
              <View style={styles.moneyCell}>
                <MoneyField
                  label="Lương tối thiểu"
                  value={form.luongToiThieu}
                  onChange={(value) => patch({ luongToiThieu: value })}
                  invalid={fieldError === 'luong'}
                />
              </View>
              <View style={styles.moneyCell}>
                <MoneyField
                  label="Lương tối đa"
                  value={form.luongToiDa}
                  onChange={(value) => patch({ luongToiDa: value })}
                  invalid={fieldError === 'luong'}
                  errorText={
                    fieldError === 'luong'
                      ? form.luongToiDa < form.luongToiThieu
                        ? 'Lương tối đa phải >= lương tối thiểu'
                        : 'Lương phải >= 0'
                      : undefined
                  }
                />
              </View>
            </View>
          </FormSection>

          <FormSection title="Nội dung tin">
            <FormField
              label="Mô tả công việc"
              required
              multiline
              value={form.moTaCongViec}
              maxLength={5000}
              onChangeText={(value) => patch({ moTaCongViec: value })}
              placeholder="Mô tả trách nhiệm, công việc hằng ngày..."
              invalid={fieldError === 'moTaCongViec'}
            />
            <FormField
              label="Yêu cầu công việc"
              required
              multiline
              value={form.yeuCauCongViec}
              maxLength={5000}
              onChangeText={(value) => patch({ yeuCauCongViec: value })}
              placeholder="Yêu cầu kỹ năng, bằng cấp..."
              invalid={fieldError === 'yeuCauCongViec'}
            />
            <FormField
              label="Kinh nghiệm yêu cầu"
              multiline
              value={form.kinhNghiemYeuCau}
              maxLength={2000}
              onChangeText={(value) => patch({ kinhNghiemYeuCau: value })}
              placeholder="VD: 2+ năm kinh nghiệm React..."
              invalid={fieldError === 'kinhNghiemYeuCau'}
            />
            <FormField
              label="Quyền lợi"
              multiline
              value={form.quyenLoi}
              maxLength={2000}
              onChangeText={(value) => patch({ quyenLoi: value })}
              placeholder="VD: Bảo hiểm, thưởng tháng 13..."
            />
          </FormSection>

          <FormSection title="Kỹ năng yêu cầu">
            <FormSelect
              label="Thêm kỹ năng"
              value=""
              placeholder="— Chọn kỹ năng —"
              options={skillOptions}
              onSelect={(value) => {
                if (!value) return;
                const id = Number(value);
                patch({
                  kyNangs: [...form.kyNangs, { kyNangId: id, tenKyNang: skills.find((row) => row.id === id)?.name ?? '', mucDoYeuCau: 0 }],
                });
              }}
            />
            {form.kyNangs.length === 0 ? (
              <ThemedText style={{ color: theme.textSecondary }} type="code">
                Chưa có kỹ năng nào — tuyển dụng chung vẫn được.
              </ThemedText>
            ) : (
              <View style={styles.skillList}>
                {form.kyNangs.map((skill) => (
                  <View
                    key={skill.kyNangId}
                    style={[styles.skillRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <ThemedText style={styles.skillName} type="small" numberOfLines={1}>
                      {skill.tenKyNang || `Kỹ năng #${skill.kyNangId}`}
                    </ThemedText>
                    <View style={styles.skillLevelWrap}>
                      <FormSelect
                        label=""
                        value={String(skill.mucDoYeuCau)}
                        placeholder="Mức độ"
                        options={SKILL_LEVELS.map((label, index) => ({
                          value: String(index),
                          label,
                        }))}
                        onSelect={(value) =>
                          patch({
                            kyNangs: form.kyNangs.map((row) =>
                              row.kyNangId === skill.kyNangId
                                ? { ...row, mucDoYeuCau: Number(value) }
                                : row,
                            ),
                          })
                        }
                      />
                    </View>
                    <Button
                      variant="ghost"
                      size="icon"
                      accessibilityLabel={`Bỏ kỹ năng ${skill.tenKyNang}`}
                      onPress={() =>
                        patch({ kyNangs: form.kyNangs.filter((row) => row.kyNangId !== skill.kyNangId) })
                      }
                      icon={<X size={15} color={theme.destructive} />}
                    />
                  </View>
                ))}
              </View>
            )}
          </FormSection>

          <View style={styles.actions}>
            <Button
              variant="outline"
              pill
              disabled={saving}
              onPress={() => void handleSubmit(false)}
              icon={<Plus size={15} color={theme.text} />}>
              Lưu nháp
            </Button>
            <Button
              pill
              disabled={saving}
              onPress={() => void handleSubmit(true)}
              icon={
                saving ? undefined : <Send size={15} color={theme.primaryForeground} />
              }>
              {saving ? 'Đang lưu...' : 'Lưu & gửi duyệt'}
            </Button>
          </View>
        </ScrollView>
      )}
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  formTitle: { fontSize: 16 },
  formDesc: { fontSize: 11, lineHeight: 16 },
  moneyRow: { flexDirection: 'row', gap: 12 },
  moneyCell: { flex: 1 },
  skillList: { gap: 8 },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skillName: { flexShrink: 1, minWidth: 90 },
  skillLevelWrap: { width: 148 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
});
