import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Bookmark } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Palette, Radius } from '@/constants/theme';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { jobsApi } from '@/features/jobs/api/jobs-api';
import { JobCard } from '@/features/jobs/components/job-card';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

export default function SavedJobsScreen() {
  const theme = useTheme();
  const { ids, isLoaded } = useBookmarks();
  const [result, setResult] = useState<{
    key: string;
    jobs: Job[];
    error: string | null;
  }>({ key: '', jobs: [], error: null });
  const requestKey = ids.join('|');
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

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
});
