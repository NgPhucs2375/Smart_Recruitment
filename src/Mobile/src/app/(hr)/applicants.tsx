import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ApplicantsInbox } from '@/features/hr/components/applicants-inbox';
import { useTheme } from '@/hooks/use-theme';

export default function HRApplicantsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ApplicantsInbox />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
