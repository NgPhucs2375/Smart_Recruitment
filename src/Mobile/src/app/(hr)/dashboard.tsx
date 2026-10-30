import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { DashboardScreen } from '@/features/hr/components/dashboard-screen';
import { useTheme } from '@/hooks/use-theme';

export default function HROverviewScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <DashboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
