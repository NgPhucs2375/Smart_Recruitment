import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, MapPin, ShieldCheck, UserX } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { hrApi } from '@/features/hr/api/hr-api';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import {
  HrEmptyState,
  HrErrorState,
  HrLoadingState,
  HrScreenShell,
  HrTopBar,
  JobStatusBadge,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { JOB_TRIGGER, SKILL_LEVELS, WORK_MODES } from '@/features/hr/constants';
import { useHrRole } from '@/features/hr/hooks/use-hr-role';
import type { HrJob } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';

function fmtMoney(value: number): string {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}

function fmtDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

function workModeLabel(value: number): string {
  return WORK_MODES.find((mode) => mode.value === value)?.label ?? 'Onsite';
}

export function ApprovalsScreen() {
  const theme = useTheme();
  const { isNdd } = useHrRole();
  const { dialog, confirm, prompt } = useHrActionDialog();

  const [items, setItems] = useState<HrJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await hrApi.listJobs({
        page: 1,
        pageSize: 100,
        status: 'ChoNguoiDaiDienDuyet',
      });
      if (!mountedRef.current) return;
      setItems(result.items);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không tải được danh sách chờ duyệt.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!isNdd) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [isNdd, load]);

  const decide = async (job: HrJob, approve: boolean) => {
    if (actingId !== null) return;
    try {
      setActingId(job.id);
      setError('');
      setSuccess('');
      if (approve) {
        const ok = await confirm({
          title: 'Duyệt tin tuyển dụng',
          description:
            'Sau khi bạn đồng ý, hệ thống mới lọc: OK thì công khai, vi phạm hoặc nghi vấn thì chuyển Admin duyệt tay.',
          confirmLabel: 'Đồng ý duyệt',
        });
        if (!ok) return;
      } else {
        const reason = await prompt({
          title: 'Từ chối tin tuyển dụng',
          description: 'Nhập lý do từ chối (hiển thị cho người đăng tin).',
          placeholder: 'VD: Mô tả chưa đủ rõ ràng về vị trí',
          confirmLabel: 'Từ chối',
          destructive: true,
        });
        if (reason === null) return;
        setActingId(job.id);
        await fire(job, JOB_TRIGGER.NguoiDaiDienTuChoi, reason || '');
        return;
      }
      setActingId(job.id);
      await fire(job, JOB_TRIGGER.NguoiDaiDienDuyet, 'Người đại diện đồng ý duyệt tin.');
    } finally {
      if (mountedRef.current) setActingId(null);
    }
  };

  async function fire(job: HrJob, trigger: number, ghiChu: string) {
    const fresh = await hrApi.getJob(job.id).catch(() => null);
    const message = await hrApi.fireJob(job.id, trigger, ghiChu, fresh?.lastModified ?? job.lastModified);
    if (!mountedRef.current) return;
    setSuccess(message || (trigger === JOB_TRIGGER.NguoiDaiDienDuyet ? 'Đã duyệt tin.' : 'Đã từ chối tin.'));
    await load(true);
  }

  const handleApprove = (job: HrJob) => {
    void decide(job, true).catch((reason) => {
      if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Không thể xử lý.');
    });
  };

  const handleReject = (job: HrJob) => {
    void decide(job, false).catch((reason) => {
      if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Không thể xử lý.');
    });
  };

  return (
    <HrScreenShell>
      {dialog}
      <HrTopBar title="Duyệt tin & nhân sự" />
      {!isNdd ? (
        <HrEmptyState
          title="Chỉ Người đại diện duyệt được tin"
          description="Tài khoản Nhân sự chỉ xem được danh sách; phê duyệt thuộc vai trò Người đại diện của doanh nghiệp."
          action={
            <Button variant="outline" pill onPress={() => router.push('/(hr)/jobs')} style={styles.emptyAction}>
              Về danh sách tin
            </Button>
          }
        />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }>
          <View style={styles.headBlock}>
            <View style={[styles.headIcon, { backgroundColor: `${theme.primary}14` }]}>
              <ShieldCheck size={18} color={theme.primary} />
            </View>
            <View style={styles.flex}>
              <ThemedText style={styles.pageTitle}>Chờ bạn duyệt</ThemedText>
              <ThemedText style={[styles.pageDesc, { color: theme.textSecondary }]} type="small">
                Tin do Nhân sự tạo đang chờ Người đại diện đồng ý trước khi hệ thống lọc.
              </ThemedText>
            </View>
          </View>

          {success ? <NoticeBar kind="success" message={success} /> : null}
          {error ? <NoticeBar kind="error" message={error} /> : null}

          {loading ? (
            <HrLoadingState label="Đang tải danh sách duyệt…" />
          ) : error && items.length === 0 ? (
            <HrErrorState message={error} onRetry={() => void load()} />
          ) : items.length === 0 ? (
            <HrEmptyState
              title="Không có tin chờ duyệt"
              description="Khi Nhân sự gửi tin lên, tin sẽ xuất hiện tại đây để bạn phê duyệt hoặc từ chối."
            />
          ) : (
            <View style={styles.list}>
              {items.map((job) => {
                const busy = actingId === job.id;
                return (
                  <View
                    key={job.id}
                    style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.cardHead}>
                      <ThemedText style={styles.cardTitle} numberOfLines={2} type="smallBold">
                        {job.tieuDe}
                      </ThemedText>
                      <JobStatusBadge value={job.trangThai} />
                    </View>

                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      {[workModeLabel(job.phuongThucLamViec), job.diaDiemLamViec, `Hạn ${fmtDate(job.ngayHetHan)}`]
                        .filter(Boolean)
                        .join(' • ')}
                    </ThemedText>
                    <ThemedText style={[styles.money, { color: theme.text }]} type="small">
                      {fmtMoney(job.luongToiThieu)} — {fmtMoney(job.luongToiDa)}
                    </ThemedText>

                    {job.moTaCongViec ? (
                      <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]} type="small" numberOfLines={4}>
                        {job.moTaCongViec}
                      </ThemedText>
                    ) : null}

                    {job.kyNangs.length > 0 ? (
                      <View style={styles.skillWrap}>
                        {job.kyNangs.map((skill) => (
                          <View
                            key={skill.kyNangId}
                            style={[styles.skillPill, { backgroundColor: theme.backgroundSelected }]}>
                            <ThemedText style={{ color: theme.primary }} type="code">
                              {skill.tenKyNang}
                              {SKILL_LEVELS[skill.mucDoYeuCau]
                                ? ` • ${SKILL_LEVELS[skill.mucDoYeuCau]}`
                                : ''}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.metaRow}>
                      <MapPin size={13} color={theme.textSecondary} />
                      <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
                        Người đăng #{job.nguoiDangTinId} • {job.soLuongUngVien} đơn đã nhận
                      </ThemedText>
                    </View>

                    <View style={styles.actions}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() => handleReject(job)}
                        icon={<UserX size={14} color={theme.destructive} />}>
                        <ThemedText style={{ color: theme.destructive }} type="small">
                          Từ chối
                        </ThemedText>
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onPress={() => handleApprove(job)}
                        icon={<CheckCircle2 size={14} color={theme.primaryForeground} />}>
                        {busy ? 'Đang xử lý…' : 'Đồng ý duyệt'}
                      </Button>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  emptyAction: { marginTop: 8 },
  headBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: font('semibold'), fontSize: 17, letterSpacing: -0.3 },
  pageDesc: { fontSize: 12, lineHeight: 17 },
  list: { gap: 12 },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: 14, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15 },
  money: { fontFamily: font('medium') },
  paragraph: { lineHeight: 19 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
