import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import type { HubConnection } from '@microsoft/signalr';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { chatApi } from '@/features/chat/api/chat-api';
import { createChatHub } from '@/features/chat/hub';
import type {
  ChatContact,
  ChatContext,
  ChatMessage,
  ConnectionState,
} from '@/features/chat/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { useTheme } from '@/hooks/use-theme';

function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  return [...new Map([...previous, ...incoming].map((m) => [m.Id, m])).values()].sort(
    (a, b) => a.Id - b.Id,
  );
}

function dayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString() ? 'Hôm nay' : date.toLocaleDateString('vi-VN');
}

function timeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function ChatThreadScreen({ conversationId, title }: { conversationId: number; title?: string }) {
  const theme = useTheme();
  const demo = USE_MOCK_JOBS;

  const [context, setContext] = useState<ChatContext | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [reconnectEpoch, setReconnectEpoch] = useState(0);

  const connectionRef = useRef<HubConnection | null>(null);
  const activeIdRef = useRef<number>(conversationId);
  const scrollRef = useRef<ScrollView | null>(null);
  const sendLockRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      try {
        const [current, people] = await Promise.all([chatApi.getContext(), chatApi.getContacts()]);
        if (!mountedRef.current) return;
        setContext(current);
        setContacts(people);
      } catch (reason) {
        if (!mountedRef.current) return;
        setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin chat.');
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    activeIdRef.current = conversationId;
    if (!conversationId) return;

    if (demo) {
      let alive = true;
      setLoadingMessages(true);
      setConnectionState('online');
      chatApi
        .getMessages(conversationId)
        .then((history) => {
          if (!alive || activeIdRef.current !== conversationId) return;
          setMessages(history);
          setHasOlder(history.length >= 100);
          setError('');
        })
        .catch((reason) => {
          if (alive) setError(reason instanceof Error ? reason.message : 'Không thể tải tin nhắn.');
        })
        .finally(() => {
          if (alive) setLoadingMessages(false);
        });
      return () => {
        alive = false;
      };
    }

    let alive = true;
    const controller = new AbortController();
    const hub = createChatHub();
    connectionRef.current = hub;

    const joinAndSync = async () => {
      await hub.invoke('JoinConversation', conversationId);
      const history = await chatApi.getMessages(conversationId);
      if (alive && activeIdRef.current === conversationId) {
        setMessages((previous) => mergeMessages(previous, history));
        setHasOlder(history.length >= 100);
        setConnectionState('online');
        setError('');
      }
    };

    hub.on('MessageReceived', (message: ChatMessage) => {
      if (alive && message.ConversationId === String(conversationId)) {
        setMessages((previous) => mergeMessages(previous, [message]));
      }
    });
    hub.on('AccessRevoked', () => {
      if (!alive) return;
      setMessages([]);
      setConnectionState('offline');
      setError('Quyền truy cập hội thoại đã thay đổi. Vui lòng làm mới danh sách.');
      void hub.stop();
    });
    hub.onreconnecting(() => {
      if (alive) setConnectionState('connecting');
    });
    hub.onreconnected(() => {
      if (!alive) return;
      void joinAndSync().catch((reason) => {
        if (!alive) return;
        setConnectionState('offline');
        setMessages([]);
        setError(
          reason instanceof Error ? reason.message : 'Không thể vào lại hội thoại.',
        );
        void hub.stop();
      });
    });
    hub.onclose(() => {
      if (alive) setConnectionState('offline');
    });

    void (async () => {
      setMessages([]);
      setLoadingMessages(true);
      setHasOlder(false);
      setError('');
      setConnectionState('connecting');
      try {
        await hub.start();
        if (!alive) {
          await hub.stop();
          return;
        }
        await joinAndSync();
      } catch (reason) {
        if (alive) {
          setConnectionState('offline');
          setError(reason instanceof Error ? reason.message : 'Không thể kết nối chat.');
        }
      } finally {
        if (alive) setLoadingMessages(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
      if (connectionRef.current === hub) connectionRef.current = null;
      void hub.stop();
    };
  }, [conversationId, reconnectEpoch, demo]);

  const lastMessageId = messages.at(-1)?.Id;
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }, [lastMessageId, loadingMessages]);

  const handleLoadOlder = useCallback(async () => {
    if (!conversationId || !messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const history = await chatApi.getMessages(conversationId, { beforeId: messages[0].Id });
      if (activeIdRef.current === conversationId) {
        setMessages((previous) => mergeMessages(previous, history));
        setHasOlder(history.length >= 100);
      }
    } catch (reason) {
      if (activeIdRef.current === conversationId) {
        setError(reason instanceof Error ? reason.message : 'Không thể tải tin cũ.');
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, messages]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    const id = conversationId;
    if (!content || !id || sendLockRef.current) return;
    if (!demo && (connectionState !== 'online' || !context?.CanSend)) return;
    sendLockRef.current = true;
    setSending(true);
    try {
      if (demo) {
        const message = chatApi.createMockMessage(id, context?.CurrentUserId ?? 0, content);
        setMessages((previous) => mergeMessages(previous, [message]));
        setText('');
        setError('');
      } else {
        const hub = connectionRef.current;
        if (!hub) throw new Error('Mất kết nối chat. Vui lòng thử lại.');
        const message = await hub.invoke<ChatMessage>('SendMessage', id, content);
        if (activeIdRef.current === id) {
          setMessages((previous) => mergeMessages(previous, [message]));
          setText((previous) => (previous.trim() === content ? '' : previous));
          setError('');
        }
      }
    } catch (reason) {
      if (activeIdRef.current === id) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Không thể gửi tin nhắn. Nội dung vẫn được giữ để thử lại.',
        );
      }
    } finally {
      sendLockRef.current = false;
      if (mountedRef.current) setSending(false);
    }
  }, [connectionState, context, conversationId, demo, text]);

  const headerTitle = title || 'Hội thoại';
  const inputDisabled =
    demo
      ? sending
      : connectionState !== 'online' || !context?.CanSend || sending;
  const statusLabel =
    connectionState === 'online'
      ? demo
        ? 'Dữ liệu minh họa'
        : 'Trực tuyến'
      : connectionState === 'connecting'
        ? 'Đang kết nối...'
        : 'Ngoại tuyến';

  let lastDay = '';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách hội thoại"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerBody}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} type="smallBold">
            {headerTitle}
          </ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionState === 'online'
                      ? '#7fae9b'
                      : connectionState === 'connecting'
                        ? theme.textSecondary
                        : theme.muted,
                },
              ]}
            />
            <ThemedText style={[styles.statusText, { color: theme.textSecondary }]} type="small">
              {statusLabel}
            </ThemedText>
          </View>
        </View>
        {!demo && connectionState === 'offline' && !loadingMessages ? (
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw size={13} color={theme.text} />}
            onPress={() => setReconnectEpoch((value) => value + 1)}
          >
            Kết nối lại
          </Button>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {error ? (
            <View style={[styles.errorBar, { backgroundColor: `${theme.destructive}14` }]}>
              <ThemedText style={[styles.errorText, { color: theme.destructive }]} type="small">
                {error}
              </ThemedText>
            </View>
          ) : null}

          {hasOlder ? (
            <View style={styles.olderRow}>
              <Button
                size="sm"
                variant="outline"
                pill
                disabled={loadingOlder}
                onPress={() => void handleLoadOlder()}
              >
                {loadingOlder ? 'Đang tải...' : 'Tải tin nhắn trước đó'}
              </Button>
            </View>
          ) : null}

          {loadingMessages ? (
            <ThemedText style={[styles.centerHint, { color: theme.textSecondary }]} type="small">
              Đang tải tin nhắn...
            </ThemedText>
          ) : null}

          {!loadingMessages && !messages.length && !error ? (
            <ThemedText style={[styles.centerHint, { color: theme.textSecondary }]} type="small">
              Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
            </ThemedText>
          ) : null}

          {messages.map((message) => {
            const mine = message.SenderId === String(context?.CurrentUserId);
            const senderId = Number(message.SenderId);
            const name = mine
              ? 'Bạn'
              : contacts.find((contact) => contact.Id === senderId)?.Name ?? 'Thành viên';
            const day = dayLabel(message.Created);
            const showDay = day !== '' && day !== lastDay;
            lastDay = day;
            return (
              <View key={message.Id} style={styles.messageBlock}>
                {showDay ? (
                  <View style={styles.dayRow} importantForAccessibility="no">
                    <View style={[styles.dayLine, { backgroundColor: theme.border }]} />
                    <ThemedText style={[styles.dayText, { color: theme.textSecondary }]} type="small">
                      {day}
                    </ThemedText>
                    <View style={[styles.dayLine, { backgroundColor: theme.border }]} />
                  </View>
                ) : null}
                <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                  <View style={styles.bubbleColumn}>
                    <View style={styles.bubbleMeta}>
                      <ThemedText style={styles.bubbleName} type="small">
                        {name}
                      </ThemedText>
                      <ThemedText style={[styles.bubbleTime, { color: theme.textSecondary }]} type="small">
                        {timeLabel(message.Created)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.bubble,
                        mine
                          ? { backgroundColor: theme.primary, borderBottomRightRadius: 6 }
                          : { backgroundColor: theme.backgroundSelected, borderBottomLeftRadius: 6 },
                      ]}
                    >
                      <ThemedText
                        style={mine ? { color: theme.primaryForeground } : { color: theme.text }}
                        type="small"
                      >
                        {message.Content}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!inputDisabled}
            multiline
            maxLength={4000}
            placeholder={
              !demo && context && !context.CanSend
                ? 'Bạn chỉ có quyền đọc tin nhắn'
                : 'Nhập tin nhắn trao đổi...'
            }
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
                opacity: inputDisabled && !sending ? 0.6 : 1,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            disabled={inputDisabled || !text.trim()}
            onPress={() => void handleSend()}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: theme.primary,
                opacity: inputDisabled || !text.trim() ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Send size={18} color={theme.primaryForeground} />
          </Pressable>
        </View>
        <ThemedText style={[styles.counter, { color: theme.textSecondary }]} type="small">
          {`${text.length}/4.000`}
        </ThemedText>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 6 },
  headerBody: { flex: 1, minWidth: 0, gap: 2 },
  headerTitle: { fontFamily: font('semibold') },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12 },
  messages: { padding: 16, gap: 10 },
  errorBar: { borderRadius: Radius.lg, padding: 10 },
  errorText: {},
  olderRow: { alignItems: 'center' },
  centerHint: { textAlign: 'center', paddingVertical: 24 },
  messageBlock: { gap: 4 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  dayLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dayText: { fontSize: 11 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubbleColumn: { maxWidth: '85%', gap: 3 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  bubbleName: { fontFamily: font('semibold'), fontSize: 12 },
  bubbleTime: { fontSize: 11 },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: font('regular'),
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { fontSize: 11, textAlign: 'right', paddingHorizontal: 14, paddingBottom: 4 },
});
