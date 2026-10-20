import { useCallback, useEffect, useRef, useState } from 'react';

import { jobsApi } from '@/features/jobs/api/jobs-api';
import { MAX_SKILLS } from '@/features/jobs/constants';
import {
  createEmptyFilters,
  type Job,
  type JobFilterKey,
  type JobFilters,
  type JobSearchParams,
  type JobSort,
} from '@/features/jobs/types';

type SearchStatus = 'loading' | 'refreshing' | 'loadingMore' | 'ready' | 'error';

type SearchState = {
  items: Job[];
  totalCount: number;
  hasMore: boolean;
  status: SearchStatus;
  error: string | null;
  loadMoreError: string | null;
};

export type JobSearchQuery = {
  keyword: string;
  filters: JobFilters;
  sort: JobSort;
};

const INITIAL_STATE: SearchState = {
  items: [],
  totalCount: 0,
  hasMore: true,
  status: 'loading',
  error: null,
  loadMoreError: null,
};

function normalizeFilters(filters: JobFilters): JobFilters {
  const skillIds = Array.from(new Set(filters.skillIds)).slice(0, MAX_SKILLS);
  return {
    ...filters,
    skillIds,
    matchAllSkills: skillIds.length >= 2 ? filters.matchAllSkills : false,
  };
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ.';
}

export function useJobSearch() {
  const [query, setQuery] = useState<JobSearchQuery>({
    keyword: '',
    filters: createEmptyFilters(),
    sort: 'newest',
  });
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const requestId = useRef(0);
  const pageRef = useRef(0);
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      const id = ++requestId.current;
      const params: JobSearchParams = {
        keyword: query.keyword,
        filters: query.filters,
        sort: query.sort,
        page: targetPage,
      };

      try {
        const result = await jobsApi.getJobs(params);
        if (!mountedRef.current || id !== requestId.current) return;

        pageRef.current = result.page;
        setState((current) => {
          const base = mode === 'more' ? current.items : [];
          const seen = new Set(base.map((job) => job.id));
          return {
            items: [...base, ...result.jobs.filter((job) => !seen.has(job.id))],
            totalCount: result.totalCount,
            hasMore: result.hasNext,
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
    [query],
  );

  useEffect(() => {
    let active = true;
    const id = ++requestId.current;
    const params: JobSearchParams = {
      keyword: query.keyword,
      filters: query.filters,
      sort: query.sort,
      page: 1,
    };

    jobsApi
      .getJobs(params)
      .then((result) => {
        if (!active || !mountedRef.current || id !== requestId.current) return;

        pageRef.current = result.page;
        setState({
          items: result.jobs,
          totalCount: result.totalCount,
          hasMore: result.hasNext,
          status: 'ready',
          error: null,
          loadMoreError: null,
        });
      })
      .catch((reason: unknown) => {
        if (!active || !mountedRef.current || id !== requestId.current) return;

        setState((current) => ({
          ...current,
          status: 'error',
          error: errorMessage(reason),
          items: [],
          totalCount: 0,
        }));
      });

    return () => {
      active = false;
    };
  }, [query]);

  const prepareNewSearch = useCallback(() => {
    setState((current) => ({
      ...current,
      items: [],
      totalCount: 0,
      hasMore: true,
      status: 'loading',
      error: null,
      loadMoreError: null,
    }));
  }, []);

  const refresh = useCallback(() => {
    setState((current) => ({ ...current, status: 'refreshing', error: null }));
    void loadPage(1, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || state.status !== 'ready' || !state.hasMore) return;
    loadingMoreRef.current = true;
    setState((current) => ({ ...current, status: 'loadingMore', loadMoreError: null }));
    void loadPage(pageRef.current + 1, 'more').finally(() => {
      loadingMoreRef.current = false;
    });
  }, [state.status, state.hasMore, loadPage]);

  const search = useCallback(
    (keyword: string) => {
      prepareNewSearch();
      setQuery((current) => ({ ...current, keyword: keyword.trim() }));
    },
    [prepareNewSearch],
  );

  const applyFilters = useCallback(
    (filters: JobFilters) => {
      prepareNewSearch();
      setQuery((current) => ({ ...current, filters: normalizeFilters(filters) }));
    },
    [prepareNewSearch],
  );

  const clearFilters = useCallback(() => {
    prepareNewSearch();
    setQuery((current) => ({ ...current, filters: createEmptyFilters() }));
  }, [prepareNewSearch]);

  const changeSort = useCallback(
    (sort: JobSort) => {
      if (query.sort === sort) return;
      prepareNewSearch();
      setQuery((current) => ({ ...current, sort }));
    },
    [query.sort, prepareNewSearch],
  );

  const removeFilter = useCallback(
    (key: JobFilterKey, value?: number) => {
      prepareNewSearch();
      setQuery((current) => {
        const filters: JobFilters = {
          ...current.filters,
          skillIds: [...current.filters.skillIds],
        };

        if (key === 'salary') {
          filters.salaryMin = undefined;
          filters.salaryMax = undefined;
        } else if (key === 'categoryId') {
          filters.categoryId = undefined;
        } else if (key === 'skill') {
          filters.skillIds = filters.skillIds.filter((id) => id !== value);
          if (filters.skillIds.length < 2) filters.matchAllSkills = false;
        } else {
          filters[key] = '';
        }

        return { ...current, filters };
      });
    },
    [prepareNewSearch],
  );

  const retry = useCallback(() => {
    if (state.status === 'error') {
      prepareNewSearch();
      void loadPage(1, 'initial');
      return;
    }
    if (state.loadMoreError) loadMore();
  }, [state.status, state.loadMoreError, prepareNewSearch, loadPage, loadMore]);

  return {
    query,
    items: state.items,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
    status: state.status,
    error: state.error,
    loadMoreError: state.loadMoreError,
    search,
    applyFilters,
    clearFilters,
    changeSort,
    removeFilter,
    refresh,
    loadMore,
    retry,
  };
}
