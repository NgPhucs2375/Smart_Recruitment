import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { useTheme } from '@/hooks/use-theme';

/**
 * AppHeader 1:1 với CandidateHeader của Web (phiên bản mobile):
 * SafeAreaView trên, row h-16, nền topbar + border-b. Chỉ có logo HIREAI
 * (điều hướng qua tab bar). Settings ⚙️ đã bỏ theo quyết định.
 */
export function AppHeader() {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.bar,
          { borderBottomColor: theme.border, backgroundColor: theme.background },
        ]}
      >
        <BrandLogo size="md" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { width: '100%' },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
