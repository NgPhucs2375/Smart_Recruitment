import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Briefcase, CalendarDays, FileCheck2, TrendingUp, Users } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip, HrLoadingState, HrScreenShell, HrTopBar, KpiCard, NoticeBar } from '@/features/hr/components/hr-primitives';
import { getBaoCao } from '@/features/hr/api/hr-api';
import { REPORT_PERIODS } from '@/features/hr/constants';
import type { BaoCao } from '@/features/hr/types';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SEGMENT_COLORS = ['#2563EB', '#0EA5E9', '#16A34A', '#DC2626', '#94A3B8'];
const RING_SIZE = 168;
const RING_RADIUS = 64;
const RING_DOTS = 48;
const RING_DOT = 10;

function fmtPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 10) / 10}%`.replace('.0%', '%');
}

function segTotal(report: BaoCao): number {
  return report.KetQua.reduce((sum, row) => sum + (row.SoLuong || 0), 0);
}

/** Vòng tròn tỉ trọng vẽ bằng chấm tuyệt đối (không dùng thư viện chart). */
function DonutRing({ report }: { report: BaoCao }) {
  const theme = useTheme();
  const total = segTotal(report);
  const dots: { left: number; top: number; color: string }[] = [];

  if (total > 0) {
    const cumulative = report.KetQua.reduce<number[]>(
      (acc, row) => [...acc, (acc[acc.length - 1] ?? 0) + (row.SoLuong || 0)],
      [],
    );
    const bounds = report.KetQua.map((row, index) => ({
      start: (cumulative[index - 1] ?? 0) / total,
      end: cumulative[index]! / total,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]!,
    }));
    for (let i = 0; i < RING_DOTS; i += 1) {
      const fraction = (i + 0.5) / RING_DOTS;
      const angle = fraction * Math.PI * 2 - Math.PI / 2;
      const match = bounds.find((bound) => fraction >= bound.start && fraction < bound.end) ?? bounds[bounds.length - 1]!;
      dots.push({
        left: RING_SIZE / 2 + Math.cos(angle) * RING_RADIUS - RING_DOT / 2,
        top: RING_SIZE / 2 + Math.sin(angle) * RING_RADIUS - RING_DOT / 2,
        color: match.color,
      });
    }
  }

  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ring, { backgroundColor: theme.backgroundSelected }]}>
        {dots.map((dot, index) => (
          <View
            key={index}
            style={[styles.ringDot, { left: dot.left, top: dot.top, backgroundColor: dot.color }]}
          />
        ))}
        <View style={styles.ringCenter}>
          <ThemedText style={styles.ringValue}>{total}</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }} type="code">
            đơn
          </ThemedText>
        </View>
      </View>
      <View style={styles.legend}>
        {report.KetQua.map((row, index) => (
          <View key={row.TrangThaiId} style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length]! }]}
            />
            <ThemedText style={styles.legendLabel} type="small" numberOfLines={1}>
              {row.TrangThai}
            </ThemedText>
            <ThemedText style={[styles.legendValue, { color: theme.textSecondary }]} type="code">
              {row.SoLuong}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const theme = useTheme();
  const [ky, setKy] = useState(30);
  const [report, setReport] = useState<BaoCao | null>(null);
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
    async (targetKy = ky, silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const result = await getBaoCao(targetKy);
        if (!mountedRef.current) return;
        setReport(result);
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Không tải được báo cáo.');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [ky],
  );

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const trend = (report?.XuHuong ?? []).slice(-14);
  const trendMax = Math.max(1, ...trend.map((point) => point.SoLuong));
  const topMax = Math.max(1, ...(report?.TopTin ?? []).map((row) => row.SoLuong));
  const generated = report ? new Date(report.GeneratedAtUtc) : null;

  return (
    <HrScreenShell>
      <HrTopBar title="Báo cáo tuyển dụng" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(ky, true);
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {REPORT_PERIODS.map((period) => (
            <Chip
              key={period.id}
              label={period.label}
              active={ky === period.ky}
              onPress={() => setKy(period.ky)}
            />
          ))}
        </ScrollView>

        {error ? <NoticeBar kind="error" message={error} /> : null}

        {loading && !report ? (
          <HrLoadingState label="Đang tải báo cáo…" />
        ) : report ? (
          <>
            <ThemedText style={[styles.stamp, { color: theme.textSecondary }]} type="code">
              {report.PhamVi ? `Phạm vi: ${report.PhamVi} • ` : ''}
              Cập nhật{' '}
              {generated && !Number.isNaN(generated.getTime())
                ? generated.toLocaleString('vi-VN')
                : '—'}
              {report.KyNgay ? ` • ${report.KyNgay} ngày qua` : ''}
            </ThemedText>

            <View style={styles.kpiRow}>
              <KpiCard
                icon={<Briefcase size={15} color={theme.primary} />}
                label="TIN ĐÃ ĐĂNG"
                value={String(report.TinDaDang)}
                sub={`${fmtPct(report.TyLeTin)} so với kỳ trước`}
              />
              <KpiCard
                icon={<TrendingUp size={15} color={theme.primary} />}
                label="LƯỢT NỘP"
                value={String(report.LuotNop)}
                sub={`${fmtPct(report.TyLeNop)} so với kỳ trước`}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                icon={<Users size={15} color={theme.primary} />}
                label="ỨNG VIÊN DUY NHẤT"
                value={String(report.UngVienDuyNhat)}
                sub="trong kỳ"
              />
              <KpiCard
                icon={<FileCheck2 size={15} color={theme.primary} />}
                label="TỶ LỆ DUYỆT TIN"
                value={`${report.DuyetTin.TyLeDuyet ?? 0}%`}
                sub={`${report.DuyetTin.DaDuyet} đã • ${report.DuyetTin.ChoDuyet} chờ • ${report.DuyetTin.TuChoi} từ chối`}
              />
            </View>

            <View style={[styles.block, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.blockTitle} type="smallBold">
                Kết quả xử lý đơn
              </ThemedText>
              <DonutRing report={report} />
            </View>

            <View style={[styles.block, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.blockTitle} type="smallBold">
                Xu hướng lượt nộp
              </ThemedText>
              {trend.length === 0 ? (
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Chưa có dữ liệu trong kỳ.
                </ThemedText>
              ) : (
                <>
                  <View style={styles.bars}>
                    {trend.map((point, index) => {
                      const height = Math.max(4, Math.round((point.SoLuong / trendMax) * 96));
                      return (
                        <View key={`${point.Ngay}-${index}`} style={styles.barSlot}>
                          <ThemedText style={[styles.barValue, { color: theme.textSecondary }]} type="code">
                            {point.SoLuong}
                          </ThemedText>
                          <View
                            style={[
                              styles.bar,
                              { height, backgroundColor: index === trend.length - 1 ? theme.primary : `${theme.primary}66` },
                            ]}
                          />
                          <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]} type="code">
                            {point.Ngay.slice(8)}/{point.Ngay.slice(5, 7)}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                  {report.XuHuong.length > trend.length ? (
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      Hiển thị {trend.length} ngày gần nhất (kỳ có {report.XuHuong.length} ngày).
                    </ThemedText>
                  ) : null}
                </>
              )}
            </View>

            <View style={[styles.block, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.blockTitle} type="smallBold">
                Tin nổi bật ({report.TopTin.length})
              </ThemedText>
              {report.TopTin.length === 0 ? (
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Chưa có tin trong kỳ.
                </ThemedText>
              ) : (
                report.TopTin.map((row) => (
                  <View key={row.Id} style={styles.topRow}>
                    <ThemedText style={styles.topTitle} numberOfLines={2} type="small">
                      {row.TieuDe}
                    </ThemedText>
                    <View style={[styles.topTrack, { backgroundColor: theme.backgroundSelected }]}>
                      <View
                        style={[
                          styles.topFill,
                          { width: `${Math.round((row.SoLuong / topMax) * 100)}%`, backgroundColor: theme.primary },
                        ]}
                      />
                    </View>
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      {row.SoLuong} đơn • {row.TrangThai}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.block, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.blockTitle} type="smallBold">
                Duyệt tin
              </ThemedText>
              <View style={styles.statRow}>
                {[
                  { label: 'Đã duyệt', value: report.DuyetTin.DaDuyet, color: theme.primary },
                  { label: 'Chờ duyệt', value: report.DuyetTin.ChoDuyet, color: '#D97706' },
                  { label: 'Từ chối', value: report.DuyetTin.TuChoi, color: theme.destructive },
                  { label: 'Nháp', value: report.DuyetTin.Nhap, color: theme.textSecondary },
                ].map((stat) => (
                  <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText style={[styles.statValue, { color: stat.color }]}>{stat.value}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      {stat.label}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.periodNote}>
              <CalendarDays size={13} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary }} type="code">
                Kỳ báo cáo: {REPORT_PERIODS.find((period) => period.ky === ky)?.label ?? '—'}
              </ThemedText>
            </View>
          </>
        ) : null}
      </ScrollView>
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  chipRow: { gap: 8, paddingRight: 8 },
  stamp: { fontSize: 11 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  block: { borderRadius: Radius.xl, borderWidth: 1, padding: 14, gap: 12 },
  blockTitle: { fontSize: 14 },
  ringWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  ring: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  ringDot: { position: 'absolute', width: RING_DOT, height: RING_DOT, borderRadius: RING_DOT / 2 },
  ringCenter: { alignItems: 'center' },
  ringValue: { fontFamily: font('bold'), fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  legend: { flex: 1, minWidth: 140, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1 },
  legendValue: { fontFamily: font('medium') },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, minHeight: 130 },
  barSlot: { flex: 1, alignItems: 'center', gap: 3 },
  barValue: { fontSize: 9 },
  bar: { width: '80%', borderRadius: 4 },
  barLabel: { fontSize: 9 },
  topRow: { gap: 5 },
  topTitle: { fontFamily: font('medium') },
  topTrack: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  topFill: { height: '100%', borderRadius: Radius.pill },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { flexGrow: 1, minWidth: 74, borderRadius: Radius.lg, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: font('bold'), fontSize: 20 },
  periodNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
});
