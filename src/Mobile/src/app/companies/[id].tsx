import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Building2,
  Globe,
  MapPin,
  Users,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Monogram } from '@/components/ui/card';
import { font, Palette, Radius } from '@/constants/theme';
import { companyInitials, companiesApi } from '@/features/companies/api/companies-api';
import { useFollowedCompanies } from '@/features/companies/followed-companies';
import type { Company } from '@/features/companies/types';
import { JobCard } from '@/features/jobs/components/job-card';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { isFollowed, toggle } = useFollowedCompanies();
  const companyId = Number(id);
  const invalidId = !Number.isFinite(companyId) || companyId <= 0;

  const [result, setResult] = useState<{
    id: string;
    company: Company | null;
    jobs: Job[];
    error: string | null;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const current = result?.id === id ? result : null;
  const company = current?.company ?? null;
  const jobs = current?.jobs ?? [];
  const error = current?.error ?? null;
  const loading = !invalidId && current === null;

  const fetchDetail = useCallback(
    () =>
      Promise.all([
        companiesApi.getCompanyById(companyId),
        companiesApi.getCompanyJobs(companyId),
      ]),
    [companyId],
  );

  useEffect(() => {
    if (invalidId) return;
    let active = true;
    fetchDetail()
      .then(([companyData, jobData]) => {
        if (active) setResult({ id, company: companyData, jobs: jobData, error: null });
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult({
            id,
            company: null,
            jobs: [],
            error: reason instanceof Error ? reason.message : 'Không tải được doanh nghiệp.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [fetchDetail, id, invalidId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail()
      .then(([companyData, jobData]) =>
        setResult({ id, company: companyData, jobs: jobData, error: null }),
      )
      .catch((reason: unknown) =>
        setResult({
          id,
          company: null,
          jobs: [],
          error: reason instanceof Error ? reason.message : 'Không tải được doanh nghiệp.',
        }),
      )
      .finally(() => setRefreshing(false));
  }, [fetchDetail, id]);

  const handleRetry = useCallback(() => {
    fetchDetail()
      .then(([companyData, jobData]) =>
        setResult({ id, company: companyData, jobs: jobData, error: null }),
      )
      .catch((reason: unknown) =>
        setResult({
          id,
          company: null,
          jobs: [],
          error: reason instanceof Error ? reason.message : 'Không tải được doanh nghiệp.',
        }),
      );
  }, [fetchDetail, id]);

  const followed = company ? isFollowed(company.id) : false;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Top bar — theo pattern jobs/[id].tsx (route ngoài tabs). */}
      <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.topBarTitle} numberOfLines={1}>
          Chi tiết công ty
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error || !company ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>
            {error ? 'Không tải được doanh nghiệp' : 'Không tìm thấy doanh nghiệp'}
          </ThemedText>
          {error ? (
            <ThemedText style={[styles.errorBody, { color: theme.textSecondary }]}>{error}</ThemedText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={[styles.stateButton, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.stateButtonText, { color: theme.primary }]}>Thử lại</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }>
          {/* Header — mirror CompanyHeader của Web (banner + avatar + follow). */}
          <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.heroBanner} />
            <View style={styles.heroBody}>
              <View style={[styles.avatarWrap, { backgroundColor: theme.backgroundElement }]}>
                <Monogram label={companyInitials(company.name)} size={80} radius={Radius['2xl']} fontSize={26} />
              </View>
              <View style={styles.heroTitleBlock}>
                <ThemedText style={styles.heroLabel}>Doanh nghiệp</ThemedText>
                <ThemedText style={[styles.heroName, { color: theme.text }]} numberOfLines={3}>
                  {company.name}
                </ThemedText>
              </View>
            </View>

            <View style={styles.tagRow}>
              {company.industry ? (
                <View style={[styles.tag, { backgroundColor: theme.muted, borderColor: theme.border }]}>
                  <Building2 size={12} color={Palette.sage} />
                  <ThemedText numberOfLines={1} style={[styles.tagText, { color: theme.textSecondary }]}>
                    {company.industry}
                  </ThemedText>
                </View>
              ) : null}
              {company.address ? (
                <View style={[styles.tag, { backgroundColor: theme.muted, borderColor: theme.border }]}>
                  <MapPin size={12} color={Palette.sage} />
                  <ThemedText numberOfLines={2} style={[styles.tagText, { color: theme.textSecondary }]}>
                    {company.address}
                  </ThemedText>
                </View>
              ) : null}
              {company.size ? (
                <View style={[styles.tag, { backgroundColor: theme.muted, borderColor: theme.border }]}>
                  <Users size={12} color={Palette.sage} />
                  <ThemedText numberOfLines={1} style={[styles.tagText, { color: theme.textSecondary }]}>
                    {company.size}
                  </ThemedText>
                </View>
              ) : null}
              {company.website ? (
                <View style={[styles.tag, { backgroundColor: theme.muted, borderColor: theme.border }]}>
                  <Globe size={12} color={Palette.sage} />
                  <ThemedText numberOfLines={1} style={[styles.tagText, { color: theme.textSecondary }]}>
                    Website
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: followed }}
              onPress={() => toggle(company.id)}
              style={({ pressed }) => [
                styles.followButton,
                followed
                  ? { backgroundColor: theme.backgroundSelected, borderColor: theme.border }
                  : { backgroundColor: theme.primary, borderColor: theme.primary },
                { opacity: pressed ? 0.96 : 1 },
              ]}>
              {followed ? (
                <BellOff size={16} color={theme.primaryHover} />
              ) : (
                <Bell size={16} color={theme.primaryForeground} />
              )}
              <ThemedText
                style={[
                  styles.followText,
                  { color: followed ? theme.primaryHover : theme.primaryForeground },
                ]}>
                {followed ? 'Đang theo dõi' : 'Theo dõi'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Giới thiệu
            </ThemedText>
            <ThemedText style={[styles.sectionText, { color: theme.text }]}>
              {company.description || 'Chưa có giới thiệu về doanh nghiệp.'}
            </ThemedText>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Thông tin công ty
            </ThemedText>
            <InfoRow label="Lĩnh vực" value={company.industry} />
            <InfoRow label="Quy mô" value={company.size} divider />
            <InfoRow label="Địa điểm" value={company.address} divider />
            <InfoRow label="Website" value={company.website} divider />
            {company.taxCode ? <InfoRow label="Mã số thuế" value={company.taxCode} divider /> : null}
          </View>

          <View style={styles.jobsHeader}>
            <ThemedText style={[styles.jobsTitle, { color: theme.text }]}>
              {`Việc đang tuyển (${jobs.length})`}
            </ThemedText>
          </View>

          {jobs.length === 0 ? (
            <Card style={styles.emptyJobs}>
              <ThemedText style={[styles.emptyJobsText, { color: theme.textSecondary }]}>
                Doanh nghiệp này chưa có tin tuyển dụng đang mở.
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.jobsList}>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.infoRow,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
      ]}>
      <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
        {value || 'Đang cập nhật'}
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
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  hero: { borderRadius: Radius['3xl'], borderWidth: 1, overflow: 'hidden' },
  heroBanner: { height: 72, backgroundColor: Palette.navy },
  heroBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingHorizontal: 20, marginTop: -36 },
  avatarWrap: { borderRadius: Radius['2xl'], borderWidth: 4, padding: 0 },
  heroTitleBlock: { flex: 1, minWidth: 0, paddingBottom: 4, gap: 3 },
  heroLabel: {
    fontFamily: font('semibold'),
    fontSize: 11,
    color: Palette.navy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroName: { fontFamily: font('semibold'), fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  tagText: { fontFamily: font('medium'), fontSize: 11, flexShrink: 1 },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  followText: { fontFamily: font('semibold'), fontSize: 14 },
  sectionCard: { borderRadius: Radius['2xl'], borderWidth: 1, padding: 20, gap: 12 },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionText: { fontFamily: font('regular'), fontSize: 14, lineHeight: 23 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingTop: 4 },
  infoLabel: { fontFamily: font('regular'), fontSize: 13, flexShrink: 1 },
  infoValue: { fontFamily: font('semibold'), fontSize: 13, textAlign: 'right', flexShrink: 1 },
  jobsHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  jobsTitle: { fontFamily: font('semibold'), fontSize: 17, flex: 1 },
  jobsList: { gap: 0 },
  emptyJobs: { padding: 20 },
  emptyJobsText: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, marginTop: 6 },
  stateButtonText: { fontFamily: font('bold'), fontSize: 13 },
});
