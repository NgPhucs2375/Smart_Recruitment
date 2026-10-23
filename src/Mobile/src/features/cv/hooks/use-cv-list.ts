import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { cvApi } from '@/features/cv/api/cv-api';
import type { CvSummary } from '@/features/cv/types';

type LoadMode = 'focus' | 'refresh';

export function useCvList() {
  const [items, setItems] = useState<CvSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async (mode: LoadMode) => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else if (!loadedRef.current) {
      setLoading(true);
    }
    setError('');

    try {
      const result = await cvApi.listMine();
      setItems(result.items);
      setDemo(result.source === 'demo');
      loadedRef.current = true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không thể tải danh sách CV. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('focus');
    }, [load]),
  );

  const refresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  return {
    items,
    loading,
    refreshing,
    error,
    demo,
    refresh,
  };
}
