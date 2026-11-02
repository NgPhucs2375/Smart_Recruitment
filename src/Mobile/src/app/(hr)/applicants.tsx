import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ApplicantsInbox } from '@/features/hr/components/applicants-inbox';
import { PotentialCandidatesCard } from '@/features/hr/components/potential-candidates-card';
import { useTheme } from '@/hooks/use-theme';

export default function HRApplicantsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <View style={styles.potentialWrap}>
        <PotentialCandidatesCard collapsible defaultExpanded={false} />
      </View>
      <ApplicantsInbox />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  potentialWrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 2 },
});
