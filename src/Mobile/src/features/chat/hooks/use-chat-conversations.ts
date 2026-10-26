import * as signalR from '@microsoft/signalr';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { chatApi } from '@/features/chat/api/chat-api';
import type {
  ChatContact,
  ChatContext,
  ChatConversation,
  CreateConversationInput,
} from '@/features/chat/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { getAccessToken } from '@/services/api/client';
import { getSignalRHubUrl } from '@/services/api/signalr';

const POLL_INTERVAL = 30_000;
const REALTIME_REFRESH_DELAY = 350;

type ListStatus = 'loading' | 'refreshing' | 'ready' | 'error';

type ChatListState = {
  context: ChatContext | null;
  contacts: ChatContact[];
  conversations: ChatConversation[];
  status: ListStatus;
  error: string | null;
};

const EMPTY_STATE: ChatListState = {
  context: null,
  contacts: [],
  conversations: [],
  status: 'loading',
  error: null,
};

function errorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : 'Không thể tải dữ liệu chat. Vui lòng thử lại.';
}

export function useChatConversations(enabled: boolean) {
  const [state, setState] = useState<ChatListState>(EMPTY_STATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const requestId = useRef(0);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (!enabled) return;
      const id = ++requestId.current;

      if (mode === 'refresh') {
        setState((current) => ({ ...current, status: 'refreshing', error: null }));
      }

      try {
        const [context, contacts, conversations] = await Promise.all([
          chatApi.getContext(),
          chatApi.listContacts(),
          chatApi.listConversations(),
        ]);
        if (!mountedRef.current || id !== requestId.current) return;

        setState({
          context,
          contacts,
          conversations,
          status: 'ready',
          error: null,
        });
      } catch (reason: unknown) {
        if (!mountedRef.current || id !== requestId.current) return;
        const message = errorMessage(reason);
        setState((current) =>
          current.context
            ? { ...current, status: 'ready', error: message }
            : { ...current, status: 'error', error: message },
        );
      }
    },
    [enabled],
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      mountedRef.current = true;
      const timer = setTimeout(() => void load('initial'), 0);
      const interval = setInterval(() => void load('silent'), POLL_INTERVAL);
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') void load('silent');
      });

      let active = true;
      let refreshTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleRefresh = () => {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          void load('silent');
        }, REALTIME_REFRESH_DELAY);
      };

      let hub: signalR.HubConnection | null = null;
      const hubUrl = getSignalRHubUrl('chat');
      if (!USE_MOCK_JOBS && hubUrl) {
        hub = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () =>
              getAccessToken().then((token) => token ?? ''),
            transport: signalR.HttpTransportType.LongPolling,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Warning)
          .build();
        hub.on('ConversationUpdated', scheduleRefresh);
        void hub
          .start()
          .then(() => {
            if (!active) void hub?.stop().catch(() => undefined);
          })
          .catch(() => undefined);
      }

      return () => {
        active = false;
        mountedRef.current = false;
        clearTimeout(timer);
        clearInterval(interval);
        subscription.remove();
        if (refreshTimer) clearTimeout(refreshTimer);
        if (hub) void hub.stop().catch(() => undefined);
      };
    }, [enabled, load]),
  );

  const refresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const createConversation = useCallback(
    async (input: CreateConversationInput): Promise<ChatConversation | null> => {
      if (!enabled || creating) return null;

      setCreating(true);
      setCreateError(null);
      try {
        const conversation = await chatApi.createConversation(input);
        setState((current) => ({
          ...current,
          conversations: [
            conversation,
            ...current.conversations.filter((item) => item.id !== conversation.id),
          ],
        }));
        return conversation;
      } catch (reason: unknown) {
        setCreateError(errorMessage(reason));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [creating, enabled],
  );

  return {
    context: state.context,
    contacts: state.contacts,
    conversations: state.conversations,
    status: state.status,
    error: state.error,
    creating,
    createError,
    refresh,
    createConversation,
    clearCreateError: () => setCreateError(null),
  };
}
