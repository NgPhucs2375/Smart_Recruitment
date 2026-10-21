import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { JobsListScreen } from '@/features/hr/components/jobs-list-screen';
import { useTheme } from '@/hooks/use-theme';

export default function HRJobsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <JobsListScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
