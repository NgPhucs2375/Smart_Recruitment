import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  CheckCircle2,
  Copy,
  Eye,
  Lock,
  Pause,
  Pencil,
  Play,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { hrApi } from '@/features/hr/api/hr-api';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import {
  Chip,
  HrEmptyState,
  HrErrorState,
  HrLoadingState,
  JobStatusBadge,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { JOB_STATUS_FILTERS, JOB_TRIGGER, SKILL_LEVELS } from '@/features/hr/constants';
import { useHrRole } from '@/features/hr/hooks/use-hr-role';
import type { HrJob } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 20;

function fmtMoney(value: number): string {
  if (!value && value !== 0) return '—';
  return `${value.toLocaleString('vi-VN')}đ`;
}

function fmtDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

export function JobsListScreen() {
  const theme = useTheme();
  const { isNdd } = useHrRole();
  const { dialog, confirm, prompt } = useHrActionDialog();

  const [items, setItems] = useState<HrJob[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firingId, setFiringId] = useState<number | null>(null);
  const [detail, setDetail] = useState<HrJob | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (targetPage: number, silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const result = await hrApi.listJobs({
          page: targetPage,
          pageSize: PAGE_SIZE,
          keyword: search,
          status: statusFilter,
        });
        if (!mountedRef.current) return;
        setItems(result.items);
        setTotalPages(result.totalPages);
        setPage(targetPage);
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Lỗi tải danh sách tin.');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, statusFilter],
  );

  // Debounce tìm kiếm 250ms — đúng Web (chỉ chạy khi đổi keyword/filter).
  useEffect(() => {
    const timer = setTimeout(() => void fetchPage(1), 250);
    return () => clearTimeout(timer);
  }, [fetchPage]);

  // Tải lại khi trở về từ màn tạo/sửa (router.push → back không remount).
  const focusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnceRef.current) {
        focusedOnceRef.current = true;
        return;
      }
      void fetchPage(page, true);
    }, [fetchPage, page]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchPage(page, true);
  };

  async function handleFire(
    item: HrJob,
    trigger: number,
    label: string,
    confirmMsg?: string,
    needReason = false,
  ) {
    if (firingId !== null) return;
    let note = `${label} từ trang quản lý tin`;
    if (needReason) {
      const reason = await prompt({
        title: 'Lý do từ chối',
        description: 'Giúp nhân sự biết nội dung cần sửa.',
        confirmLabel: 'Từ chối',
        destructive: true,
      });
      if (!reason?.trim()) return;
      note = reason.trim();
    }
    const confirmed = await confirm({
      title: `${label} tin?`,
      description: confirmMsg ?? `${label} tin "${item.tieuDe}"?`,
      confirmLabel: label,
      destructive: trigger === JOB_TRIGGER.NguoiDaiDienTuChoi || trigger === JOB_TRIGGER.DongTin,
    });
    if (!confirmed) return;

    try {
      setFiringId(item.id);
      setError('');
      setSuccess('');
      const message = await hrApi.fireJob(item.id, trigger, note, item.lastModified);
      if (!mountedRef.current) return;
      setSuccess(message);
      setDetail(null);
      await fetchPage(page, true);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật trạng thái');
    } finally {
      if (mountedRef.current) setFiringId(null);
    }
  }

  async function handleDelete(item: HrJob) {
    const confirmed = await confirm({
      title: 'Xóa tin tuyển dụng?',
      description: `Xóa tin "${item.tieuDe}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      setError('');
      setSuccess('');
      await hrApi.deleteJob(item.id, item.lastModified);
      if (!mountedRef.current) return;
      setSuccess('Xóa thành công.');
      await fetchPage(page, true);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể xóa');
    }
  }

  const openCreate = () => router.push('/hr/jobs-form');
  const openEdit = (item: HrJob) => router.push(`/hr/jobs-form?id=${item.id}`);
  const openCopy = (item: HrJob) => router.push(`/hr/jobs-form?id=${item.id}&copy=1`);

  return (
    <View style={styles.flex}>
      {dialog}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        <View style={styles.headRow}>
          <ThemedText style={[styles.pageTitle, { color: theme.textSecondary }]} type="smallBold">
            QUẢN LÝ TIN TUYỂN DỤNG
          </ThemedText>
          {isNdd ? (
            <Chip
              label="Chờ tôi duyệt"
              active={statusFilter === 'ChoNguoiDaiDienDuyet'}
              onPress={() => setStatusFilter('ChoNguoiDaiDienDuyet')}
            />
          ) : null}
        </View>

        <Button pill onPress={openCreate} icon={<Send size={15} color={theme.primaryForeground} />}>
          Tạo tin tuyển dụng
        </Button>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {JOB_STATUS_FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={statusFilter === option.value}
              onPress={() => setStatusFilter(option.value)}
            />
          ))}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
          <Search size={15} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm tin..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {success ? <NoticeBar kind="success" message={success} /> : null}
        {error ? <NoticeBar kind="error" message={error} /> : null}

        {loading ? (
          <HrLoadingState />
        ) : error && items.length === 0 ? (
          <HrErrorState message={error} onRetry={() => void fetchPage(1)} />
        ) : items.length === 0 ? (
          <HrEmptyState
            title={search || statusFilter !== 'all' ? 'Không tìm thấy tin tuyển dụng' : 'Chưa có tin tuyển dụng'}
            description={
              search || statusFilter !== 'all'
                ? 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.'
                : 'Bắt đầu đăng tin tuyển dụng đầu tiên để thu hút và tiếp cận ứng viên.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <Button pill onPress={openCreate} style={styles.emptyAction}>
                  Tạo tin tuyển dụng
                </Button>
              ) : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const busy = firingId === item.id;
              const statusKey = item.trangThai;
              const canEditDraft = ['Nhap', '0', 'TuChoi', '7'].includes(statusKey);
              const canGuiDuyet = canEditDraft || ['ChoDuyetHeThong', '1'].includes(statusKey);
              const isDangTuyen = statusKey === 'DangTuyen' || statusKey === '3';
              const isTamDung = statusKey === 'TamDung' || statusKey === '4';
              const choNdd = isNdd && (statusKey === 'ChoNguoiDaiDienDuyet' || statusKey === '9');

              return (
                <View
                  key={item.id}
                  style={[styles.jobCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.jobHead}>
                    <ThemedText style={styles.jobTitle} numberOfLines={2} type="smallBold">
                      {item.tieuDe}
                    </ThemedText>
                    <JobStatusBadge value={item.trangThai} />
                  </View>

                  {statusKey === 'TuChoi' || statusKey === '7' ? (
                    <ThemedText style={{ color: theme.destructive }} type="code">
                      {item.ghiChuKiemDuyet || 'Bị từ chối.'}
                    </ThemedText>
                  ) : null}

                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    {[item.diaDiemLamViec, `${fmtMoney(item.luongToiThieu)} — ${fmtMoney(item.luongToiDa)}`, item.ngayHetHan ? `Hết hạn: ${fmtDate(item.ngayHetHan)}` : '']
                      .filter(Boolean)
                      .join(' • ')}
                  </ThemedText>

                  <View style={styles.jobActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onPress={() => setDetail(item)}
                      icon={<Eye size={14} color={theme.text} />}>
                      {choNdd ? 'Xem và duyệt' : 'Chi tiết'}
                    </Button>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push(
                          `/hr/job-applicants?id=${item.id}&title=${encodeURIComponent(item.tieuDe)}`,
                        )
                      }
                      style={[styles.applicantsPill, { borderColor: theme.border }]}>
                      <Users size={14} color={theme.text} />
                      <ThemedText type="small">{item.soLuongUngVien} ứng viên</ThemedText>
                    </Pressable>

                    {canGuiDuyet ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onPress={() => void handleFire(item, JOB_TRIGGER.GuiDuyet, 'Gửi duyệt')}
                        icon={<Send size={14} color={theme.primaryForeground} />}>
                        Gửi duyệt
                      </Button>
                    ) : null}

                    {isDangTuyen ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() => void handleFire(item, JOB_TRIGGER.TamDungTin, 'Tạm dừng')}
                        icon={<Pause size={14} color={theme.text} />}>
                        Tạm dừng
                      </Button>
                    ) : null}

                    {isTamDung ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() =>
                          void handleFire(
                            item,
                            JOB_TRIGGER.MoLaiTin,
                            'Gửi duyệt mở lại',
                            'Tin Nhân sự cần Người đại diện đồng ý, sau đó hệ thống lọc: OK thì công khai, vi phạm thì chuyển Admin.',
                          )
                        }
                        icon={<Play size={14} color={theme.text} />}>
                        Gửi duyệt mở lại
                      </Button>
                    ) : null}

                    {isDangTuyen || isTamDung ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() =>
                          void handleFire(
                            item,
                            JOB_TRIGGER.DongTin,
                            'Đóng tin',
                            `Đóng tin "${item.tieuDe}"? Tin đã đóng không mở lại được.`,
                          )
                        }
                        icon={<Lock size={14} color={theme.text} />}>
                        Đóng tin
                      </Button>
                    ) : null}

                    {canEditDraft || isTamDung ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() => openEdit(item)}
                        icon={<Pencil size={14} color={theme.text} />}>
                        Sửa
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onPress={() => openCopy(item)}
                      icon={<Copy size={14} color={theme.text} />}>
                      Sao chép
                    </Button>

                    {canEditDraft && item.soLuongUngVien === 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onPress={() => void handleDelete(item)}
                        icon={<Trash2 size={14} color={theme.destructive} />}
                        accessibilityLabel={`Xóa nháp: ${item.tieuDe}`}
                      />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.pagination}>
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onPress={() => void fetchPage(page - 1)}>
            Trang trước
          </Button>
          <ThemedText style={{ color: theme.textSecondary }} type="small">
            Trang {page} / {Math.max(totalPages, 1)}
          </ThemedText>
          <Button
            variant="outline"
            disabled={loading || page >= totalPages}
            onPress={() => void fetchPage(page + 1)}>
            Trang sau
          </Button>
        </View>
      </ScrollView>

      {/* Chi tiết / Xem và duyệt tin (JobPreview của Web). */}
      <Modal visible={detail !== null} animationType="slide" onRequestClose={() => setDetail(null)}>
        {detail ? (
          <JobDetailSheet
            job={detail}
            busy={firingId === detail.id}
            onClose={() => setDetail(null)}
            onApprove={() =>
              void handleFire(
                detail,
                JOB_TRIGGER.NguoiDaiDienDuyet,
                'Đồng ý và chạy bộ lọc',
                'Sau khi bạn đồng ý, hệ thống mới lọc: OK thì công khai, vi phạm hoặc nghi vấn thì chuyển Admin duyệt tay.',
              )
            }
            onReject={() => void handleFire(detail, JOB_TRIGGER.NguoiDaiDienTuChoi, 'Từ chối', undefined, true)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function JobDetailSheet({
  job,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  job: HrJob;
  busy: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const theme = useTheme();
  const { isNdd } = useHrRole();
  const reviewing =
    isNdd && (job.trangThai === 'ChoNguoiDaiDienDuyet' || job.trangThai === '9');

  return (
    <View style={[styles.sheet, { backgroundColor: theme.background }]}>
      <View style={[styles.sheetBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.sheetTitle} numberOfLines={1} type="smallBold">
          {reviewing ? 'Xem và duyệt tin' : 'Chi tiết tin tuyển dụng'}
        </ThemedText>
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.sheetClose}>
          <X size={20} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.sheetContent}>
        <View style={styles.jobHead}>
          <ThemedText style={styles.sheetJobTitle} type="subtitle">
            {job.tieuDe}
          </ThemedText>
          <JobStatusBadge value={job.trangThai} />
        </View>

        {(job.trangThai === 'TuChoi' || job.trangThai === '7') && job.ghiChuKiemDuyet ? (
          <ThemedText style={{ color: theme.destructive }} type="small">
            {job.ghiChuKiemDuyet}
          </ThemedText>
        ) : null}

        <ThemedText style={{ color: theme.textSecondary }} type="code">
          {job.diaDiemLamViec} • {fmtMoney(job.luongToiThieu)} — {fmtMoney(job.luongToiDa)} • Hết hạn:{' '}
          {fmtDate(job.ngayHetHan)}
        </ThemedText>

        {job.kyNangs.length > 0 ? (
          <View style={styles.skillWrap}>
            {job.kyNangs.map((skill) => (
              <View
                key={skill.kyNangId}
                style={[styles.skillPill, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={{ color: theme.primaryHover, flexShrink: 1 }} type="code" numberOfLines={1}>
                  {skill.tenKyNang || `Kỹ năng #${skill.kyNangId}`} · {SKILL_LEVELS[skill.mucDoYeuCau] ?? SKILL_LEVELS[0]}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <DetailSection title="Mô tả công việc" body={job.moTaCongViec} />
        <DetailSection title="Yêu cầu công việc" body={job.yeuCauCongViec} />
        <DetailSection title="Kinh nghiệm yêu cầu" body={job.kinhNghiemYeuCau} />
        <DetailSection title="Quyền lợi" body={job.quyenLoi} />
      </ScrollView>

      {reviewing ? (
        <View style={[styles.sheetActions, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <Button variant="outline" disabled={busy} onPress={onReject}>
            Từ chối
          </Button>
          <Button
            disabled={busy}
            onPress={onApprove}
            icon={busy ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <CheckCircle2 size={15} color={theme.primaryForeground} />}>
            Đồng ý và chạy bộ lọc
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function DetailSection({ title, body }: { title: string; body: string }) {
  const theme = useTheme();
  if (!body.trim()) return null;
  return (
    <View style={styles.detailSection}>
      <ThemedText style={[styles.detailTitle, { color: theme.textSecondary }]} type="code">
        {title.toUpperCase()}
      </ThemedText>
      <ThemedText style={styles.detailBody} type="small">
        {body}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageTitle: { fontSize: 12, letterSpacing: 1.2 },
  chipRow: { gap: 8, paddingRight: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: font('regular'), paddingVertical: 9 },
  list: { gap: 12 },
  jobCard: { borderRadius: Radius['2xl'], borderWidth: 1, padding: 16, gap: 10 },
  jobHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  jobTitle: { flex: 1, fontSize: 15, minWidth: 140 },
  jobActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  applicantsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  emptyAction: { marginTop: 8 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  sheet: { flex: 1 },
  sheetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sheetTitle: { flex: 1, fontSize: 15 },
  sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { padding: 16, gap: 12, paddingBottom: 40 },
  sheetJobTitle: { flex: 1, minWidth: 160 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, maxWidth: '100%' },
  detailSection: { gap: 4 },
  detailTitle: { fontSize: 11, letterSpacing: 1 },
  detailBody: { fontSize: 13, lineHeight: 20 },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
