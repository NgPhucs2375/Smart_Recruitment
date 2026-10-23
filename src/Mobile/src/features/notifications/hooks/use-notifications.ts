import { useCallback, useEffect, useRef, useState } from 'react';

import { useNotificationCenter } from '@/features/notifications/notification-provider';
import { notificationsApi } from '@/features/notifications/api/notifications-api';
import type { NotificationItem, NotificationType } from '@/features/notifications/types';

const PAGE_SIZE = 15;

type ListStatus = 'loading' | 'refreshing' | 'loadingMore' | 'ready' | 'error';

type ListState = {
  items: NotificationItem[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  status: ListStatus;
  error: string | null;
  loadMoreError: string | null;
};

const EMPTY_STATE: ListState = {
  items: [],
  totalCount: 0,
  page: 0,
  hasMore: true,
  status: 'loading',
  error: null,
  loadMoreError: null,
};

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ.';
}

export function useNotifications() {
  const { audience, revision, unreadCount, syncUnreadCount, adjustUnread } =
    useNotificationCenter();
  const [unreadOnly, setUnreadOnlyState] = useState(false);
  const [typeFilter, setTypeFilterState] = useState<NotificationType | null>(null);
  const [state, setState] = useState<ListState>(EMPTY_STATE);
  const requestId = useRef(0);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const revisionRef = useRef(revision);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (pageNumber: number, mode: 'initial' | 'refresh' | 'more' | 'silent') => {
      if (!audience) return;
      const id = ++requestId.current;

      try {
        const result = await notificationsApi.listPage({
          audience,
          pageNumber,
          pageSize: PAGE_SIZE,
          unreadOnly,
          type: typeFilter,
        });
        if (!mountedRef.current || id !== requestId.current) return;

        syncUnreadCount(result.unreadCount);
        setState((current) => {
          const base = mode === 'more' ? current.items : [];
          const seen = new Set(base.map((item) => item.id));
          const items = [...base, ...result.items.filter((item) => !seen.has(item.id))];
          return {
            items,
            totalCount: result.totalCount,
            page: result.pageNumber,
            hasMore: items.length < result.totalCount,
            status: 'ready',
            error: null,
            loadMoreError: null,
          };
        });
      } catch (reason: unknown) {
        if (!mountedRef.current || id !== requestId.current) return;
        const message = errorMessage(reason);

        setState((current) => {
          if (mode === 'more') {
            return { ...current, status: 'ready', loadMoreError: message };
          }
          if ((mode === 'refresh' || mode === 'silent') && current.items.length > 0) {
            return { ...current, status: 'ready', error: message };
          }
          return { ...current, status: 'error', error: message, items: [], totalCount: 0 };
        });
      }
    },
    [audience, unreadOnly, typeFilter, syncUnreadCount],
  );

  useEffect(() => {
    if (!audience) return;
    // Lần tải đầu tiên của bộ lọc hiện tại.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(1, 'initial');
  }, [audience, loadPage]);

  useEffect(() => {
    if (revision === revisionRef.current) return;
    revisionRef.current = revision;
    if (!audience) return;
    // Realtime chỉ reload im lặng, không chớp skeleton.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(1, 'silent');
  }, [revision, audience, loadPage]);

  const setUnreadOnly = useCallback(
    (next: boolean) => {
      if (next === unreadOnly) return;
      loadingMoreRef.current = false;
      setState(EMPTY_STATE);
      setUnreadOnlyState(next);
    },
    [unreadOnly],
  );

  const setTypeFilter = useCallback(
    (next: NotificationType | null) => {
      if (next === typeFilter) return;
      loadingMoreRef.current = false;
      setState(EMPTY_STATE);
      setTypeFilterState(next);
    },
    [typeFilter],
  );

  const refresh = useCallback(() => {
    setState((current) => ({ ...current, status: 'refreshing', error: null }));
    void loadPage(1, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (
      loadingMoreRef.current ||
      state.status !== 'ready' ||
      !state.hasMore ||
      !state.page
    ) {
      return;
    }
    loadingMoreRef.current = true;
    setState((current) => ({ ...current, status: 'loadingMore', loadMoreError: null }));
    void loadPage(state.page + 1, 'more').finally(() => {
      loadingMoreRef.current = false;
    });
  }, [state.status, state.hasMore, state.page, loadPage]);

  const retry = useCallback(() => {
    if (state.status === 'error') {
      setState(EMPTY_STATE);
      void loadPage(1, 'initial');
      return;
    }
    if (state.loadMoreError) loadMore();
  }, [state.status, state.loadMoreError, loadPage, loadMore]);

  const markRead = useCallback(
    async (id: number) => {
      if (!audience) return;
      const target = state.items.find((item) => item.id === id);
      if (!target || target.isRead) return;

      const previous = state;
      setState((current) => ({
        ...current,
        items: unreadOnly
          ? current.items.filter((item) => item.id !== id)
          : current.items.map((item) =>
              item.id === id ? { ...item, isRead: true } : item,
            ),
        totalCount: unreadOnly
          ? Math.max(0, current.totalCount - 1)
          : current.totalCount,
      }));
      adjustUnread(-1);

      try {
        await notificationsApi.markRead(audience, id);
      } catch (reason: unknown) {
        setState(previous);
        adjustUnread(1);
        throw reason;
      }
    },
    [audience, state, unreadOnly, adjustUnread],
  );

  const markAllRead = useCallback(async () => {
    if (!audience || unreadCount <= 0) return;

    const previous = state;
    const previousUnread = unreadCount;
    setState((current) => ({
      ...current,
      items: unreadOnly
        ? []
        : current.items.map((item) => ({ ...item, isRead: true })),
      totalCount: unreadOnly ? 0 : current.totalCount,
      hasMore: unreadOnly ? false : current.hasMore,
    }));
    syncUnreadCount(0);

    try {
      await notificationsApi.markAllRead(audience);
    } catch (reason: unknown) {
      setState(previous);
      syncUnreadCount(previousUnread);
      throw reason;
    }
  }, [audience, unreadCount, state, unreadOnly, syncUnreadCount]);

  const remove = useCallback(
    async (id: number) => {
      if (!audience) return;
      const target = state.items.find((item) => item.id === id);
      if (!target) return;

      const previous = state;
      setState((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== id),
        totalCount: Math.max(0, current.totalCount - 1),
      }));
      if (!target.isRead) adjustUnread(-1);

      try {
        await notificationsApi.remove(audience, id);
      } catch (reason: unknown) {
        setState(previous);
        if (!target.isRead) adjustUnread(1);
        throw reason;
      }
    },
    [audience, state, adjustUnread],
  );

  return {
    audience,
    unreadOnly,
    setUnreadOnly,
    typeFilter,
    setTypeFilter,
    items: state.items,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
    status: state.status,
    error: state.error,
    loadMoreError: state.loadMoreError,
    refresh,
    loadMore,
    retry,
    markRead,
    markAllRead,
    remove,
  };
}
