import { useCallback, useEffect, useRef, useState } from 'react';

import { applicationsApi } from '@/features/applications/api/applications-api';
import { getApplicationStatus } from '@/features/applications/constants';
import type { ApplicationSummary } from '@/features/applications/types';

const PAGE_SIZE = 20;

type ListStatus = 'loading' | 'refreshing' | 'loadingMore' | 'ready' | 'error';

type ListState = {
  items: ApplicationSummary[];
  totalCount: number;
  hasMore: boolean;
  status: ListStatus;
  error: string | null;
  loadMoreError: string | null;
};

const EMPTY_STATE: ListState = {
  items: [],
  totalCount: 0,
  hasMore: true,
  status: 'loading',
  error: null,
  loadMoreError: null,
};

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ.';
}

export function useApplications() {
  const [statusFilter, setStatusFilterState] = useState<number | null>(null);
  const statusFilterRef = useRef<number | null>(null);
  const [state, setState] = useState<ListState>(EMPTY_STATE);
  const requestId = useRef(0);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (offset: number, mode: 'initial' | 'refresh' | 'more') => {
      const id = ++requestId.current;

      try {
        const result = await applicationsApi.listPage({
          offset,
          limit: PAGE_SIZE,
          statusCode: statusFilter,
        });
        if (!mountedRef.current || id !== requestId.current) return;

        setState((current) => {
          const base = mode === 'more' ? current.items : [];
          const seen = new Set(base.map((item) => item.id));
          const items = [
            ...base,
            ...result.items.filter((item) => !seen.has(item.id)),
          ];
          return {
            items,
            totalCount: result.totalCount,
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
          if (mode === 'refresh' && current.items.length > 0) {
            return { ...current, status: 'ready', error: message };
          }
          return { ...current, status: 'error', error: message, items: [], totalCount: 0 };
        });
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    // Initial load follows the active status filter; results are applied asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(0, 'initial');
  }, [loadPage]);

  const setStatusFilter = useCallback((next: number | null) => {
    if (statusFilterRef.current === next) return;
    statusFilterRef.current = next;
    setState(EMPTY_STATE);
    setStatusFilterState(next);
  }, []);

  const refresh = useCallback(() => {
    setState((current) => ({ ...current, status: 'refreshing', error: null }));
    void loadPage(0, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || state.status !== 'ready' || !state.hasMore) return;
    loadingMoreRef.current = true;
    setState((current) => ({ ...current, status: 'loadingMore', loadMoreError: null }));
    void loadPage(state.items.length, 'more').finally(() => {
      loadingMoreRef.current = false;
    });
  }, [state.status, state.hasMore, state.items.length, loadPage]);

  const retry = useCallback(() => {
    if (state.status === 'error') {
      setState(EMPTY_STATE);
      void loadPage(0, 'initial');
      return;
    }
    if (state.loadMoreError) loadMore();
  }, [state.status, state.loadMoreError, loadPage, loadMore]);

  const markWithdrawn = useCallback(
    (id: string) => {
      const withdrawn = getApplicationStatus(4);
      setState((current) => {
        if (statusFilter !== null && statusFilter !== withdrawn.code) {
          const removed = current.items.some((item) => item.id === id);
          return {
            ...current,
            items: current.items.filter((item) => item.id !== id),
            totalCount: removed ? Math.max(0, current.totalCount - 1) : current.totalCount,
          };
        }
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  statusCode: withdrawn.code,
                  statusLabel: withdrawn.label,
                  statusTone: withdrawn.tone,
                }
              : item,
          ),
        };
      });
    },
    [statusFilter],
  );

  return {
    statusFilter,
    setStatusFilter,
    items: state.items,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
    status: state.status,
    error: state.error,
    loadMoreError: state.loadMoreError,
    refresh,
    loadMore,
    retry,
    markWithdrawn,
  };
}
