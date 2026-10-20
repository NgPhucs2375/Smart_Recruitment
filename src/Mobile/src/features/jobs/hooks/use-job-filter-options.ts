import { useCallback, useEffect, useState } from 'react';

import { jobsApi } from '@/features/jobs/api/jobs-api';
import type { JobFilterOptions } from '@/features/jobs/types';

const EMPTY_OPTIONS: JobFilterOptions = { categories: [], skills: [] };

export function useJobFilterOptions() {
  const [options, setOptions] = useState<JobFilterOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    jobsApi
      .getFilterOptions()
      .then((result) => {
        if (!active) return;
        setOptions(result);
        setError(null);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Không tải được bộ lọc.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  return { options, loading, error, retry };
}
