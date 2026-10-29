import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ApplicantsInbox } from '@/features/hr/components/applicants-inbox';
import { HrScreenShell, HrTopBar } from '@/features/hr/components/hr-primitives';
import { PotentialCandidatesCard } from '@/features/hr/components/potential-candidates-card';

export default function HRJobApplicantsRoute() {
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const jobId = Number(params.id) || 0;
  const title = params.title || `Ứng viên tin #${jobId || ''}`;

  return (
    <HrScreenShell>
      <HrTopBar title={title} />
      <View style={styles.wrap}>
        {/* Ứng viên tiềm năng — Đánh giá AI cao (mock). */}
        <View style={styles.cardSlot}>
          <PotentialCandidatesCard />
        </View>
        <ApplicantsInbox jobId={jobId > 0 ? jobId : undefined} jobTitle={title} />
      </View>
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  cardSlot: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
});
