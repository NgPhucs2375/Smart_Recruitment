import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bookmark,
  Building2,
  Home,
  Laptop,
  MapPin,
  Send,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { safeBack } from '@/utils/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monogram } from '@/components/ui/card';
import { SalaryPill } from '@/components/ui/pill';
import { font, Palette, Radius } from '@/constants/theme';
import { applicationsApi } from '@/features/applications/api/applications-api';
import { QuickApplySheet } from '@/features/applications/components/quick-apply-sheet';
import type { ApplyResult } from '@/features/applications/types';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { jobsApi } from '@/features/jobs/api/jobs-api';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

const CARD_RADIUS = 32; // Web: rounded-[2rem]

function workModeIcon(mode: string, size: number, color: string) {
  if (mode === 'Remote') return <Home size={size} color={color} />;
  if (mode === 'Hybrid') return <Laptop size={size} color={color} />;
  return <Building2 size={size} color={color} />;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [result, setResult] = useState<{ id: string; job: Job | null; error: string | null } | null>(null);
  const [appliedState, setAppliedState] = useState<{ id: string; value: boolean } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const currentResult = result?.id === id ? result : null;
  const job = currentResult?.job ?? null;
  const error = currentResult?.error ?? null;
  const loading = currentResult === null;
  const applied = appliedState?.id === id ? appliedState.value : false;

  useEffect(() => {
    let active = true;
    jobsApi
      .getJobById(id)
      .then((next) => {
        if (active) setResult({ id, job: next, error: null });
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult({
            id,
            job: null,
            error: reason instanceof Error ? reason.message : 'Không thể tải tin tuyển dụng.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    applicationsApi
      .hasApplied(id)
      .then((value) => {
        if (active) setAppliedState({ id, value });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  const handleApplied = (applyResult: ApplyResult) => {
    setAppliedState({ id, value: true });
    setNotice(
      applyResult.source === 'demo'
        ? 'Đã nộp hồ sơ ở chế độ minh họa.'
        : applyResult.message,
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => safeBack('/')}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.topBarTitle} numberOfLines={1}>
          Chi tiết việc làm
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error || !job ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>
            {error ? 'Không tải được tin tuyển dụng' : 'Không tìm thấy việc làm'}
          </ThemedText>
          {error ? (
            <ThemedText style={[styles.errorBody, { color: theme.textSecondary }]}>{error}</ThemedText>
          ) : null}
        </View>
      ) : (
        <>
          <JobDetailContent
            job={job}
            applied={applied}
            saved={isBookmarked(job.id)}
            onToggleBookmark={() => toggleBookmark(job.id)}
            onApply={() => setSheetOpen(true)}
            notice={notice}
          />
          <QuickApplySheet
            visible={sheetOpen}
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
            location={job.location}
            salary={job.salary}
            onClose={() => setSheetOpen(false)}
            onApplied={handleApplied}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function JobDetailContent({
  job,
  applied,
  saved,
  onToggleBookmark,
  onApply,
  notice,
}: {
  job: Job;
  applied: boolean;
  saved: boolean;
  onToggleBookmark: () => void;
  onApply: () => void;
  notice: string | null;
}) {
  const theme = useTheme();
  const initial = job.company.slice(0, 2).toUpperCase() || 'NT';

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notice ? (
          <View style={[styles.notice, { backgroundColor: `${theme.destructive}14` }]}>
            <ThemedText style={[styles.noticeText, { color: theme.text }]}>✓ {notice}</ThemedText>
          </View>
        ) : null}

        <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.heroRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.muted }]}>
              <Building2 size={24} color={theme.primary} />
            </View>
            <View style={styles.heroMain}>
              <ThemedText style={styles.jobTitle} numberOfLines={3}>
                {job.title || `Tin tuyển dụng #${job.id}`}
              </ThemedText>
              <ThemedText style={[styles.company, { color: theme.textSecondary }]} numberOfLines={2}>
                {job.company || 'Nhà tuyển dụng'}
              </ThemedText>

              <View style={styles.pillsRow}>
                <SalaryPill icon={<Banknote size={14} color={theme.primary} />}>{job.salary}</SalaryPill>
                {job.location ? (
                  <View style={[styles.metaPill, { backgroundColor: theme.muted, borderColor: theme.border }]}>
                    <MapPin size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.metaPillText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {job.location}
                    </ThemedText>
                  </View>
                ) : null}
                {job.workMode ? (
                  <View style={[styles.metaPill, { backgroundColor: `${theme.primary}0D`, borderColor: `${theme.primary}33` }]}>
                    {workModeIcon(job.workMode, 14, theme.primary)}
                    <ThemedText style={[styles.metaPillText, { color: theme.primary }]} numberOfLines={1}>
                      {job.workMode}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.badgesRow}>
                {job.level ? <Badge>{job.level}</Badge> : null}
                {job.employmentType ? <Badge variant="outline">{job.employmentType}</Badge> : null}
                {job.workMode ? <Badge variant="outline">{job.workMode}</Badge> : null}
                {job.skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 6 ? <Badge variant="outline">{`+${job.skills.length - 6}`}</Badge> : null}
              </View>
            </View>
          </View>

          <View style={[styles.ctaRow, { borderTopColor: theme.border }]}>
            {applied ? (
              <View style={[styles.appliedPill, { backgroundColor: `${Palette.sage}1A` }]}>
                <BadgeCheck size={16} color={theme.primary} />
                <ThemedText style={[styles.appliedPillText, { color: theme.primary }]}>
                  Bạn đã ứng tuyển tin này
                </ThemedText>
              </View>
            ) : (
              <Button pill onPress={onApply} icon={<Send size={16} color={theme.primaryForeground} />}>
                Ứng tuyển ngay
              </Button>
            )}
          </View>
        </View>

        <View style={[styles.bodyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Mô tả công việc</ThemedText>
          <ThemedText style={[styles.bodyText, { color: theme.text }]}>
            {job.description || 'Chưa có mô tả chi tiết cho vị trí này.'}
          </ThemedText>
        </View>

        <View style={[styles.asideCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Tổng quan</ThemedText>
          <View style={styles.overview}>
            <OverviewRow label="Mức lương" value={job.salary} />
            <OverviewRow label="Địa điểm" value={job.location || 'Không nêu'} divider />
            <OverviewRow label="Phương thức" value={job.workMode || 'Onsite'} divider />
            <OverviewRow label="Cấp bậc" value={job.level || 'Không nêu'} divider />
            <OverviewRow label="Loại hình" value={job.employmentType || 'Không nêu'} divider />
          </View>
        </View>

        {job.skills.length > 0 ? (
          <View style={[styles.asideCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Kỹ năng cần có</ThemedText>
            <View style={styles.skillsRow}>
              {job.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  backgroundColor={`${theme.primary}0D`}
                  color={theme.text}
                  style={{ borderColor: `${theme.primary}33` }}
                >
                  {skill}
                </Badge>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.asideCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Doanh nghiệp</ThemedText>
          <View style={styles.companyRow}>
            <Monogram label={initial} size={40} radius={Radius.lg} fontSize={14} />
            <View style={styles.companyInfo}>
              <ThemedText style={styles.companyName} numberOfLines={1}>
                {job.company || 'Nhà tuyển dụng'}
              </ThemedText>
              <ThemedText style={[styles.companyMeta, { color: theme.textSecondary }]}>
                Đang tuyển dụng trên HIREAI
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
          accessibilityState={{ selected: saved }}
          onPress={onToggleBookmark}
          style={({ pressed }) => [
            styles.saveButton,
            {
              borderColor: saved ? theme.primary : theme.border,
              backgroundColor: saved ? `${theme.primary}0D` : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Bookmark size={18} color={saved ? theme.primary : theme.textSecondary} fill={saved ? theme.primary : 'transparent'} />
          <ThemedText style={[styles.saveLabel, { color: saved ? theme.primary : theme.textSecondary }]}>
            {saved ? 'Đã lưu' : 'Lưu'}
          </ThemedText>
        </Pressable>
        {applied ? (
          <View style={[styles.appliedBarPill, { backgroundColor: `${Palette.sage}1A` }]}>
            <BadgeCheck size={16} color={theme.primary} />
            <ThemedText style={[styles.appliedPillText, { color: theme.primary }]}>Đã ứng tuyển</ThemedText>
          </View>
        ) : (
          <Button pill onPress={onApply} style={styles.applyButton} icon={<Send size={16} color={theme.primaryForeground} />}>
            Ứng tuyển ngay
          </Button>
        )}
      </View>

    </>
  );
}

function OverviewRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.overviewRow,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
      ]}>
      <ThemedText style={[styles.overviewLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.overviewValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontFamily: font('semibold'), fontSize: 15, flex: 1, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  errorTitle: { fontFamily: font('semibold'), fontSize: 17, textAlign: 'center' },
  errorBody: { fontFamily: font('regular'), fontSize: 13, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 24, gap: 16 },
  notice: { borderRadius: Radius.lg, paddingHorizontal: 13, paddingVertical: 10 },
  noticeText: { fontFamily: font('semibold'), fontSize: 12, lineHeight: 17 },
  hero: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 24, gap: 20 },
  heroRow: { flexDirection: 'row', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroMain: { flex: 1, minWidth: 0, gap: 4 },
  jobTitle: { fontFamily: font('semibold'), fontSize: 24, lineHeight: 31, letterSpacing: -0.5 },
  company: { fontFamily: font('regular'), fontSize: 14 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaPillText: { fontFamily: font('medium'), fontSize: 12, flexShrink: 1 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  appliedPillText: { fontFamily: font('semibold'), fontSize: 13 },
  bodyCard: { borderRadius: CARD_RADIUS, borderWidth: 1, padding: 24, gap: 12 },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  bodyText: { fontFamily: font('regular'), fontSize: 14, lineHeight: 23 },
  asideCard: { borderRadius: Radius['2xl'] + 8, borderWidth: 1, padding: 20, gap: 16 },
  overview: { gap: 12 },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  overviewLabel: { fontFamily: font('regular'), fontSize: 13, flexShrink: 1 },
  overviewValue: { fontFamily: font('semibold'), fontSize: 13, textAlign: 'right', flexShrink: 1 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyInfo: { flex: 1, minWidth: 0, gap: 2 },
  companyName: { fontFamily: font('semibold'), fontSize: 14 },
  companyMeta: { fontFamily: font('regular'), fontSize: 12 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  saveButton: {
    minWidth: 76,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  saveLabel: { fontFamily: font('semibold'), fontSize: 10 },
  applyButton: { flex: 1, height: 48 },
  appliedBarPill: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.pill,
  },
});
