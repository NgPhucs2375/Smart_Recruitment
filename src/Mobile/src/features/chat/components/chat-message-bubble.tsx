import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { formatChatClock } from '@/features/chat/chat-format';
import type { ChatMessage } from '@/features/chat/types';
import { useTheme } from '@/hooks/use-theme';

type ChatMessageBubbleProps = {
  item: ChatMessage;
  own: boolean;
  senderName?: string;
  showSender?: boolean;
};

export const ChatMessageBubble = memo(function ChatMessageBubble({
  item,
  own,
  senderName,
  showSender = false,
}: ChatMessageBubbleProps) {
  const theme = useTheme();
  const clock = formatChatClock(item.createdAtValue);

  return (
    <View
      style={[
        styles.wrap,
        own ? styles.wrapOwn : styles.wrapOther,
      ]}>
      {!own && showSender && senderName ? (
        <ThemedText
          numberOfLines={1}
          style={[styles.sender, { color: theme.primary }]}>
          {senderName}
        </ThemedText>
      ) : null}

      <View
        accessibilityLabel={`${own ? 'Bạn' : senderName ?? 'Đồng nghiệp'}: ${item.content}`}
        style={[
          styles.bubble,
          own
            ? { backgroundColor: theme.primary }
            : {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
        ]}>
        <ThemedText
          style={[
            styles.content,
            { color: own ? theme.primaryForeground : theme.text },
          ]}>
          {item.content}
        </ThemedText>

        {clock ? (
          <ThemedText
            style={[
              styles.clock,
              {
                color: own ? theme.primaryForeground : theme.textSecondary,
                opacity: own ? 0.7 : 1,
              },
            ]}>
            {clock}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '84%',
    gap: 4,
  },
  wrapOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  sender: {
    fontFamily: font('semibold'),
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: 4,
  },
  bubble: {
    borderRadius: Radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    paddingHorizontal: 13,
    paddingVertical: 9,
    gap: 4,
  },
  content: {
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 21,
  },
  clock: {
    alignSelf: 'flex-end',
    fontFamily: font('regular'),
    fontSize: 10,
    lineHeight: 13,
  },
});
