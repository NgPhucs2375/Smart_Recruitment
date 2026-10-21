import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DialogRequest = {
  mode: 'confirm' | 'prompt';
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

/**
 * Hook confirm/prompt cho HR — mirror useConfirmDialog của Web:
 * confirm() → boolean, prompt() → string | null (null = hủy).
 */
export function useHrActionDialog() {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  const ask = useCallback((next: DialogRequest) => {
    setRequest(next);
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: string | null) => {
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(result);
  }, []);

  const confirm = useCallback(
    (options: Omit<DialogRequest, 'mode'>) =>
      ask({ ...options, mode: 'confirm' }).then((value) => value !== null),
    [ask],
  );

  const prompt = useCallback(
    (options: Omit<DialogRequest, 'mode'>) => ask({ ...options, mode: 'prompt' }),
    [ask],
  );

  const dialog = request ? <HrActionDialog request={request} onClose={close} /> : null;

  return { dialog, confirm, prompt };
}

export function HrActionDialog({
  request,
  onClose,
}: {
  request: DialogRequest;
  onClose: (result: string | null) => void;
}) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const confirmLabel = request.confirmLabel ?? 'Xác nhận';
  const destructive = request.destructive ?? false;

  const handleConfirm = () => {
    if (request.mode === 'prompt') {
      onClose(text.trim());
      return;
    }
    onClose('');
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose(null)}>
      <Pressable style={styles.backdrop} onPress={() => onClose(null)}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onPress={() => undefined}
        >
          <ThemedText style={styles.title} type="smallBold">
            {request.title}
          </ThemedText>
          {request.description ? (
            <ThemedText style={[styles.description, { color: theme.textSecondary }]} type="small">
              {request.description}
            </ThemedText>
          ) : null}

          {request.mode === 'prompt' ? (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={request.placeholder ?? 'Nhập nội dung'}
              placeholderTextColor={theme.textSecondary}
              multiline
              autoFocus
              style={[
                styles.input,
                { backgroundColor: theme.background, borderColor: theme.input, color: theme.text },
              ]}
            />
          ) : null}

          <View style={styles.actions}>
            <Button variant="ghost" onPress={() => onClose(null)} style={styles.actionButton}>
              Hủy
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              onPress={handleConfirm}
              style={styles.actionButton}
            >
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 15 },
  description: { fontSize: 13, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: font('regular'),
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  actionButton: { minWidth: 92 },
});
