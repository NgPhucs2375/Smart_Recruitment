import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { RefreshCw, WifiOff } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChatConnectionBannerProps = {
  state: 'offline' | 'connecting' | 'online';
  onRetry: () => void;
};

export function ChatConnectionBanner({
  state,
  onRetry,
}: ChatConnectionBannerProps) {
  const theme = useTheme();

  if (state === 'online') return null;

  const connecting = state === 'connecting';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: connecting
            ? theme.backgroundSelected
            : `${theme.destructive}12`,
          borderColor: connecting ? theme.border : `${theme.destructive}44`,
        },
      ]}>
      {connecting ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <WifiOff size={14} color={theme.destructive} />
      )}

      <ThemedText
        style={[
          styles.label,
          { color: connecting ? theme.textSecondary : theme.destructive },
        ]}>
        {connecting
          ? 'Đang kết nối lại hội thoại...'
          : 'Mất kết nối trực tiếp. Tin nhắn mới có thể chưa hiển thị.'}
      </ThemedText>

      {!connecting ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kết nối lại hội thoại"
          onPress={onRetry}
          hitSlop={8}
          style={styles.retry}>
          <RefreshCw size={14} color={theme.destructive} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  label: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 11,
    lineHeight: 16,
  },
  retry: {
    padding: 3,
  },
});
