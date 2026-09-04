"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hireai.bookmarks";

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((v): v is string => typeof v === "string"));
    return new Set();
  } catch {
    return new Set();
  }
}

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBookmarkedIds(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarkedIds]));
      window.dispatchEvent(new CustomEvent("hireai:bookmarks-updated", { detail: [...bookmarkedIds] }));
    } catch {
      // ignore quota
    }
  }, [bookmarkedIds, hydrated]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setBookmarkedIds((current) => {
        const next = readStorage();
        return areSetsEqual(current, next) ? current : next;
      });
    }
    function onCustom() {
      setBookmarkedIds((current) => {
        const next = readStorage();
        return areSetsEqual(current, next) ? current : next;
      });
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("hireai:bookmarks-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hireai:bookmarks-updated", onCustom as EventListener);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarkedIds.has(id), [bookmarkedIds]);

  return { bookmarkedIds, isBookmarked, toggle, count: bookmarkedIds.size, hydrated };
}
