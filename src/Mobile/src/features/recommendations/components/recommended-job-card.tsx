import { StyleSheet, View } from 'react-native';
import { Target } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Palette, Radius } from '@/constants/theme';
import { JobCard } from '@/features/jobs/components/job-card';
import type { RecommendedJob } from '@/features/recommendations/types';

/**
 * JobCard + pill "Phù hợp {n}%" (Palette.sage như Web badge "% match").
 * Card gốc đã tự điều hướng /jobs/[id] khi bấm.
 */
export function RecommendedJobCard({ item }: { item: RecommendedJob }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.matchRow}>
        <View style={styles.matchPill}>
          <Target size={12} color={Palette.sage} />
          <ThemedText style={styles.matchText}>{`Phù hợp ${item.matchPercent}%`}</ThemedText>
        </View>
        {item.matchedSkills.length > 0 ? (
          <ThemedText numberOfLines={1} style={styles.skills}>
            {`Khớp: ${item.matchedSkills.slice(0, 3).join(', ')}`}
          </ThemedText>
        ) : null}
      </View>
      <JobCard job={item.job} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Palette.sage}1A`,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  matchText: { fontFamily: font('semibold'), fontSize: 11, color: Palette.sage },
  skills: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 11,
    color: Palette.sage,
  },
});
