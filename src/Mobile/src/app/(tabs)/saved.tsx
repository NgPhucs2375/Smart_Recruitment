import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { JobCard } from '@/features/jobs/components/job-card';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { jobsApi } from '@/features/jobs/api/jobs-api';
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
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Việc làm đã lưu</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Những cơ hội bạn muốn xem lại.
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {!isLoaded || loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <ThemedText style={styles.emptyTitle}>
                  {error ? 'Không tải được việc làm đã lưu' : 'Chưa có việc làm nào được lưu'}
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {error ?? 'Chạm biểu tượng ngôi sao trên một tin tuyển dụng để lưu tại đây.'}
                </ThemedText>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 },
  header: { paddingTop: 20, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
