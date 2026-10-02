"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Ref để toggle đọc trạng thái mới nhất mà không kèm followedIds vào deps.
  const followedRef = useRef(followedIds);
  useEffect(() => { followedRef.current = followedIds; }, [followedIds]);

  const toggle = useCallback((id: number) => {
    const wasFollowed = followedRef.current.has(id);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (wasFollowed) next.delete(id);
      else next.add(id);
      return next;
    });
    // Toast ngoài updater — strict mode gọi updater 2 lần, toast sẽ nhân đôi.
    toast.success(wasFollowed ? "Đã bỏ theo dõi công ty" : "Đã theo dõi công ty");
  }, []);

  const isFollowed = useCallback((id: number) => followedIds.has(id), [followedIds]);

  return { followedIds, isFollowed, toggle, count: followedIds.size, hydrated };
}
