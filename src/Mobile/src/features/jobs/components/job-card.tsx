import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

export function JobCard({ job }: { job: Job }) {
  const theme = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(job.id);

  return (
    <ThemedView style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết việc làm ${job.title}`}
          onPress={() => router.push(`/jobs/${job.id}`)}
          style={styles.details}>
          <View style={styles.heading}>
            <View style={[styles.companyMark, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={[styles.companyInitial, { color: theme.primary }]}>
                {job.company.slice(0, 1).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.titleBlock}>
              <ThemedText numberOfLines={2} style={styles.title}>
                {job.title}
              </ThemedText>
              <ThemedText numberOfLines={1} style={[styles.secondary, { color: theme.textSecondary }]}>
                {job.company}
              </ThemedText>
            </View>
          </View>
          <View style={styles.metadata}>
            <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>
              {job.location}
            </ThemedText>
            <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>
              {job.workMode} · {job.level}
            </ThemedText>
          </View>
          <ThemedText style={[styles.salary, { color: theme.primary }]}>{job.salary}</ThemedText>
          <View style={styles.footer}>
            <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>
              {job.employmentType}
            </ThemedText>
            <ThemedText style={[styles.secondary, { color: theme.textSecondary }]}>
              {job.postedAt}
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
          accessibilityState={{ selected: saved }}
          hitSlop={8}
          onPress={() => toggleBookmark(job.id)}
          style={styles.saveButton}>
          <ThemedText style={[styles.saveIcon, { color: saved ? theme.primary : theme.textSecondary }]}>
            {saved ? '★' : '☆'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  details: { flex: 1, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyMark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  companyInitial: { fontSize: 18, fontWeight: '700' },
  titleBlock: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  secondary: { fontSize: 12, lineHeight: 18 },
  metadata: { gap: 4 },
  salary: { fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE4E9' },
  saveButton: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  saveIcon: { fontSize: 24, lineHeight: 28 },
});
