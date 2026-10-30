import * as signalR from '@microsoft/signalr';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { getAccessToken } from '@/services/api/client';
import { getSignalRHubUrl } from '@/services/api/signalr';

import { notificationsApi } from './api/notifications-api';
import { resolveNotificationAudience } from './notification-target';
import type { NotificationAudience } from './types';

const POLL_INTERVAL = 30_000;
const EVENT_DEBOUNCE = 250;

type UnreadState = {
  audience: NotificationAudience | null;
  count: number;
};

type NotificationContextValue = {
  audience: NotificationAudience | null;
  unreadCount: number;
  revision: number;
  refreshUnread: () => Promise<void>;
  syncUnreadCount: (count: number) => void;
  adjustUnread: (delta: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function getNotificationHubUrl(): string | null {
  return getSignalRHubUrl(
    'notifications',
    process.env.EXPO_PUBLIC_SIGNALR_URL,
  );
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const audience = useMemo(
    () => resolveNotificationAudience(user?.roles),
    [user?.roles],
  );
  const enabled = status === 'signedIn' && audience !== null;

  const [unreadState, setUnreadState] = useState<UnreadState>({
    audience: null,
    count: 0,
  });
  const [revision, setRevision] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncUnreadCount = useCallback(
    (count: number) => {
      if (!audience) return;
      setUnreadState({ audience, count: Math.max(0, count) });
    },
    [audience],
  );

  const adjustUnread = useCallback(
    (delta: number) => {
      if (!audience) return;
      setUnreadState((current) => ({
        audience,
        count: Math.max(
          0,
          (current.audience === audience ? current.count : 0) + delta,
        ),
      }));
    },
    [audience],
  );

  const unreadCount =
    enabled && unreadState.audience === audience ? unreadState.count : 0;

  const refreshUnread = useCallback(async () => {
    if (!enabled || !audience) return;
    try {
      const count = await notificationsApi.unreadCount(audience);
      if (mountedRef.current) syncUnreadCount(count);
    } catch {
      // Giữ badge cũ khi mất mạng; polling/realtime sẽ thử lại.
    }
  }, [enabled, audience, syncUnreadCount]);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUnread();
  }, [enabled, refreshUnread]);

  useEffect(() => {
    if (!enabled || !audience) return;

    // Mock mode không có backend SignalR; dữ liệu mock thay đổi qua thao tác local.
    if (USE_MOCK_JOBS) return;

    let disposed = false;
    let connection: signalR.HubConnection | null = null;
    let pollingId: ReturnType<typeof setInterval> | null = null;
    let eventTimer: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      if (pollingId !== null) {
        clearInterval(pollingId);
        pollingId = null;
      }
    };

    const startPolling = () => {
      if (disposed || pollingId !== null) return;
      pollingId = setInterval(() => {
        void refreshUnread();
        setRevision((value) => value + 1);
      }, POLL_INTERVAL);
    };

    const bump = () => {
      if (eventTimer !== null) clearTimeout(eventTimer);
      eventTimer = setTimeout(() => {
        if (disposed) return;
        void refreshUnread();
        setRevision((value) => value + 1);
      }, EVENT_DEBOUNCE);
    };

    const hubUrl = getNotificationHubUrl();
    if (!hubUrl) {
      startPolling();
      return () => {
        disposed = true;
        stopPolling();
      };
    }

    void (async () => {
      // Gọi REST trước khi mở hub để API client refresh access token nếu cần.
      await refreshUnread();
      if (disposed) return;

      const token = await getAccessToken();
      if (!token) {
        startPolling();
        return;
      }

      const options: signalR.IHttpConnectionOptions = {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
        // The mobile client reaches this hub through the Next proxy, which
        // forwards HTTP but does not forward WebSocket upgrade requests.
        transport: signalR.HttpTransportType.LongPolling,
      };
      connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, options)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      connection.on('ReceiveNotification', bump);
      connection.onreconnected(() => {
        stopPolling();
        void refreshUnread();
        setRevision((value) => value + 1);
      });
      connection.onclose(() => {
        if (!disposed) startPolling();
      });

      try {
        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }
        stopPolling();
      } catch {
        if (!disposed) startPolling();
      }
    })();

    return () => {
      disposed = true;
      stopPolling();
      if (eventTimer !== null) clearTimeout(eventTimer);
      if (connection) void connection.stop();
    };
  }, [enabled, audience, refreshUnread]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void refreshUnread();
      setRevision((value) => value + 1);
    });
    return () => subscription.remove();
  }, [enabled, refreshUnread]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      audience: enabled ? audience : null,
      unreadCount,
      revision,
      refreshUnread,
      syncUnreadCount,
      adjustUnread,
    }),
    [
      enabled,
      audience,
      unreadCount,
      revision,
      refreshUnread,
      syncUnreadCount,
      adjustUnread,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotificationCenter(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used inside NotificationProvider.');
  }
  return context;
}
