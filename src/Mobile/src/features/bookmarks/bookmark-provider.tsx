import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

const STORAGE_KEY = 'smart-recruitment.saved-jobs.v1';

type BookmarkContextValue = {
  ids: string[];
  isLoaded: boolean;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: PropsWithChildren) {
  const [ids, setIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((id): id is string => typeof id === 'string'));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIsLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoaded) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => undefined);
  }, [ids, isLoaded]);

  const isBookmarked = useCallback((id: string) => ids.includes(id), [ids]);
  const toggleBookmark = useCallback((id: string) => {
    setIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }, []);

  const value = useMemo(
    () => ({ ids, isLoaded, isBookmarked, toggleBookmark }),
    [ids, isLoaded, isBookmarked, toggleBookmark],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error('useBookmarks must be used inside BookmarkProvider.');
  return context;
}
