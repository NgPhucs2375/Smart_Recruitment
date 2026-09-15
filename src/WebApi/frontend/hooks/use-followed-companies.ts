"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hireai.followed.companies";

function readStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(
        parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
      );
    }
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * Local follow state for companies (mirrors use-bookmarks for jobs).
 * No backend follow endpoint exists, so follows persist per browser.
 * Emits hireai:followed-companies-updated so directory + followed page stay in sync.
 */
export function useFollowedCompanies() {
  const [followedIds, setFollowedIds] = useState<Set<number>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFollowedIds(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...followedIds]));
      window.dispatchEvent(new CustomEvent("hireai:followed-companies-updated"));
    } catch {
      // ignore quota
    }
  }, [followedIds, hydrated]);

  useEffect(() => {
    function sync() {
      setFollowedIds((current) => {
        const next = readStorage();
        if (next.size === current.size && [...next].every((v) => current.has(v))) return current;
        return next;
      });
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) sync();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("hireai:followed-companies-updated", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hireai:followed-companies-updated", sync);
    };
  }, []);

  const toggle = useCallback((id: number) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFollowed = useCallback((id: number) => followedIds.has(id), [followedIds]);

  return { followedIds, isFollowed, toggle, count: followedIds.size, hydrated };
}
