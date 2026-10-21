import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * Follow doanh nghiệp LOCAL — mirror use-followed-companies.ts của Web
 * (Web không có backend follow endpoint, persist per device).
 */
const STORAGE_KEY = 'hireai:followed-companies';

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: number[] | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readStorage(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    return [];
  }
}

async function writeStorage(ids: number[]): Promise<void> {
  cache = ids;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* Bỏ qua lỗi quota/disk — state in-memory vẫn đúng trong phiên. */
  }
  notify();
}

/** Hook local follow state, đồng bộ giữa các màn hình qua listener bus. */
export function useFollowedCompanies() {
  const [followedIds, setFollowedIds] = useState<number[]>(() => cache ?? []);
  const [hydrated, setHydrated] = useState(() => cache !== null);

  useEffect(() => {
    const unsubscribe = subscribe(() => setFollowedIds(cache ?? []));
    if (cache === null) {
      void readStorage().then((ids) => {
        cache = ids;
        setFollowedIds(ids);
        setHydrated(true);
      });
    }
    return unsubscribe;
  }, []);

  const toggle = useCallback((id: number) => {
    const current = cache ?? [];
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id];
    void writeStorage(next);
  }, []);

  const isFollowed = useCallback((id: number) => followedIds.includes(id), [followedIds]);

  return { followedIds, isFollowed, toggle, count: followedIds.length, hydrated };
}
