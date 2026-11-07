import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Bookmark, Building2, MapPin } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Palette, Radius } from '@/constants/theme';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { jobsApi } from '@/features/jobs/api/jobs-api';
import { JobCard } from '@/features/jobs/components/job-card';
import type { Job } from '@/features/jobs/types';
import { companiesApi, companyInitials } from '@/features/companies/api/companies-api';
import { useFollowedCompanies } from '@/features/companies/followed-companies';
import type { Company } from '@/features/companies/types';
import { Monogram } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export default function SavedJobsScreen() {
  const theme = useTheme();
  const { ids, isLoaded } = useBookmarks();
  const { followedIds, hydrated: followsLoaded, toggle: toggleFollow } = useFollowedCompanies();
  const [activeList, setActiveList] = useState<'jobs' | 'companies'>('jobs');
  const [followedResult, setFollowedResult] = useState<{ key: string; companies: Company[] }>({ key: '', companies: [] });
  const [result, setResult] = useState<{
    key: string;
    jobs: Job[];
    error: string | null;
  }>({ key: '', jobs: [], error: null });
  const requestKey = ids.join('|');
  const followedKey = followedIds.join('|');
  const followedCompanies = followedResult.key === followedKey ? followedResult.companies : [];
  const jobs = result.key === requestKey ? result.jobs : [];
  const error = result.key === requestKey ? result.error : null;
  const loading = !isLoaded || (ids.length > 0 && result.key !== requestKey);

  useEffect(() => {
    let active = true;
    if (!isLoaded || ids.length === 0) return;

    Promise.all(ids.map((id) => jobsApi.getJobById(id)))
      .then((results) => {
        if (active) {
          setResult({
            key: requestKey,
            jobs: results.filter((job): job is Job => job !== null),
            error: null,
          });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult({
            key: requestKey,
            jobs: [],
            error: reason instanceof Error ? reason.message : 'Không thể tải việc làm đã lưu.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [ids, isLoaded, requestKey]);

  useEffect(() => {
    let active = true;
    if (!followsLoaded || followedIds.length === 0) {
      return () => {
        active = false;
      };
    }
    Promise.all(followedIds.map((id) => companiesApi.getCompanyById(id)))
      .then((results) => {
        if (active) setFollowedResult({ key: followedKey, companies: results.filter((company): company is Company => company !== null) });
      })
      .catch(() => {
        if (active) setFollowedResult({ key: followedKey, companies: [] });
      });
    return () => {
      active = false;
    };
  }, [followedIds, followedKey, followsLoaded]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />
      <View style={styles.switcherWrap}>
        <View style={[styles.switcher, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeList === 'jobs' }}
            onPress={() => setActiveList('jobs')}
            style={[styles.switcherItem, activeList === 'jobs' && { backgroundColor: theme.primary }]}>
            <Bookmark size={15} color={activeList === 'jobs' ? theme.primaryForeground : theme.textSecondary} />
            <ThemedText style={[styles.switcherText, { color: activeList === 'jobs' ? theme.primaryForeground : theme.textSecondary }]}>Việc làm</ThemedText>
            <ThemedText style={[styles.switcherCount, { color: activeList === 'jobs' ? theme.primaryForeground : theme.textSecondary }]}>{ids.length}</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeList === 'companies' }}
            onPress={() => setActiveList('companies')}
            style={[styles.switcherItem, activeList === 'companies' && { backgroundColor: theme.primary }]}>
            <Building2 size={15} color={activeList === 'companies' ? theme.primaryForeground : theme.textSecondary} />
            <ThemedText style={[styles.switcherText, { color: activeList === 'companies' ? theme.primaryForeground : theme.textSecondary }]}>Công ty</ThemedText>
            <ThemedText style={[styles.switcherCount, { color: activeList === 'companies' ? theme.primaryForeground : theme.textSecondary }]}>{followedIds.length}</ThemedText>
          </Pressable>
        </View>
      </View>
      {activeList === 'companies' ? (
        <FlatList
          data={followedCompanies}
          keyExtractor={(company) => String(company.id)}
          contentContainerStyle={[styles.content, styles.companyList]}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}><Building2 size={21} color={theme.primary} /></View>
                <View style={styles.titleCopy}>
                  <ThemedText style={[styles.title, { color: theme.text }]}>Công ty đã lưu</ThemedText>
                  <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Doanh nghiệp bạn muốn cập nhật.</ThemedText>
                </View>
              </View>
              {followedIds.length > 0 ? <View style={[styles.countPill, { backgroundColor: theme.backgroundSelected }]}><ThemedText style={[styles.countPillText, { color: theme.primary }]}>{`${followedIds.length} công ty`}</ThemedText></View> : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {!followsLoaded || (followedIds.length > 0 && followedResult.key !== followedKey) ? <ActivityIndicator color={theme.primary} /> : (
                <View style={styles.emptyInner}>
                  <View style={[styles.emptyIconBox, { backgroundColor: theme.backgroundSelected }]}><Building2 size={25} color={theme.primary} /></View>
                  <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Chưa theo dõi công ty nào</ThemedText>
                  <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>Theo dõi công ty từ trang chi tiết để lưu lại tại đây.</ThemedText>
                  <View style={styles.emptyActions}><Button pill onPress={() => router.push('/companies')}>Khám phá công ty</Button></View>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.companyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/companies/${item.id}`)} style={styles.companyMain}>
                <Monogram label={companyInitials(item.name)} size={52} radius={14} fontSize={17} />
                <View style={styles.companyCopy}>
                  <ThemedText numberOfLines={2} style={[styles.companyName, { color: theme.text }]}>{item.name}</ThemedText>
                  <ThemedText numberOfLines={1} style={[styles.companyMeta, { color: theme.textSecondary }]}>{item.industry || 'Doanh nghiệp'}</ThemedText>
                  {item.address ? <View style={styles.companyLocation}><MapPin size={12} color={theme.primary} /><ThemedText numberOfLines={1} style={[styles.companyLocationText, { color: theme.textSecondary }]}>{item.address}</ThemedText></View> : null}
                </View>
              </Pressable>
              <View style={[styles.companyActions, { borderTopColor: theme.border }]}>
                <Pressable accessibilityRole="button" onPress={() => router.push(`/companies/${item.id}`)} style={styles.companyAction}>
                  <ThemedText style={[styles.companyActionText, { color: theme.primary }]}>Xem công ty</ThemedText>
                </Pressable>
                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
                <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ theo dõi ${item.name}`} onPress={() => toggleFollow(item.id)} style={styles.companyAction}>
                  <ThemedText style={[styles.companyActionText, { color: theme.textSecondary }]}>Bỏ theo dõi</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Web DaLuuView: icon box bg-sandsoft + Bookmark bronze */}
            <View style={styles.titleRow}>
              <View style={[styles.iconBox, { backgroundColor: Palette.sandsoft }]}>
                <Bookmark size={22} color={Palette.bronze} />
              </View>
              <View style={styles.titleCopy}>
                <ThemedText style={[styles.title, { color: theme.text }]}>
                  Việc làm đã lưu
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Những cơ hội bạn muốn xem lại.
                </ThemedText>
              </View>
            </View>
            {ids.length > 0 ? (
              <View style={[styles.countPill, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={[styles.countPillText, { color: theme.primary }]}>
                  {`${ids.length} việc đã lưu`}
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {!isLoaded || loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <View style={styles.emptyInner}>
                <View style={[styles.emptyIconBox, { backgroundColor: Palette.sandsoft }]}>
                  <Bookmark size={26} color={Palette.bronze} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  {error ? 'Không tải được việc làm đã lưu' : 'Chưa có việc làm nào được lưu'}
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  {error ??
                    'Chạm biểu tượng bookmark trên một tin tuyển dụng để lưu tại đây.'}
                </ThemedText>
                <View style={styles.emptyActions}>
                  <Button pill onPress={() => router.push('/')}>
                    Tìm việc làm
                  </Button>
                </View>
              </View>
            )}
          </View>
        }
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  switcherWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 2 },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: Radius.xl, borderWidth: 1, gap: 4 },
  switcherItem: { flex: 1, minHeight: 42, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  switcherText: { fontFamily: font('semibold'), fontSize: 12 },
  switcherCount: { fontFamily: font('semibold'), fontSize: 11, opacity: 0.85 },
  content: { paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 },
  header: { paddingTop: 18, paddingBottom: 20, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: { flex: 1, gap: 3 },
  title: { fontFamily: font('semibold'), fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  countPillText: { fontFamily: font('semibold'), fontSize: 12 },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyInner: { alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: font('semibold'), fontSize: 16, textAlign: 'center' },
  emptyMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300 },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  companyList: { paddingTop: 6 },
  companyCard: { marginBottom: 12, paddingHorizontal: 15, paddingTop: 15, borderWidth: 1, borderRadius: Radius['2xl'] },
  companyMain: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 60, paddingBottom: 14 },
  companyCopy: { flex: 1, minWidth: 0, gap: 4 },
  companyName: { fontFamily: font('semibold'), fontSize: 14, lineHeight: 20 },
  companyMeta: { fontFamily: font('medium'), fontSize: 12 },
  companyLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  companyLocationText: { flex: 1, fontFamily: font('regular'), fontSize: 11 },
  companyActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, minHeight: 42 },
  companyAction: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  companyActionText: { fontFamily: font('semibold'), fontSize: 12 },
  actionDivider: { width: StyleSheet.hairlineWidth, height: 18 },
});
