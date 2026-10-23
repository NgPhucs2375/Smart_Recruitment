import {
  Redirect,
  router,
  useLocalSearchParams,
  type Href,
} from 'expo-router';
import { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Lock, MessagesSquare } from 'lucide-react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { ChatConnectionBanner } from '@/features/chat/components/chat-connection-banner';
import { ChatMessageBubble } from '@/features/chat/components/chat-message-bubble';
import { formatChatDay } from '@/features/chat/chat-format';
import { useChatThread } from '@/features/chat/hooks/use-chat-thread';
import { canUseInternalChat } from '@/features/chat/roles';
import type { ChatMessage } from '@/features/chat/types';
import { useTheme } from '@/hooks/use-theme';

type MessageRow = {
  message: ChatMessage;
  day: string | null;
};

export default function ChatThreadScreen() {
  const { user } = useAuth();
  const allowed = canUseInternalChat(user?.roles);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const conversationId = Number(rawId);
  const validId =
    Number.isInteger(conversationId) && conversationId > 0 && Boolean(rawId);

  if (!allowed) return <Redirect href="/" />;
  if (!validId) return <Redirect href={'/chat' as Href} />;

  return (
    <ChatThreadView
      key={conversationId}
      conversationId={conversationId}
      allowed={allowed}
    />
  );
}

function ChatThreadView({
  conversationId,
  allowed,
}: {
  conversationId: number;
  allowed: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    context,
    contacts,
    conversation,
    messages,
    status,
    error,
    connectionState,
    hasOlder,
    loadingOlder,
    sending,
    sendError,
    revoked,
    canSend,
    sendMessage,
    loadOlder,
    retryConnection,
  } = useChatThread(conversationId, allowed);

  const contactNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const contact of contacts) map.set(String(contact.id), contact.name);
    return map;
  }, [contacts]);

  const rows = useMemo(() => {
    const next = messages.map((message, index) => {
      const day = formatChatDay(message.createdAtValue);
      const previousDay = index > 0
        ? formatChatDay(messages[index - 1].createdAtValue)
        : '';
      const showDay = Boolean(day) && day !== previousDay;
      return { message, day: showDay ? day : null };
    });
    return next.reverse();
  }, [messages]);

  const listRef = useRef<FlatList<MessageRow>>(null);

  const isGroup = conversation?.type === 1;
  const title = revoked
    ? 'Hội thoại không còn quyền truy cập'
    : conversation?.title ?? 'Hội thoại';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/chat' as Href);
  };

  const body = (() => {
    if (revoked) {
      return (
        <ChatThreadState
          icon={<Lock size={24} color={theme.destructive} />}
          iconBackground={`${theme.destructive}14`}
          title="Quyền truy cập đã thay đổi"
          message="Bạn không còn là thành viên của hội thoại này. Tin nhắn đã được ẩn."
          actionLabel="Về danh sách"
          onAction={() => router.replace('/chat' as Href)}
        />
      );
    }

    if (status === 'loading' && messages.length === 0) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.stateHint, { color: theme.textSecondary }]}>
            Đang tải hội thoại...
          </ThemedText>
        </View>
      );
    }

    if (status === 'error' && messages.length === 0) {
      return (
        <ChatThreadState
          icon={<AlertCircle size={24} color={theme.destructive} />}
          iconBackground={`${theme.destructive}14`}
          title="Chưa mở được hội thoại"
          message={error ?? 'Vui lòng kiểm tra kết nối và thử lại.'}
          actionLabel="Thử lại"
          onAction={retryConnection}
        />
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.centerState}>
          <View
            style={[styles.stateIcon, { backgroundColor: `${theme.primary}14` }]}>
            <MessagesSquare size={24} color={theme.primary} />
          </View>
          <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
            Chưa có tin nhắn
          </ThemedText>
          <ThemedText style={[styles.stateMessage, { color: theme.textSecondary }]}>
            Hãy gửi lời chào đầu tiên để bắt đầu hội thoại.
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        ref={listRef}
        data={rows}
        inverted
        keyExtractor={(row) => String(row.message.id)}
        renderItem={({ item }) => (
          <View>
            {item.day ? (
              <View style={styles.dayRow}>
                <View style={[styles.dayLine, { backgroundColor: theme.border }]} />
                <ThemedText
                  style={[styles.dayLabel, { color: theme.textSecondary }]}>
                  {item.day}
                </ThemedText>
                <View style={[styles.dayLine, { backgroundColor: theme.border }]} />
              </View>
            ) : null}
            <ChatMessageBubble
              item={item.message}
              own={
                String(context?.currentUserId) === item.message.senderId
              }
              senderName={
                contactNames.get(item.message.senderId) ?? 'Đồng nghiệp'
              }
              showSender={Boolean(isGroup)}
            />
          </View>
        )}
        ListFooterComponent={
          messages.length > 0 ? (
            <View style={styles.older}>
              {loadingOlder ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : hasOlder ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải tin nhắn cũ hơn"
                  onPress={() => void loadOlder()}
                  style={[styles.olderButton, { borderColor: theme.border }]}>
                  <ThemedText style={[styles.olderText, { color: theme.primary }]}>
                    Tải tin cũ hơn
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText style={[styles.olderText, { color: theme.textSecondary }]}>
                  Bắt đầu hội thoại
                </ThemedText>
              )}
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          rows.length === 0 && styles.listContentEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.25}
      />
    );
  })();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title={title} onBack={handleBack} />

      {!revoked && status !== 'loading' ? (
        <ChatConnectionBanner state={connectionState} onRetry={retryConnection} />
      ) : null}

      {error &&
      messages.length > 0 &&
      !revoked &&
      connectionState === 'online' ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: `${theme.destructive}0F`,
              borderColor: `${theme.destructive}44`,
            },
          ]}>
          <AlertCircle size={14} color={theme.destructive} />
          <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.flex}>{body}</View>

        {!revoked && status === 'ready' ? (
          <View
            style={[
              styles.composerWrap,
              {
                borderTopColor: theme.border,
                backgroundColor: theme.background,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}>
            {sendError ? (
              <View
                style={[
                  styles.sendError,
                  { backgroundColor: `${theme.destructive}0F` },
                ]}>
                <ThemedText
                  style={[styles.sendErrorText, { color: theme.destructive }]}>
                  {sendError}
                </ThemedText>
              </View>
            ) : null}
            <ChatComposer
              key={conversationId}
              canSend={canSend}
              sending={sending}
              onSend={sendMessage}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

function ChatThreadState({
  icon,
  iconBackground,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.centerState}>
      <View
        style={[
          styles.stateCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.stateIcon, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
        <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.stateMessage, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
        <Button variant="outline" size="sm" pill onPress={onAction} style={styles.stateAction}>
          {actionLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  dayLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dayLabel: { fontFamily: font('medium'), fontSize: 10 },
  older: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 34,
  },
  olderButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  olderText: { fontFamily: font('medium'), fontSize: 11 },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 9,
    gap: 7,
  },
  sendError: {
    borderRadius: Radius.lg,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  sendErrorText: {
    fontFamily: font('medium'),
    fontSize: 11,
    lineHeight: 16,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  errorText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 11,
    lineHeight: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 10,
  },
  stateHint: { fontFamily: font('regular'), fontSize: 12 },
  stateCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 9,
  },
  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  stateTitle: {
    fontFamily: font('semibold'),
    fontSize: 16,
    textAlign: 'center',
  },
  stateMessage: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  stateAction: { marginTop: 7 },
});
