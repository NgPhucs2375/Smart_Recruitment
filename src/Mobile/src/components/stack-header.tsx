import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StackHeaderProps = {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
};

export function StackHeader({ title, right, onBack }: StackHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/profile');
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          borderBottomColor: theme.border,
          backgroundColor: theme.backgroundElement,
        },
      ]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.side, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
        <View style={styles.side}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  side: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font('semibold'),
    fontSize: 16,
    lineHeight: 22,
  },
});
