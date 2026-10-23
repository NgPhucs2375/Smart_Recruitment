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
import { CheckCheck, Eye, Search, Star, UserX } from 'lucide-react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { APP_STATUS_FILTERS, APP_TRIGGER } from '@/features/hr/constants';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import {
  AppStatusBadge,
  Chip,
  HrEmptyState,
  HrErrorState,
  HrLoadingState,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { hrAppApi, hrCvApi } from '@/features/hr/api/hr-api';
import type { DanhGia, HrApplication, HrJob } from '@/features/hr/types';
import { apiRequest } from '@/services/api/client';
import { asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';
import { useTheme } from '@/hooks/use-theme';

const GLOBAL_END = 100;
const JOB_END = 1000;

type MockApplicant = {
  id: number;
  hoTen: string;
  viTri: string;
  diemPhuHop: number;
  ngayNop: string;
  trangThai: number;
};

/** Hồ sơ mẫu hiển thị khi API chưa có dữ liệu (demo/báo cáo). */
const MOCK_APPLICANTS: MockApplicant[] = [
  { id: 90001, hoTen: 'Trần Minh Đức', viTri: '.NET Core Developer', diemPhuHop: 92, ngayNop: '22/10/2026', trangThai: 2 },
  { id: 90002, hoTen: 'Nguyễn Thu Hà', viTri: 'React Native Developer', diemPhuHop: 87, ngayNop: '22/10/2026', trangThai: 3 },
  { id: 90003, hoTen: 'Lê Quốc Hưng', viTri: 'Senior Frontend Developer', diemPhuHop: 78, ngayNop: '21/10/2026', trangThai: 2 },
  { id: 90004, hoTen: 'Phạm Thảo My', viTri: 'UI/UX Designer', diemPhuHop: 71, ngayNop: '20/10/2026', trangThai: 3 },
  { id: 90005, hoTen: 'Vũ Anh Tuấn', viTri: 'Data Analyst', diemPhuHop: 64, ngayNop: '19/10/2026', trangThai: 2 },
];

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

function initials(name: string): string {
  return (name || 'UV').slice(0, 2).toUpperCase();
}

type ApplicantsInboxProps = {
  /** Có jobId = màn ứng viên theo tin (chi tiết hơn: hiện đánh giá, ẩn chọn tin). */
  jobId?: number;
  jobTitle?: string;
};

export function ApplicantsInbox({ jobId, jobTitle }: ApplicantsInboxProps) {
  const theme = useTheme();
  const { dialog, confirm, prompt } = useHrActionDialog();
  const perJob = jobId !== undefined && jobId > 0;

  const [items, setItems] = useState<HrApplication[]>([]);
  const [profiles, setProfiles] = useState<Record<number, string>>({});
  const [jobTitles, setJobTitles] = useState<Record<number, string>>({});
  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [danhGias, setDanhGias] = useState<Record<number, DanhGia>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reachedCap, setReachedCap] = useState(false);
  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  // Quyết định trên hồ sơ mock (sống ở cha để không mất khi đổi chip/loading).
  const [mockDecisions, setMockDecisions] = useState<Record<number, 'approve' | 'reject'>>({});

  // Dialog đánh giá (bước END khi đơn đã Phù hợp).
  const [evalDon, setEvalDon] = useState<HrApplication | null>(null);
  const [evalNoiDung, setEvalNoiDung] = useState('');
  const [evalKetLuan, setEvalKetLuan] = useState('');
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const statusValue = statusFilter === 'all' ? null : Number(statusFilter);
        const end = perJob ? JOB_END : GLOBAL_END;

        const appPromise = hrAppApi.list({
          start: 0,
          end,
          status: statusValue,
          jobId: perJob ? jobId : jobFilter !== 'all' ? Number(jobFilter) : null,
        });

        const [appResult, nameMap] = await Promise.all([appPromise, hrAppApi.getProfileNames()]);

        if (!mountedRef.current) return;
        setItems(appResult.items);
        setProfiles(nameMap);
        setReachedCap(appResult.reachedCap);
        setDanhGias({});

        // Theo tin: đánh giá từng đơn + tiêu đề tin (đúng Web).
        if (perJob) {
          const [evalMap] = await Promise.all([
            Promise.all(
              appResult.items
                .filter((item) => item.trangThai === 5)
                .map(async (item) => {
                  try {
                    return [item.id, await hrAppApi.getDanhGia(item.id)] as const;
                  } catch {
                    return [item.id, null] as const;
                  }
                }),
            ),
            (async () => {
              try {
                const payload = await apiRequest<unknown>(`tintuyendungs/show/${jobId}`);
                const raw = asRecord(unwrapData(payload));
                const title = asText(raw?.tieuDe ?? raw?.TieuDe);
                if (mountedRef.current && title) {
                  setJobTitles((prev) => ({ ...prev, [jobId as number]: title }));
                }
              } catch {
                /* Bỏ qua lỗi tiêu đề. */
              }
            })(),
          ]);
          if (!mountedRef.current) return;
          const map: Record<number, DanhGia> = {};
          for (const [id, evalRow] of evalMap) {
            if (evalRow) map[id] = evalRow;
          }
          setDanhGias(map);
        }

        // Chọn tin (màn toàn cục): danh sách tin để lọc.
        if (!perJob) {
          try {
            const payload = await apiRequest<unknown>('tintuyendungs?_start=0&_end=100');
            const rows = Array.isArray(unwrapData(payload)) ? (unwrapData(payload) as unknown[]) : [];
            const list = rows
              .map((row) => {
                const raw = asRecord(row) ?? {};
                return { id: asNumber(raw.id ?? raw.Id), tieuDe: asText(raw.tieuDe ?? raw.TieuDe) };
              })
              .filter((row) => row.id > 0 && row.tieuDe);
            if (mountedRef.current) {
              setJobs(
                list.map((row) => ({
                  ...emptyJobFields,
                  id: row.id,
                  tieuDe: row.tieuDe,
                })),
              );
              setJobTitles((prev) => {
                const next = { ...prev };
                for (const row of list) next[row.id] = row.tieuDe;
                return next;
              });
            }
          } catch {
            /* Bỏ qua lỗi danh sách tin. */
          }
        }
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Lỗi tải dữ liệu');
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
        if (mountedRef.current) setRefreshing(false);
      }
    },
    [jobFilter, jobId, perJob, statusFilter],
  );

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load(true);
  };

  const nameOf = (item: HrApplication) =>
    profiles[item.hoSoUngVienId] || `Hồ sơ #${item.hoSoUngVienId}`;

  const titleOf = (item: HrApplication) =>
    (perJob ? jobTitle : undefined) || item.tieuDe || jobTitles[item.tinTuyenDungId] || 'Tin tuyển dụng';

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? items.filter((item) =>
        [nameOf(item), titleOf(item)].some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : items;

  async function handleViewCv(item: HrApplication) {
    if (actingId !== null) return;
    try {
      setActingId(item.id);
      setError('');
      setSuccess('');
      if (item.trangThai === 2) {
        await hrAppApi.fire(item.id, APP_TRIGGER.XemDon, '');
        if (!mountedRef.current) return;
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, trangThai: 3 } : entry)),
        );
      }
      const name = encodeURIComponent(nameOf(item));
      router.push(`/hr/cv-viewer?cvId=${item.cvUngVienId}&name=${name}&donId=${item.id}`);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể mở hồ sơ ứng viên.');
    } finally {
      if (mountedRef.current) setActingId(null);
    }
  }

  async function handleAction(item: HrApplication, trigger: number, label: string, needReason = false) {
    if (actingId !== null) return;
    const profileName = nameOf(item);
    let note = '';
    if (needReason) {
      const reason = await prompt({
        title: `Từ chối đơn của ${profileName}`,
        description: 'Lý do sẽ được lưu cùng đơn ứng tuyển và có thể được gửi tới ứng viên.',
        placeholder: 'Nhập lý do (tùy chọn)',
        confirmLabel: 'Tiếp tục',
        destructive: true,
      });
      if (reason === null) return;
      note = reason.trim();
    }
    const confirmed = await confirm({
      title: `${label}?`,
      description: `${profileName} sẽ được chuyển sang trạng thái tương ứng trong quy trình tuyển dụng.`,
      confirmLabel: label,
      destructive: trigger === APP_TRIGGER.TuChoi,
    });
    if (!confirmed) return;

    try {
      setActingId(item.id);
      setError('');
      setSuccess('');
      if (trigger === APP_TRIGGER.DanhGiaPhuHop) {
        await hrCvApi.approveFromCv(item.id);
      } else {
        await hrAppApi.fire(item.id, trigger, note);
      }
      if (!mountedRef.current) return;
      setSuccess(`Đã ${label.toLowerCase()} đơn của ${profileName}.`);
      await load(true);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật đơn.');
    } finally {
      if (mountedRef.current) setActingId(null);
    }
  }

  function openEval(item: HrApplication) {
    const existing = danhGias[item.id];
    setEvalDon(item);
    setEvalNoiDung(existing?.noiDungPhanHoi ?? '');
    setEvalKetLuan(existing?.ketLuan ?? '');
  }

  async function submitEval() {
    if (!evalDon || evalSubmitting) return;
    if (!evalNoiDung.trim() || !evalKetLuan.trim()) {
      setError('Cần nhập nhận xét và kết luận trước khi lưu.');
      return;
    }
    try {
      setEvalSubmitting(true);
      setError('');
      const message = await hrAppApi.saveDanhGia(evalDon.id, evalNoiDung.trim(), evalKetLuan.trim());
      if (!mountedRef.current) return;
      setSuccess(message || `Đã ghi nhận đánh giá cho đơn #${evalDon.id}.`);
      setEvalDon(null);
      await load(true);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể lưu đánh giá');
    } finally {
      if (mountedRef.current) setEvalSubmitting(false);
    }
  }

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
        <ThemedText style={[styles.pageTitle, { color: theme.textSecondary }]} type="smallBold">
          Hộp thư ứng viên
        </ThemedText>

        {/* Bộ lọc trạng thái — mirror Select "Lọc theo" của Web. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {APP_STATUS_FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={statusFilter === option.value}
              onPress={() => setStatusFilter(option.value)}
            />
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          {!perJob ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setJobPickerOpen(true)}
              style={[styles.jobFilter, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={{ color: theme.text }} type="small" numberOfLines={1}>
                {jobFilter === 'all'
                  ? 'Tất cả tin'
                  : jobTitles[Number(jobFilter)] || `Tin #${jobFilter}`}
              </ThemedText>
            </Pressable>
          ) : null}
          <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
            <Search size={15} color={theme.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm ứng viên hoặc tin..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
        </View>

        {error ? <NoticeBar kind="error" message={error} /> : null}
        {success ? <NoticeBar kind="success" message={success} /> : null}

        {loading ? (
          <HrLoadingState />
        ) : error && items.length === 0 ? (
          <HrErrorState message={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <MockApplicantsCard
            decisions={mockDecisions}
            search={normalizedSearch}
            statusFilter={statusFilter}
            onDecided={(id, kind, name) => {
              setMockDecisions((prev) => ({ ...prev, [id]: kind }));
              setSuccess(
                kind === 'approve'
                  ? `Đã duyệt hồ sơ của ${name}.`
                  : `Đã từ chối hồ sơ của ${name}.`,
              );
            }}
          />
        ) : filtered.length === 0 ? (
          <HrEmptyState
            title="Không tìm thấy đơn phù hợp"
            description="Thử thay đổi bộ lọc hoặc từ khóa."
          />
        ) : (
          <View style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.listHead}>
              <ThemedText style={[styles.listHeadTitle, { color: theme.textSecondary }]} type="code">
                DANH SÁCH ĐƠN ỨNG TUYỂN ({filtered.length})
              </ThemedText>
              {reachedCap ? (
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Hiển thị {GLOBAL_END} đơn đầu tiên — dùng bộ lọc để thu hẹp danh sách.
                </ThemedText>
              ) : null}
            </View>

            {filtered.map((item, index) => {
              const busy = actingId === item.id;
              const name = nameOf(item);
              const evalRow = danhGias[item.id];
              const canApprove = item.trangThai === 2 || item.trangThai === 3;
              const canReject = item.trangThai === 2 || item.trangThai === 3;
              const canEval = perJob && item.trangThai === 5 && !evalRow;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    {
                      borderTopColor: theme.border,
                      borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <View style={styles.rowBody}>
                    <View style={styles.rowHeadline}>
                      <View style={[styles.avatar, { backgroundColor: `${theme.primary}14` }]}>
                        <ThemedText style={[styles.avatarText, { color: theme.primary }]} type="code">
                          {initials(name)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.rowName} numberOfLines={1} type="smallBold">
                        {name}
                      </ThemedText>
                      <AppStatusBadge value={item.trangThai} />
                    </View>
                    <ThemedText style={[styles.rowTitle, { color: theme.text }]} type="small" numberOfLines={2}>
                      {titleOf(item)}
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      Đơn #{item.id} • Nộp {formatDate(item.ngayUngTuyen)}
                    </ThemedText>
                    {item.ghiChu ? (
                      <ThemedText style={{ color: theme.textSecondary }} type="code">
                        Ghi chú: {item.ghiChu}
                      </ThemedText>
                    ) : null}
                    {evalRow ? (
                      <ThemedText style={{ color: theme.textSecondary }} type="code">
                        Đánh giá: {evalRow.ketLuan}
                        {evalRow.ngayPhanHoi ? ` • ${formatDate(evalRow.ngayPhanHoi)}` : ''}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.rowActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onPress={() => void handleViewCv(item)}
                      icon={<Eye size={14} color={theme.text} />}>
                      Xem CV
                    </Button>
                    {canApprove ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onPress={() => void handleAction(item, APP_TRIGGER.DanhGiaPhuHop, 'Duyệt phù hợp')}
                        icon={<CheckCheck size={14} color={theme.primaryForeground} />}>
                        Duyệt phù hợp
                      </Button>
                    ) : null}
                    {canReject ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onPress={() => void handleAction(item, APP_TRIGGER.TuChoi, 'Từ chối', true)}
                        icon={<UserX size={14} color={theme.destructive} />}>
                        <ThemedText style={{ color: theme.destructive }} type="small">
                          Từ chối
                        </ThemedText>
                      </Button>
                    ) : null}
                    {canEval && evalDon === null ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onPress={() => openEval(item)}
                        icon={<Star size={14} color={theme.primary} />}>
                        Đánh giá
                      </Button>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Chọn tin (màn toàn cục). */}
      <Modal visible={jobPickerOpen} transparent animationType="fade" onRequestClose={() => setJobPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setJobPickerOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Lọc theo tin</ThemedText>
            <ScrollView style={styles.modalList} bounces={false}>
              {[{ id: 0, tieuDe: 'Tất cả tin' }, ...jobs].map((option) => {
                const value = option.id === 0 ? 'all' : String(option.id);
                const active = jobFilter === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    onPress={() => {
                      setJobFilter(value);
                      setJobPickerOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      {
                        backgroundColor: active ? theme.backgroundSelected : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <ThemedText style={{ color: active ? theme.primary : theme.text }} type="small">
                      {option.tieuDe}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setJobPickerOpen(false)} style={styles.modalClose}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Đóng
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dialog đánh giá & kết luận. */}
      <Modal visible={evalDon !== null} transparent animationType="fade" onRequestClose={() => setEvalDon(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEvalDon(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Đánh giá & kết luận</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }} type="code">
              Đơn #{evalDon?.id} — bước cuối của vòng tuyển. Mỗi đơn chỉ có 1 đánh giá.
            </ThemedText>
            <ThemedText style={[styles.evalLabel, { color: theme.textSecondary }]} type="code">
              NHẬN XÉT *
            </ThemedText>
            <TextInput
              value={evalNoiDung}
              onChangeText={setEvalNoiDung}
              multiline
              placeholder="VD: Kỹ năng phù hợp, giao tiếp tốt, có thể đi làm ngay..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.evalInput, { backgroundColor: theme.background, borderColor: theme.input, color: theme.text }]}
            />
            <ThemedText style={[styles.evalLabel, { color: theme.textSecondary }]} type="code">
              KẾT LUẬN *
            </ThemedText>
            <TextInput
              value={evalKetLuan}
              onChangeText={setEvalKetLuan}
              placeholder="VD: Đạt — mời nhận việc / Không đạt"
              placeholderTextColor={theme.textSecondary}
              style={[styles.evalInput, styles.evalInputSmall, { backgroundColor: theme.background, borderColor: theme.input, color: theme.text }]}
            />
            <View style={styles.evalActions}>
              <Button variant="ghost" size="sm" onPress={() => setEvalDon(null)}>
                Huỷ
              </Button>
              <Button size="sm" disabled={evalSubmitting} onPress={() => void submitEval()}>
                {evalSubmitting ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  'Lưu đánh giá'
                )}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Hồ sơ mẫu — chỉ dùng khi API trả về rỗng (demo/báo cáo).
 * Quyết định "Duyệt/Từ chối" cập nhật cục bộ, không gọi API.
 */
function MockApplicantsCard({
  decisions,
  search,
  statusFilter,
  onDecided,
}: {
  decisions: Record<number, 'approve' | 'reject'>;
  search: string;
  statusFilter: string;
  onDecided: (id: number, kind: 'approve' | 'reject', name: string) => void;
}) {
  const theme = useTheme();

  // Mock không gắn tin tuyển thật → bỏ qua job picker; lọc theo status + search.
  const visible = MOCK_APPLICANTS.filter((item) => {
    const decision = decisions[item.id];
    const status = decision === 'approve' ? 5 : decision === 'reject' ? 6 : item.trangThai;
    const statusOk = statusFilter === 'all' || status === Number(statusFilter);
    const searchOk =
      !search ||
      item.hoTen.toLowerCase().includes(search) ||
      item.viTri.toLowerCase().includes(search);
    return statusOk && searchOk;
  });

  if (visible.length === 0) {
    return (
      <HrEmptyState
        title="Không tìm thấy đơn phù hợp"
        description="Thử thay đổi bộ lọc hoặc từ khóa."
      />
    );
  }

  return (
    <View style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.listHead}>
        <ThemedText style={[styles.listHeadTitle, { color: theme.textSecondary }]} type="code">
          DANH SÁCH ĐƠN ỨNG TUYỂN ({visible.length})
        </ThemedText>
      </View>

      {visible.map((item, index) => {
        const decision = decisions[item.id];
        const status = decision === 'approve' ? 5 : decision === 'reject' ? 6 : item.trangThai;
        return (
          <View
            key={item.id}
            style={[
              styles.row,
              {
                borderTopColor: theme.border,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
              },
            ]}>
            <View style={styles.rowBody}>
              <View style={styles.rowHeadline}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}14` }]}>
                  <ThemedText style={[styles.avatarText, { color: theme.primary }]} type="code">
                    {initials(item.hoTen)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.rowName} numberOfLines={1} type="smallBold">
                  {item.hoTen}
                </ThemedText>
                <AppStatusBadge value={status} />
              </View>
              <ThemedText style={[styles.rowTitle, { color: theme.text }]} type="small" numberOfLines={2}>
                {item.viTri}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }} type="code">
                Khớp AI {item.diemPhuHop}% • Nộp {item.ngayNop} • Đơn #{item.id}
              </ThemedText>
            </View>

            <View style={styles.rowActions}>
              {decision ? (
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  {decision === 'approve' ? 'Đã duyệt hồ sơ' : 'Đã từ chối hồ sơ'}
                </ThemedText>
              ) : (
                <>
                  <Button
                    size="sm"
                    onPress={() => onDecided(item.id, 'approve', item.hoTen)}
                    icon={<CheckCheck size={14} color={theme.primaryForeground} />}>
                    Duyệt hồ sơ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => onDecided(item.id, 'reject', item.hoTen)}
                    icon={<UserX size={14} color={theme.text} />}>
                    Từ chối
                  </Button>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const emptyJobFields: Omit<HrJob, 'id' | 'tieuDe'> = {
  danhMucNgheId: 0,
  moTaCongViec: '',
  kinhNghiemYeuCau: '',
  yeuCauCongViec: '',
  quyenLoi: '',
  diaDiemLamViec: '',
  phuongThucLamViec: 0,
  luongToiThieu: 0,
  luongToiDa: 0,
  trangThai: 'Nhap',
  ngayHetHan: '',
  lastModified: null,
  kyNangs: [],
  ghiChuKiemDuyet: '',
  soLuongUngVien: 0,
  nguoiDangTinId: 0,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  pageTitle: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  chipRow: { gap: 8, paddingRight: 8 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  jobFilter: {
    minHeight: 36,
    maxWidth: '45%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: font('regular'), paddingVertical: 8 },
  listCard: { borderRadius: Radius['2xl'], borderWidth: 1, overflow: 'hidden' },
  listHead: { padding: 14, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd4c7' },
  listHeadTitle: { fontSize: 11, letterSpacing: 1 },
  row: { padding: 14, gap: 10 },
  rowBody: { gap: 4 },
  rowHeadline: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  avatar: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11 },
  rowName: { fontSize: 14, flexShrink: 1 },
  rowTitle: { fontSize: 13, lineHeight: 19 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 16, maxHeight: '75%', gap: 8 },
  modalList: { flexGrow: 0 },
  modalItem: { paddingHorizontal: 10, paddingVertical: 12, borderRadius: Radius.md },
  modalClose: { alignItems: 'center', paddingVertical: 10 },
  evalLabel: { fontSize: 11, letterSpacing: 1 },
  evalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: font('regular'),
  },
  evalInputSmall: { minHeight: 44 },
  evalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
