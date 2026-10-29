import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!busy) onCancel();
      }}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Đóng hộp thoại"
          onPress={() => {
            if (!busy) onCancel();
          }}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            Shadows.dialog,
          ]}>
          <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </ThemedText>
          <View style={styles.actions}>
            <Button variant="outline" size="sm" disabled={busy} onPress={onCancel} style={styles.action}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              size="sm"
              disabled={busy}
              onPress={onConfirm}
              style={styles.action}
              icon={
                busy ? (
                  <ActivityIndicator
                    size="small"
                    color={destructive ? theme.destructive : theme.primaryForeground}
                  />
                ) : undefined
              }>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,24,32,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  title: {
    fontFamily: font('semibold'),
    fontSize: 17,
    lineHeight: 23,
  },
  message: {
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  action: {
    minWidth: 96,
  },
});
