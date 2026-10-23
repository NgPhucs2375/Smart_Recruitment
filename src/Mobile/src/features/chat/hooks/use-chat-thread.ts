import * as signalR from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { chatApi, parseChatMessage } from '@/features/chat/api/chat-api';
import type {
  ChatContact,
  ChatContext,
  ChatConversation,
  ChatMessage,
} from '@/features/chat/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { getAccessToken } from '@/services/api/client';
import { getSignalRHubUrl } from '@/services/api/signalr';

const MESSAGE_PAGE_SIZE = 100;

type ThreadStatus = 'loading' | 'ready' | 'error';
type ConnectionState = 'offline' | 'connecting' | 'online';

function mergeMessages(
  previous: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const message of previous) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => left.id - right.id);
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : 'Không thể kết nối hội thoại. Vui lòng thử lại.';
}

export function useChatThread(
  conversationId: number | null,
  enabled: boolean,
) {
  const [context, setContext] = useState<ChatContext | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ThreadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('offline');
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [reconnectEpoch, setReconnectEpoch] = useState(0);

  const mountedRef = useRef(true);
  const revokedRef = useRef(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const loadingOlderRef = useRef(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let connection: signalR.HubConnection | null = null;
    let revokedHere = false;

    loadingOlderRef.current = false;
    sendingRef.current = false;

    if (!enabled || !conversationId) return;

    const addMessages = (incoming: ChatMessage[]) => {
      if (revokedHere) return;
      setMessages((current) => mergeMessages(current, incoming));
    };

    const loadHistory = async () => {
      const history = await chatApi.listMessages(conversationId);
      if (!active || revokedHere) return;
      addMessages(history);
      setHasOlder(history.length === MESSAGE_PAGE_SIZE);
      setStatus('ready');
    };

    const bootstrap = async () => {
      try {
        const [nextContext, nextContacts, conversations] = await Promise.all([
          chatApi.getContext(),
          chatApi.listContacts(),
          chatApi.listConversations(),
        ]);
        if (!active) return;

        const found = conversations.find((item) => item.id === conversationId);
        if (!found) {
          throw new Error('Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.');
        }

        setContext(nextContext);
        setContacts(nextContacts);
        setConversation(found);

        if (USE_MOCK_JOBS) {
          await loadHistory();
          if (active) {
            setConnectionState('online');
            setError(null);
          }
          return;
        }

        const hubUrl = getSignalRHubUrl('chat');
        if (!hubUrl) {
          await loadHistory();
          if (active) setConnectionState('offline');
          return;
        }

        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: async () => (await getAccessToken()) ?? '',
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Warning)
          .build();
        connectionRef.current = connection;

        const activeConnection = connection;
        const joinAndSync = async () => {
          await activeConnection.invoke('JoinConversation', conversationId);
          if (!active || revokedHere) return;
          await loadHistory();
          if (active && !revokedHere) {
            setConnectionState('online');
            setError(null);
          }
        };

        connection.on('MessageReceived', (raw: unknown) => {
          if (!active) return;
          const message = parseChatMessage(raw);
          if (!message) return;
          if (
            message.conversationId &&
            message.conversationId !== String(conversationId)
          ) {
            return;
          }
          addMessages([message]);
        });

        connection.on('AccessRevoked', () => {
          if (!active) return;
          revokedHere = true;
          revokedRef.current = true;
          setRevoked(true);
          setMessages([]);
          setConnectionState('offline');
          setStatus('ready');
          setError(
            'Quyền truy cập hội thoại đã thay đổi. Vui lòng quay lại danh sách.',
          );
          void activeConnection.stop();
        });

        connection.onreconnecting(() => {
          if (active) setConnectionState('connecting');
        });

        connection.onreconnected(() => {
          if (!active) return;
          setConnectionState('connecting');
          void joinAndSync().catch((reason: unknown) => {
            if (!active || revokedHere) return;
            setConnectionState('offline');
            setError(errorMessage(reason));
          });
        });

        connection.onclose(() => {
          if (active && !revokedHere) setConnectionState('offline');
        });

        setConnectionState('connecting');
        try {
          await connection.start();
          if (!active) {
            await connection.stop();
            return;
          }
          await joinAndSync();
        } catch (reason: unknown) {
          if (!active || revokedHere) return;
          setConnectionState('offline');
          setError(errorMessage(reason));
          try {
            await loadHistory();
          } catch {
            if (active && !revokedHere) setStatus('error');
          }
        }
      } catch (reason: unknown) {
        if (!active || revokedHere) return;
        setStatus('error');
        setError(errorMessage(reason));
      }
    };

    void bootstrap();

    return () => {
      active = false;
      if (connection) {
        const activeConnection = connection;
        if (connectionRef.current === activeConnection) {
          connectionRef.current = null;
        }
        void activeConnection
          .invoke('LeaveConversation', conversationId)
          .catch(() => undefined)
          .finally(() => activeConnection.stop());
      }
    };
  }, [conversationId, enabled, reconnectEpoch]);

  useEffect(() => {
    if (USE_MOCK_JOBS) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && connectionState === 'offline' && !revoked) {
        setReconnectEpoch((value) => value + 1);
      }
    });
    return () => subscription.remove();
  }, [connectionState, revoked]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (
        !conversationId ||
        !context?.canSend ||
        revoked ||
        revokedRef.current ||
        !trimmed ||
        sendingRef.current
      ) {
        return false;
      }

      setSendError(null);
      sendingRef.current = true;
      setSending(true);

      try {
        let message: ChatMessage | null = null;

        if (USE_MOCK_JOBS) {
          message = await chatApi.sendMockMessage(conversationId, trimmed);
        } else {
          const connection = connectionRef.current;
          if (!connection || connectionState !== 'online') {
            setSendError('Chưa kết nối được hội thoại. Hãy thử kết nối lại.');
            return false;
          }
          const raw = await connection.invoke<unknown>(
            'SendMessage',
            conversationId,
            trimmed,
          );
          message = parseChatMessage(raw);
        }

        if (mountedRef.current && message && !revokedRef.current) {
          setMessages((current) => mergeMessages(current, [message]));
        }
        return message !== null;
      } catch (reason: unknown) {
        if (mountedRef.current) setSendError(errorMessage(reason));
        return false;
      } finally {
        sendingRef.current = false;
        if (mountedRef.current) setSending(false);
      }
    },
    [conversationId, context?.canSend, connectionState, revoked],
  );

  const loadOlder = useCallback(async () => {
    if (
      !conversationId ||
      !hasOlder ||
      revoked ||
      revokedRef.current ||
      loadingOlderRef.current ||
      messages.length === 0
    ) {
      return;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setError(null);
    try {
      const history = await chatApi.listMessages(
        conversationId,
        messages[0].id,
      );
      if (!mountedRef.current || revoked || revokedRef.current) return;
      setMessages((current) => mergeMessages(current, history));
      setHasOlder(history.length === MESSAGE_PAGE_SIZE);
    } catch (reason: unknown) {
      if (mountedRef.current && !revoked && !revokedRef.current) {
        setError(errorMessage(reason));
      }
    } finally {
      loadingOlderRef.current = false;
      if (mountedRef.current) setLoadingOlder(false);
    }
  }, [conversationId, hasOlder, messages, revoked]);

  const retryConnection = useCallback(() => {
    if (revoked) return;
    setSendError(null);
    setReconnectEpoch((value) => value + 1);
  }, [revoked]);

  return {
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
    canSend: context?.canSend ?? false,
    sendMessage,
    loadOlder,
    retryConnection,
  };
}
