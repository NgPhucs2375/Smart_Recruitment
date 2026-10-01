import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { jobsApi } from '@/features/jobs/api/jobs-api';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [result, setResult] = useState<{ id: string; job: Job | null; error: string | null } | null>(null);
  const currentResult = result?.id === id ? result : null;
  const job = currentResult?.job ?? null;
  const error = currentResult?.error ?? null;
  const loading = currentResult === null;

  useEffect(() => {
    let active = true;
    jobsApi
      .getJobById(id)
      .then((result) => {
        if (active) setResult({ id, job: result, error: null });
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.errorTitle}>{error ? 'Không tải được tin tuyển dụng' : 'Không tìm thấy việc làm'}</ThemedText>
        {error ? <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>{error}</ThemedText> : null}
      </SafeAreaView>
    );
  }

  const saved = isBookmarked(job.id);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={[styles.heroCard, { borderColor: theme.border }]}>
          <View style={[styles.companyMark, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.companyInitial, { color: theme.primary }]}>
              {job.company.slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.title}>{job.title}</ThemedText>
          <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>{job.company}</ThemedText>
          <ThemedText style={[styles.salary, { color: theme.primary }]}>{job.salary}</ThemedText>
          <View style={styles.facts}>
            <Fact label="Địa điểm" value={job.location} />
            <Fact label="Hình thức" value={job.workMode} />
            <Fact label="Cấp bậc" value={job.level} />
            <Fact label="Loại công việc" value={job.employmentType} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => toggleBookmark(job.id)}
            style={[styles.bookmarkButton, { borderColor: theme.border }]}>
            <ThemedText style={[styles.bookmarkLabel, { color: theme.primary }]}>
              {saved ? '★ Đã lưu việc làm' : '☆ Lưu việc làm'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {job.skills.length > 0 ? (
          <ThemedView style={[styles.section, { borderColor: theme.border }]}>
            <ThemedText style={styles.sectionTitle}>Kỹ năng</ThemedText>
            <View style={styles.skillList}>
              {job.skills.map((skill) => (
                <View key={skill} style={[styles.skill, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={[styles.skillText, { color: theme.primary }]}>{skill}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        ) : null}

        <ThemedView style={[styles.section, { borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Mô tả công việc</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {job.description || 'Chưa có mô tả chi tiết cho vị trí này.'}
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fact}>
      <ThemedText style={[styles.factLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={styles.factValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  content: { padding: 18, gap: 14 },
  heroCard: { alignItems: 'center', borderWidth: 1, borderRadius: 22, padding: 20, gap: 8 },
  companyMark: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  companyInitial: { fontSize: 24, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  secondary: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  salary: { fontSize: 17, fontWeight: '800', marginTop: 5 },
  facts: { alignSelf: 'stretch', gap: 12, paddingTop: 16, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE4E9' },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { fontSize: 13 },
  factValue: { fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  bookmarkButton: { minHeight: 44, alignSelf: 'stretch', borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  bookmarkLabel: { fontSize: 14, fontWeight: '700' },
  section: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  skillList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99 },
  skillText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 22 },
  errorTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
});
