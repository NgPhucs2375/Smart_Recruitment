import { Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BrandLogoProps = {
  variant?: 'light' | 'workspace' | 'navy';
  size?: 'sm' | 'md' | 'auth';
  style?: StyleProp<ViewStyle>;
};

/**
 * Logo HIREAI 1:1 với components/brand-logo.tsx của Web:
 * ô bo góc chứa icon Sparkles + wordmark "HIRE" + "AI" (AI tô màu primary).
 */
export function BrandLogo({
  variant = 'workspace',
  size = 'md',
  style,
}: BrandLogoProps) {
  const theme = useTheme();

  const boxSize = size === 'auth' ? 40 : size === 'sm' ? 32 : 36;
  const boxRadius = size === 'auth' ? 16 : 12;
  const iconSize = size === 'auth' ? 20 : size === 'sm' ? 16 : 16;
  const wordSize = size === 'auth' ? 16 : 14;

  let boxBg: string;
  let boxFg: string;
  let wordFg: string;
  let aiFg: string;

  if (variant === 'light') {
    boxBg = 'rgba(255,255,255,0.15)';
    boxFg = Palette.white;
    wordFg = Palette.white;
    aiFg = 'rgba(255,255,255,0.8)';
  } else if (variant === 'navy') {
    boxBg = Palette.navy;
    boxFg = Palette.white;
    wordFg = theme.text;
    aiFg = theme.primary;
  } else {
    boxBg = theme.primary;
    boxFg = theme.primaryForeground;
    wordFg = theme.text;
    aiFg = theme.primary;
  }

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.box,
          { width: boxSize, height: boxSize, borderRadius: boxRadius, backgroundColor: boxBg },
        ]}
      >
        <Sparkles size={iconSize} color={boxFg} strokeWidth={2} />
      </View>
      <View style={styles.wordBlock}>
        <Text style={[styles.word, { fontSize: wordSize, color: wordFg }]}>
          HIRE
          <Text style={{ color: aiFg }}>AI</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { alignItems: 'center', justifyContent: 'center' },
  wordBlock: { flexShrink: 1 },
  word: { fontFamily: font('bold'), letterSpacing: -0.3 },
});
