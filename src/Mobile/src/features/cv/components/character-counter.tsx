import { StyleSheet, Text } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const CV_MAX_LENGTH = {
  shortTitle: 80,
  summary: 450,
  bullet: 220,
  skillTag: 30,
} as const;

export function CharacterCounter({
  currentLength,
  maxLength,
  label,
}: {
  currentLength: number;
  maxLength: number;
  label?: string;
}) {
  const theme = useTheme();
  const ratio = maxLength > 0 ? currentLength / maxLength : 0;
  const color =
    ratio > 1 ? '#ef4444' : ratio >= 0.85 ? '#f59e0b' : theme.textSecondary;

  return (
    <Text
      accessibilityLabel={label ?? `Đã nhập ${currentLength} trên ${maxLength} ký tự`}
      style={[styles.counter, { color }]}
    >
      {currentLength}/{maxLength}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    fontSize: 11,
    fontFamily: font('medium'),
  },
});
