import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { JobCard } from '@/features/jobs/components/job-card';
import { jobsApi, USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

export default function JobsScreen() {
  const theme = useTheme();
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    jobs: Job[];
    error: string | null;
  }>({ key: '', jobs: [], error: null });
  const requestKey = `${submittedKeyword}\u0000${reloadKey}`;
  const jobs = result.key === requestKey ? result.jobs : [];
  const error = result.key === requestKey ? result.error : null;
  const loading = result.key !== requestKey;

  useEffect(() => {
    let active = true;

    jobsApi
      .getJobs(submittedKeyword)
      .then(({ jobs: results }) => {
        if (active) setResult({ key: requestKey, jobs: results, error: null });
      })
      .catch((reason: unknown) => {
        if (active) {
          setResult({
            key: requestKey,
            jobs: [],
            error: reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [submittedKeyword, requestKey]);

  const submitSearch = useCallback(() => {
    setSubmittedKeyword(keyword.trim());
    setReloadKey((value) => value + 1);
  }, [keyword]);
  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <ThemedView style={[styles.brandMark, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.brandMarkText}>S</ThemedText>
              </ThemedView>
              <View>
                <ThemedText style={styles.brandName}>Smart Recruitment</ThemedText>
                <ThemedText style={[styles.eyebrow, { color: theme.textSecondary }]}>CƠ HỘI NGHỀ NGHIỆP</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.heading}>Tìm công việc phù hợp với bạn</ThemedText>
            <ThemedText style={[styles.intro, { color: theme.textSecondary }]}>
              Khám phá việc làm và cơ hội phát triển sự nghiệp.
            </ThemedText>

            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <TextInput
                accessibilityLabel="Tìm theo vị trí hoặc kỹ năng"
                value={keyword}
                onChangeText={setKeyword}
                onSubmitEditing={submitSearch}
                placeholder="Vị trí, công ty hoặc kỹ năng"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tìm việc làm"
                onPress={submitSearch}
                style={[styles.searchButton, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.searchButtonText}>Tìm</ThemedText>
              </Pressable>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <ThemedText style={styles.sectionTitle}>Việc làm mới nhất</ThemedText>
                <ThemedText style={[styles.sectionCaption, { color: theme.textSecondary }]}>
                  {loading ? 'Đang cập nhật danh sách' : `${jobs.length} vị trí phù hợp`}
                </ThemedText>
              </View>
              <View style={[styles.liveBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={[styles.liveBadgeText, { color: theme.primary }]}>
                  {USE_MOCK_JOBS ? 'DEMO' : 'MỚI'}
                </ThemedText>
              </View>
            </View>
            {USE_MOCK_JOBS ? (
              <ThemedText style={[styles.demoNotice, { color: theme.textSecondary }]}>
                Đang dùng việc làm mẫu trên thiết bị, chưa lấy dữ liệu từ backend.
              </ThemedText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <ThemedView style={[styles.emptyState, { borderColor: theme.border }]}>
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <ThemedText style={styles.emptyTitle}>
                  {error ? 'Chưa tải được việc làm' : 'Chưa tìm thấy vị trí phù hợp'}
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  {error ?? 'Thử từ khóa khác hoặc tải lại danh sách.'}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={retry}
                  style={[styles.retryButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={[styles.retryText, { color: theme.primary }]}>Thử lại</ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { paddingTop: 10, paddingBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  brandMark: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  brandName: { fontSize: 15, fontWeight: '700' },
  eyebrow: { fontSize: 9, letterSpacing: 1.3, marginTop: 2 },
  heading: { fontSize: 27, lineHeight: 34, fontWeight: '800', maxWidth: 320 },
  intro: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  searchBox: {
    minHeight: 56,
    borderRadius: 17,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 14, minHeight: 42 },
  searchButton: { minWidth: 64, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCaption: { fontSize: 12, marginTop: 4 },
  liveBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  liveBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  demoNotice: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  emptyState: { alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 24, gap: 10, minHeight: 150, justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 3 },
  retryText: { fontSize: 13, fontWeight: '700' },
});
