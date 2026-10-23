import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius, Shadows } from '@/constants/theme';
import { ChatAvatar } from '@/features/chat/components/chat-avatar';
import { chatRoleLabel } from '@/features/chat/chat-format';
import type { ChatContact, ChatConversation } from '@/features/chat/types';
import { useTheme } from '@/hooks/use-theme';

type ChatConversationRowProps = {
  item: ChatConversation;
  contact?: ChatContact;
  onPress: () => void;
};

export const ChatConversationRow = memo(function ChatConversationRow({
  item,
  contact,
  onPress,
}: ChatConversationRowProps) {
  const theme = useTheme();
  const isGroup = item.type === 1;
  const subtitle = isGroup
    ? 'Phòng chung của doanh nghiệp'
    : contact
      ? chatRoleLabel(contact.role)
      : 'Chat riêng';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở hội thoại ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        Shadows.filter,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}>
      <ChatAvatar name={item.title} group={isGroup} />

      <View style={styles.body}>
        <ThemedText numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {item.title}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      </View>

      <View style={styles.trailing}>
        {isGroup ? (
          <Badge variant="secondary" textStyle={styles.badge}>
            Nhóm
          </Badge>
        ) : null}
        <ChevronRight size={16} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: font('semibold'),
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 17,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  badge: {
    fontFamily: font('semibold'),
    fontSize: 10,
    lineHeight: 14,
  },
});
