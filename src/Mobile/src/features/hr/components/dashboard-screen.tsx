import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  Plus,
  Send,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { getDashboard } from '@/features/hr/api/hr-api';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import {
  HrErrorState,
  HrLoadingState,
  KpiCard,
} from '@/features/hr/components/hr-primitives';
import { useHrRole } from '@/features/hr/hooks/use-hr-role';
import { PotentialCandidatesCard } from '@/features/hr/components/potential-candidates-card';
import type { DashboardData, HrJob } from '@/features/hr/types';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

const STAGE_NEW = [0, 1, 2];

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86_400_000);
}

export function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { isNdd } = useHrRole();
  const { dialog } = useHrActionDialog();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
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
      try {
        const result = await getDashboard(isNdd);
        if (!mountedRef.current) return;
        setData(result);
        setError('');
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Lỗi tải dữ liệu');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [isNdd],
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

  if (loading && !data) {
    return (
      <View style={styles.flex}>
        <HrLoadingState label="Đang tải tổng quan…" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.flex}>
        <HrErrorState message={error} onRetry={() => void load()} />
      </View>
    );
  }

  const jobs = data?.jobs ?? [];
  const dons = data?.dons ?? [];
  const team = data?.team ?? [];

  const activeJobs = jobs.filter((job) => getTrangThai(job) === 3);
  const unviewed = dons.filter((don) => STAGE_NEW.includes(don.trangThai));
  const highFit = dons.filter((don) => don.trangThai === 5);
  const expiringJobs = activeJobs.filter((job) => {
    const days = daysUntil(job.ngayHetHan);
    return days !== null && days >= 0 && days <= 7;
  });
  const attentionCount = unviewed.length + expiringJobs.length;
  const uniqueCandidates = new Set(dons.map((don) => don.hoSoUngVienId)).size;

  const appsByJob = new Map<number, { total: number; fresh: number }>();
  for (const don of dons) {
    const current = appsByJob.get(don.tinTuyenDungId) ?? { total: 0, fresh: 0 };
    current.total += 1;
    if (STAGE_NEW.includes(don.trangThai)) current.fresh += 1;
    appsByJob.set(don.tinTuyenDungId, current);
  }

  const stages = [
    { label: 'Mới nhận', count: dons.filter((don) => STAGE_NEW.includes(don.trangThai)).length, note: 'Chờ xử lý' },
    { label: 'Đã xem', count: dons.filter((don) => don.trangThai === 3).length, note: 'Đã mở hồ sơ' },
    { label: 'Phù hợp', count: dons.filter((don) => don.trangThai === 5).length, note: 'Được đánh giá' },
    {
      label: 'Kết thúc',
      count: dons.filter((don) => [4, 6, 7, 8, 9].includes(don.trangThai)).length,
      note: 'Từ chối / rút / đóng',
    },
  ];

  // Application trend 7 ngày (manager) — đúng Web.
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return {
      label: date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', ''),
      count: dons.filter((don) => {
        const applied = new Date(don.ngayUngTuyen);
        return !Number.isNaN(applied.getTime()) && applied >= date && applied < next;
      }).length,
    };
  });
  const trendMax = Math.max(1, ...trend.map((point) => point.count));

  const activityByMember = team.map((member) => {
    const memberJobs = jobs.filter((job) => job.nguoiDangTinId === member.nguoiDungId);
    const memberJobIds = new Set(memberJobs.map((job) => job.id));
    return {
      ...member,
      jobCount: memberJobs.length,
      applicantCount: dons.filter((don) => memberJobIds.has(don.tinTuyenDungId)).length,
    };
  });

  const kpis: { icon: ReactNode; label: string; value: string; sub: string; go: Href }[] = isNdd
    ? [
        { icon: <Briefcase size={16} color={theme.primary} />, label: 'TIN ĐANG TUYỂN', value: `${activeJobs.length}`, sub: `${jobs.length} tin trong doanh nghiệp`, go: '/(hr)/jobs' },
        { icon: <Users size={16} color={theme.primary} />, label: 'ỨNG VIÊN', value: `${uniqueCandidates}`, sub: `${dons.length} lượt ứng tuyển`, go: '/(hr)/applicants' },
        { icon: <UserPlus size={16} color={theme.primary} />, label: 'NHÂN SỰ', value: `${team.length}`, sub: 'thành viên trong đội ngũ', go: '/hr/nhan-su' },
        { icon: <Clock size={16} color={theme.primary} />, label: 'ĐƠN MỚI CHỜ XEM', value: `${unviewed.length}`, sub: 'cần được xử lý', go: '/(hr)/applicants' },
        { icon: <ListTodo size={16} color={theme.primary} />, label: 'VIỆC CẦN XỬ LÝ', value: `${attentionCount}`, sub: `${unviewed.length} đơn • ${expiringJobs.length} tin sắp hết hạn`, go: '/(hr)/applicants' },
      ]
    : [
        { icon: <Briefcase size={16} color={theme.primary} />, label: 'TIN ĐANG ĐĂNG', value: `${jobs.length}`, sub: `${activeJobs.length} tin đang tuyển`, go: '/(hr)/jobs' },
        { icon: <Users size={16} color={theme.primary} />, label: 'ĐƠN ỨNG TUYỂN', value: `${dons.length}`, sub: 'thuộc các tin bạn phụ trách', go: '/(hr)/applicants' },
        { icon: <Clock size={16} color={theme.primary} />, label: 'CHỜ XỬ LÝ', value: `${unviewed.length}`, sub: 'đơn chưa xem', go: '/(hr)/applicants' },
      ];

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
        {/* Header — AdminPageHeader của Web. */}
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: `${theme.primary}14` }]}>
            <LayoutDashboard size={18} color={theme.primary} />
          </View>
          <View style={styles.headerTexts}>
            <ThemedText style={styles.headerTitle}>Tổng quan tuyển dụng</ThemedText>
            <ThemedText style={[styles.headerDesc, { color: theme.textSecondary }]} type="small">
              Trung tâm điều hành tuyển dụng hằng ngày của bạn.
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.greeting, { color: theme.textSecondary }]} type="small">
          Xin chào {user?.fullname || user?.email || 'Nhà tuyển dụng'}
        </ThemedText>

        <View style={styles.actionRow}>
          <Button
            pill
            onPress={() => router.push('/hr/jobs-form')}
            icon={<Plus size={16} color={theme.primaryForeground} />}>
            Đăng tin tuyển dụng
          </Button>
          <Button
            pill
            variant="outline"
            onPress={() => router.push('/(hr)/applicants')}
            icon={<ArrowRight size={16} color={theme.text} />}>
            Xem ứng viên
          </Button>
          {isNdd ? (
            <Button
              pill
              variant="outline"
              onPress={() => router.push('/hr/nhan-su')}
              icon={<UserPlus size={16} color={theme.text} />}>
              Mời nhân sự
            </Button>
          ) : null}
          <Button
            pill
            variant="outline"
            onPress={() => router.push('/hr/messages')}
            icon={<MessageCircle size={16} color={theme.text} />}>
            Tin nhắn
          </Button>
        </View>

        {data?.source === 'demo' ? (
          <ThemedText style={[styles.demoNote, { color: theme.textSecondary }]} type="code">
            Dữ liệu demo — không kết nối được máy chủ.
          </ThemedText>
        ) : null}

        {/* B. KPI row */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              sub={kpi.sub}
              onPress={() => router.push(kpi.go)}
            />
          ))}
        </View>

        {/* Ứng viên tiềm năng — Đánh giá AI cao (mock). */}
        <PotentialCandidatesCard />

        {/* Application trend (manager) */}
        {isNdd ? (
          <SectionCard title="Application trend" subtitle="Số lượt ứng tuyển trong 7 ngày gần nhất" trailing={`Tổng: ${dons.length} lượt`}>
            <View style={styles.trendBars}>
              {trend.map((point) => (
                <View key={point.label + String(point.count)} style={styles.trendCol}>
                  <ThemedText style={[styles.trendCount, { color: theme.textSecondary }]} type="code">
                    {point.count}
                  </ThemedText>
                  <View style={[styles.trendTrack, { backgroundColor: theme.muted }]}>
                    <View
                      style={[
                        styles.trendFill,
                        {
                          backgroundColor: theme.primary,
                          height: `${Math.max(6, (point.count / trendMax) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    {point.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : (
          /* Cần xử lý (nhân sự) */
          <SectionCard title="Cần xử lý" subtitle="Các việc cần ưu tiên xử lý">
            <View style={styles.attentionGrid}>
              <AttentionBlock
                icon={<AlertTriangle size={15} color={theme.primary} />}
                title="Đơn mới chưa xem"
                value={unviewed.length}
                note="đơn đang chờ bạn mở hồ sơ"
              />
              <AttentionBlock
                icon={<Clock size={15} color={theme.primary} />}
                title="Tin sắp hết hạn"
                value={expiringJobs.length}
                note="trong 7 ngày tới"
              />
              <AttentionBlock
                icon={<TrendingUp size={15} color={theme.primary} />}
                title="Ứng viên phù hợp"
                value={highFit.length}
                note="đã phù hợp nhưng chưa xử lý tiếp"
              />
            </View>
          </SectionCard>
        )}

        {/* C. Pipeline tuyển dụng */}
        <SectionCard
          title="Pipeline tuyển dụng"
          subtitle="Số ứng viên đi qua từng trạng thái thực của đơn ứng tuyển">
          <View style={styles.stageGrid}>
            {stages.map((stage, index) => (
              <View key={stage.label} style={[styles.stageBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={[styles.stageIndex, { backgroundColor: theme.primary }]}>
                  <ThemedText style={[styles.stageIndexText, { color: theme.primaryForeground }]} type="code">
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={styles.stageTexts}>
                  <ThemedText type="small" numberOfLines={1}>
                    {stage.label}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    {stage.note}
                  </ThemedText>
                </View>
                <ThemedText style={styles.stageCount}>{stage.count}</ThemedText>
              </View>
            ))}
          </View>
          <ThemedText style={[styles.stageFootnote, { color: theme.textSecondary }]} type="code">
            {dons.length} đơn phù hợp bộ lọc
          </ThemedText>
        </SectionCard>

        {/* D. Tin đang tuyển */}
        <SectionCard
          title="Tin đang tuyển"
          subtitle={`${activeJobs.length} tin đang hiển thị`}
          trailingLabel="Xem tất cả"
          onTrailing={() => router.push('/(hr)/jobs')}>
          {activeJobs.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Briefcase size={18} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary }} type="small">
                Chưa có tin nào đang tuyển. Đăng tin ngay.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.rows}>
              {activeJobs.slice(0, 5).map((job, index) => {
                const stat = appsByJob.get(job.id) ?? { total: 0, fresh: 0 };
                const exp = daysUntil(job.ngayHetHan);
                return (
                  <Pressable
                    key={job.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(
                        `/hr/job-applicants?id=${job.id}&title=${encodeURIComponent(job.tieuDe)}`,
                      )
                    }
                    style={({ pressed }) => [
                      styles.jobRow,
                      {
                        borderTopColor: theme.border,
                        borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <View style={styles.jobRowBody}>
                      <ThemedText type="small" numberOfLines={1}>
                        {job.tieuDe || `Tin #${job.id}`}
                      </ThemedText>
                      <View style={styles.jobMetaRow}>
                        <ThemedText style={{ color: theme.textSecondary }} type="code">
                          {stat.total} ứng viên
                        </ThemedText>
                        {stat.fresh > 0 ? (
                          <ThemedText style={[styles.freshPill, { backgroundColor: '#f7eddc', color: '#2f3440' }]} type="code">
                            +{stat.fresh} mới
                          </ThemedText>
                        ) : null}
                        {exp !== null && exp >= 0 && exp <= 7 ? (
                          <ThemedText style={{ color: theme.text }} type="code">
                            Hết hạn trong {exp} ngày
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                    <ArrowRight size={15} color={theme.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* E. Hoạt động nhân sự (manager) */}
        {isNdd ? (
          <SectionCard
            title="Hoạt động nhân sự"
            subtitle="Tin đăng và ứng viên theo người phụ trách"
            trailingLabel="Quản lý"
            onTrailing={() => router.push('/hr/nhan-su')}>
            {activityByMember.length === 0 ? (
              <ThemedText style={{ color: theme.textSecondary }} type="small">
                Chưa có dữ liệu nhân sự.
              </ThemedText>
            ) : (
              <View style={styles.rows}>
                {activityByMember.slice(0, 5).map((member, index) => (
                  <View
                    key={member.email || member.hoTen}
                    style={[
                      styles.memberRow,
                      {
                        borderTopColor: theme.border,
                        borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}>
                    <View style={[styles.memberAvatar, { backgroundColor: `${theme.primary}14` }]}>
                      <ThemedText style={[styles.memberInitials, { color: theme.primary }]} type="code">
                        {(member.hoTen || member.email || 'NS').slice(0, 2).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.memberBody}>
                      <ThemedText type="small" numberOfLines={1}>
                        {member.hoTen || member.email || 'Nhân sự'}
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
                        {member.chucVu || 'Nhân sự tuyển dụng'}
                      </ThemedText>
                    </View>
                    <View style={styles.memberStats}>
                      <ThemedText style={styles.memberStat} type="small">
                        {member.jobCount} tin
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary }} type="code">
                        {member.applicantCount} ứng viên
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        ) : null}

        {/* F. Việc cần xử lý hôm nay */}
        <SectionCard
          title="Việc cần xử lý hôm nay"
          subtitle="Tổng hợp từ đơn chưa xem và tin sắp hết hạn">
          {attentionCount === 0 ? (
            <View style={styles.inlineEmpty}>
              <CheckCircle2 size={18} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary }} type="small">
                Mọi thứ đã được xử lý.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.rows}>
              {unviewed.length > 0 ? (
                <View style={styles.attentionRow}>
                  <View style={[styles.attentionIcon, { backgroundColor: '#f7eddc' }]}>
                    <Send size={15} color={theme.text} />
                  </View>
                  <ThemedText style={styles.attentionText} type="small" numberOfLines={2}>
                    {unviewed.length} đơn mới chưa xem
                  </ThemedText>
                  <Pressable accessibilityRole="button" onPress={() => router.push('/(hr)/applicants')}>
                    <ThemedText style={[styles.linkText, { color: theme.primary }]} type="small">
                      Xem ngay ›
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
              {expiringJobs.map((job) => (
                <View key={job.id} style={styles.attentionRow}>
                  <View style={[styles.attentionIcon, { backgroundColor: '#f7eddc' }]}>
                    <Clock size={15} color={theme.text} />
                  </View>
                  <ThemedText style={styles.attentionText} type="small" numberOfLines={2}>
                    Tin {job.tieuDe || `#${job.id}`} hết hạn trong {daysUntil(job.ngayHetHan)} ngày
                  </ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/hr/jobs-form?id=${job.id}`)}>
                    <ThemedText style={[styles.linkText, { color: theme.primary }]} type="small">
                      Gia hạn ›
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  trailing,
  trailingLabel,
  onTrailing,
  children,
}: {
  title: string;
  subtitle?: string;
  trailing?: string;
  trailingLabel?: string;
  onTrailing?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionHeadTexts}>
          <ThemedText style={styles.sectionTitle} type="smallBold">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={{ color: theme.textSecondary }} type="code">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {trailing ? (
          <ThemedText style={{ color: theme.textSecondary }} type="code">
            {trailing}
          </ThemedText>
        ) : null}
        {trailingLabel && onTrailing ? (
          <Pressable accessibilityRole="button" onPress={onTrailing}>
            <ThemedText style={[styles.linkText, { color: theme.primary }]} type="small">
              {trailingLabel} ›
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function AttentionBlock({
  icon,
  title,
  value,
  note,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  note: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.attentionBlock, { borderTopColor: theme.border }]}>
      <View style={styles.attentionBlockHead}>
        {icon}
        <ThemedText type="small">{title}</ThemedText>
      </View>
      <ThemedText style={styles.attentionValue}>{value}</ThemedText>
      <ThemedText style={{ color: theme.textSecondary }} type="code">
        {note}
      </ThemedText>
    </View>
  );
}

function getTrangThai(job: HrJob): number {
  const text = job.trangThai;
  if (/^\d+$/.test(text)) return Number(text);
  const map: Record<string, number> = {
    dangtuyen: 3,
    tamdung: 4,
    hethan: 5,
    dadong: 6,
  };
  return map[text.toLowerCase()] ?? -1;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  headerTexts: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: font('semibold'), fontSize: 20, letterSpacing: -0.3 },
  headerDesc: { fontSize: 13, lineHeight: 18 },
  greeting: { fontSize: 13 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoNote: { fontSize: 11 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { borderRadius: Radius['2xl'], borderWidth: 1, padding: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  sectionHeadTexts: { flex: 1, gap: 2 },
  sectionTitle: { fontSize: 15 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  trendCol: { flex: 1, alignItems: 'center', gap: 4 },
  trendCount: { fontSize: 10 },
  trendTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  trendFill: { width: '100%', borderRadius: 4 },
  attentionGrid: { gap: 0 },
  attentionBlock: { paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  attentionBlockHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attentionValue: { fontFamily: font('bold'), fontSize: 26, lineHeight: 30 },
  stageGrid: { gap: 8 },
  stageBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, borderWidth: 1, padding: 12 },
  stageIndex: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stageIndexText: { fontSize: 11 },
  stageTexts: { flex: 1, gap: 1 },
  stageCount: { fontFamily: font('bold'), fontSize: 20 },
  stageFootnote: { fontSize: 11, textAlign: 'right' },
  rows: {},
  inlineEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  jobRowBody: { flex: 1, gap: 3 },
  jobMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  freshPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  memberAvatar: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 11 },
  memberBody: { flex: 1, gap: 1 },
  memberStats: { alignItems: 'flex-end' },
  memberStat: { fontFamily: font('semibold'), fontSize: 12 },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  attentionIcon: { width: 30, height: 30, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  attentionText: { flex: 1, fontSize: 13 },
  linkText: { fontFamily: font('semibold'), fontSize: 12 },
});
