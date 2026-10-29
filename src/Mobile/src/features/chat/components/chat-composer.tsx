import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Lock, Send } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_LENGTH = 4000;

type ChatComposerProps = {
  canSend: boolean;
  sending: boolean;
  onSend: (content: string) => Promise<boolean>;
};

export function ChatComposer({
  canSend,
  sending,
  onSend,
}: ChatComposerProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  if (!canSend) {
    return (
      <View
        style={[
          styles.readOnly,
          { backgroundColor: theme.muted, borderColor: theme.border },
        ]}>
        <Lock size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.readOnlyText, { color: theme.textSecondary }]}>
          Bạn chỉ có quyền đọc tin nhắn trong hội thoại này.
        </ThemedText>
      </View>
    );
  }

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !sending;

  const handleSend = async () => {
    if (!canSubmit) return;
    const accepted = await onSend(trimmed);
    if (accepted) setValue('');
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: focused ? theme.primary : theme.border,
          },
        ]}>
        <TextInput
          accessibilityLabel="Nội dung tin nhắn"
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={MAX_LENGTH}
          blurOnSubmit={false}
          style={[styles.input, { color: theme.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi tin nhắn"
          accessibilityState={{ disabled: !canSubmit }}
          disabled={!canSubmit}
          onPress={() => void handleSend()}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSubmit ? theme.primary : theme.muted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          {sending ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Send
              size={17}
              color={canSubmit ? theme.primaryForeground : theme.textSecondary}
            />
          )}
        </Pressable>
      </View>

      {value.length > MAX_LENGTH - 400 ? (
        <ThemedText style={[styles.counter, { color: theme.textSecondary }]}>
          {`${value.length}/${MAX_LENGTH}`}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 50,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: font('regular'),
    fontSize: 10,
    lineHeight: 14,
    paddingRight: 4,
  },
  readOnly: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 18,
  },
});
